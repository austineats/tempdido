/**
 * Instagram 24-hour Messaging Window Tracker
 *
 * Instagram's API only allows sending messages to a user within 24 hours
 * of that user's last message to the business account. This module tracks
 * that window using the InstagramWindow Prisma model and provides helpers
 * for queuing outbound messages when the window is closed.
 */

import { prisma } from "../db.js";

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ---------------------------------------------------------------------------
// Core window helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the 24-hour messaging window is currently open for a given
 * Instagram-scoped user ID.
 */
export async function isWindowOpen(igId: string): Promise<boolean> {
  const record = await prisma.instagramWindow.findUnique({
    where: { ig_id: igId },
  });

  if (!record) return false;

  const elapsed = Date.now() - record.last_user_message.getTime();
  return elapsed < WINDOW_MS;
}

/**
 * Record / refresh the timestamp of the latest inbound message from a user.
 * Call this every time we receive a message from the Instagram user so that
 * the 24-hour window stays accurate.
 */
export async function recordUserMessage(igId: string): Promise<void> {
  await prisma.instagramWindow.upsert({
    where: { ig_id: igId },
    update: { last_user_message: new Date() },
    create: {
      ig_id: igId,
      last_user_message: new Date(),
    },
  });
}

/**
 * Return the exact Date at which the current messaging window expires, or
 * `null` if no window has ever been opened for this user.
 */
export async function getWindowExpiry(igId: string): Promise<Date | null> {
  const record = await prisma.instagramWindow.findUnique({
    where: { ig_id: igId },
  });

  if (!record) return null;

  return new Date(record.last_user_message.getTime() + WINDOW_MS);
}

// ---------------------------------------------------------------------------
// Message queue — store outbound messages when the window is closed
// ---------------------------------------------------------------------------

/**
 * Append a message to the queue for a given user. Messages in the queue will
 * be sent the next time the user messages us and the window reopens.
 */
export async function queueMessage(
  igId: string,
  message: string,
): Promise<void> {
  // Upsert so we also create the row if it doesn't exist yet.
  const existing = await prisma.instagramWindow.findUnique({
    where: { ig_id: igId },
  });

  const currentQueue: string[] = existing
    ? (existing.queued_messages as string[])
    : [];

  const updatedQueue = [...currentQueue, message];

  await prisma.instagramWindow.upsert({
    where: { ig_id: igId },
    update: { queued_messages: updatedQueue },
    create: {
      ig_id: igId,
      last_user_message: new Date(0), // no real window yet
      queued_messages: updatedQueue,
    },
  });
}

/**
 * Retrieve all queued messages for a user and clear the queue atomically.
 * Returns an empty array if there are no queued messages.
 */
export async function getQueuedMessages(igId: string): Promise<string[]> {
  const record = await prisma.instagramWindow.findUnique({
    where: { ig_id: igId },
  });

  if (!record) return [];

  const messages = record.queued_messages as string[];

  if (messages.length === 0) return [];

  // Clear the queue now that we've read it.
  await prisma.instagramWindow.update({
    where: { ig_id: igId },
    data: { queued_messages: [] },
  });

  return messages;
}
