# x2 by Ditto — Meta Instagram DM Setup Guide

Complete step-by-step to get the Instagram DM agent working from scratch on a new account.

---

## Part 1: Instagram Account Setup

1. **Create or use an Instagram account** for x2 (e.g., `@x2byditto`)
2. Go to Instagram Settings → **Account** → **Switch to Professional Account** → choose **Business** or **Creator**
3. When prompted, **connect a Facebook Page** (create one if you don't have one — name it "x2 by Ditto" or similar)
4. Make sure the Instagram account is **public** (not private)

---

## Part 2: Meta Business Setup

1. Go to **https://business.facebook.com** → create a Business Portfolio (if you don't have one)
2. Add your Facebook Page to the Business Portfolio
3. Go to **Business Settings** → **Accounts** → **Pages** → verify your Page is listed

---

## Part 3: Meta Developer App

1. Go to **https://developers.facebook.com/apps/** → click **Create App**
2. Choose app type: **Business**
3. Name it something like "x2 Ditto" → select your Business Portfolio → create
4. You'll land on the App Dashboard

### Add Products:
5. In the left sidebar, click **Add Product**
6. Find **Webhooks** → click **Set Up**
7. Find **Instagram** (or **Instagram Basic Display**) → click **Set Up** (if available)

### Configure Webhooks:
8. Go to **Webhooks** in left sidebar
9. From the dropdown, select **Instagram**
10. Click **Subscribe to this object**
11. Enter:
    - **Callback URL:** `https://lexicostatistic-interspecial-terrell.ngrok-free.dev/api/webhook/instagram`
    - **Verify Token:** `ditto_instagram_2026`
12. Click **Verify and Save** — should succeed (our endpoint is live)
13. Subscribe to these fields (check the boxes):
    - `messages`
    - `messaging_postbacks`
    - `messaging_seen`
    - `messaging_referral`
    - `message_reactions`

---

## Part 4: Generate Tokens

### Get Page Access Token:
1. Go to **https://developers.facebook.com/tools/explorer/**
2. Select your app from the **Application** dropdown
3. Click **Get Token** → **Get Page Access Token**
4. Select your Facebook Page (the one linked to your Instagram)
5. Grant ALL requested permissions — especially:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_messaging`
   - `pages_manage_metadata`
   - `pages_read_engagement`
   - `pages_show_list`
6. Copy the **Page Access Token** (this is what we need, NOT the User Access Token)

### Get a Long-Lived Token (so it doesn't expire in 1 hour):
7. In Graph API Explorer, run:
   ```
   GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_PAGE_TOKEN}
   ```
   Or use this curl (replace values):
   ```bash
   curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_PAGE_TOKEN"
   ```
   This returns a token that lasts ~60 days.

### Get App Secret:
8. Go to **App Dashboard** → **Settings** → **Basic**
9. Click **Show** next to **App Secret** → copy it

### Get Instagram Account ID:
10. In Graph API Explorer, with your Page Access Token selected, run:
    ```
    GET /me/instagram_accounts?fields=id,username
    ```
    Or:
    ```
    GET /{page-id}?fields=instagram_business_account
    ```
    Copy the Instagram account ID (numeric string like `17841400123456789`)

---

## Part 5: Update .env

Once you have all the values, update `/Users/bitseven/Ditto 2v2 MVP/backend/.env`:

```
META_APP_ID=<your app id>
META_APP_SECRET=<your app secret>
META_PAGE_ACCESS_TOKEN=<your long-lived page access token>
META_VERIFY_TOKEN=ditto_instagram_2026
INSTAGRAM_ACCOUNT_ID=<your instagram account id>
```

Then restart the backend:
```bash
cd "/Users/bitseven/Ditto 2v2 MVP/backend"
npm run build && node dist/server.js
```

---

## Part 6: Enable Subscriptions via API

After the .env is updated and backend is running, run this curl to enable webhook subscriptions:

```bash
curl -i -X POST "https://graph.instagram.com/v21.0/INSTAGRAM_ACCOUNT_ID/subscribed_apps?subscribed_fields=messages,messaging_postbacks,messaging_seen,messaging_referral,message_reactions&access_token=YOUR_PAGE_ACCESS_TOKEN"
```

Should return: `{"success": true}`

---

## Part 7: Test

1. From a **different Instagram account** (not @x2byditto), send a DM to @x2byditto
2. Check the backend logs — you should see:
   ```
   [instagram] message from IGSID: hello
   [ditto] Processing message from IGSID...
   ```
3. The agent should reply in Instagram DMs

---

## Part 8: Go Live (for production)

1. In App Dashboard → set app to **Live** mode (top toggle)
2. Submit for **App Review** if needed for `instagram_manage_messages` permission
3. Business Verification may be required
4. Replace ngrok URL with production domain in webhook settings

---

## Architecture Summary

```
Instagram DM → Meta Webhook → ngrok → localhost:4000/api/webhook/instagram
                                            ↓
                                    webhookHandler.ts (parse event)
                                            ↓
                                    bublAgent.ts (handleInstagramMessage)
                                            ↓
                                    LLM generates reply
                                            ↓
                                    instagramClient.ts (sendText via Graph API)
                                            ↓
                                    Instagram DM ← reply appears
```

## Current Credentials Location
- `.env` file: `/Users/bitseven/Ditto 2v2 MVP/backend/.env`
- Ngrok domain: `lexicostatistic-interspecial-terrell.ngrok-free.dev`
- Ngrok authtoken: configured in `~/Library/Application Support/ngrok/ngrok.yml`
- Webhook verify token: `ditto_instagram_2026`

## Key Files
- `backend/src/lib/instagram/instagramClient.ts` — sends messages via Graph API
- `backend/src/lib/instagram/webhookHandler.ts` — parses incoming webhooks
- `backend/src/lib/instagram/windowTracker.ts` — tracks 24h messaging window
- `backend/src/routes/instagramWebhook.ts` — Express webhook route
- `backend/src/bublAgent.ts` — main agent logic (LLM + conversation)
- `backend/prisma/schema.prisma` — DB schema with ig_id fields
