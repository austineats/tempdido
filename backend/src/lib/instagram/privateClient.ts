/**
 * Instagram Private API Client
 *
 * Calls a Python instagrapi script for actual IG operations.
 * Session is saved/reused — login only happens once.
 * Credentials come from env vars, never hardcoded.
 */
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PYTHON = process.env.PYTHON_PATH || "python3.12";
const SCRIPT = path.join(__dirname, "../../ig_bridge.py");
const SESSION_FILE = path.join(__dirname, "../../../ig_session.json");

function callPython(action: string, args: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      IG_ACTION: action,
      IG_SESSION_FILE: SESSION_FILE,
      ...Object.fromEntries(Object.entries(args).map(([k, v]) => [`IG_ARG_${k.toUpperCase()}`, v])),
    };

    execFile(PYTHON, [SCRIPT], { env, timeout: 30000 }, (err, stdout, stderr) => {
      if (stderr) console.error("[IG Bridge stderr]", stderr.trim());
      if (err) {
        reject(new Error(`IG Bridge failed: ${err.message}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error(`IG Bridge bad output: ${stdout.trim()}`));
      }
    });
  });
}

// ── Send DM by username ──
export async function sendDMByUsername(username: string, text: string): Promise<boolean> {
  try {
    const result = await callPython("send_dm", { username, text });
    if (result.ok) {
      console.log(`[IG Private] DM sent to @${username}: "${text.slice(0, 60)}"`);
      return true;
    }
    console.error(`[IG Private] DM failed to @${username}:`, result.error);
    return false;
  } catch (e: any) {
    console.error(`[IG Private] DM error:`, e.message);
    return false;
  }
}

// ── Send multiple messages with delay ──
export async function sendDMsByUsername(username: string, messages: string[]): Promise<void> {
  for (const msg of messages) {
    await sendDMByUsername(username, msg);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
  }
}

// ── Check if user exists ──
export async function checkUserExists(username: string): Promise<boolean> {
  try {
    const result = await callPython("check_user", { username });
    return result.ok && result.exists;
  } catch {
    return false;
  }
}

// ── Test login / session validity ──
export async function testConnection(): Promise<boolean> {
  try {
    const result = await callPython("test");
    return result.ok;
  } catch {
    return false;
  }
}
