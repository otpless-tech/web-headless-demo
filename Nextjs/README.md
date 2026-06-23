# OTPless Headless SDK — Next.js Demo

A Next.js 14 (App Router) + TypeScript demo of [OTPless](https://otpless.com) passwordless authentication. Covers two integration modes (NPM package hook vs. legacy CDN script) and three auth channels (Phone SMS, Email, OAuth).

---

## Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Project Structure](#project-structure)
- [Next.js-Specific Notes](#nextjs-specific-notes)
- [Integration Mode 1 — NPM Package (Recommended)](#integration-mode-1--npm-package-recommended)
- [Integration Mode 2 — Legacy CDN Script](#integration-mode-2--legacy-cdn-script)
- [Auth Channels](#auth-channels)
- [Event Reference](#event-reference)
- [Response Schemas](#response-schemas)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18 or later
- An **OTPless App ID** — [get one free](https://otpless.com/login)

---

## Setup

```bash
# 1. Install dependencies
cd Nextjs
npm install

# 2. Set your App ID
#    .env is already present — just replace the placeholder
nano .env
```

`.env`:

```env
NEXT_PUBLIC_OTPLESS_APP_ID=YOUR_APP_ID_HERE
NEXT_PUBLIC_OTP_LENGTH=6
```

> For production, use `.env.local` instead — Next.js reads it automatically and it should **not** be committed to git.

```bash
# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page has links to the **/package** and **/legacy** routes.

---

## Project Structure

```
Nextjs/
├── src/
│   └── app/
│       ├── layout.tsx                    # Root layout
│       ├── page.tsx                      # Home — links to /package and /legacy
│       ├── package/
│       │   └── page.tsx                  # NPM package demo route
│       └── legacy/
│           └── page.tsx                  # Legacy CDN script demo route
│
├── src/
│   ├── components/
│   │   ├── OTPlessUI/                    # Full auth UI (tabs, steps, success)
│   │   │   ├── index.tsx                 #   UI orchestrator
│   │   │   ├── Tabs.tsx                  #   Phone / Email / Social tabs
│   │   │   ├── AuthStep.tsx              #   Login form
│   │   │   ├── OTPStep.tsx               #   OTP entry form
│   │   │   ├── LinkStep.tsx              #   Magic-link waiting state
│   │   │   └── SuccessStep.tsx           #   Token display
│   │   ├── OTPInput.tsx                  # Auto-advance digit input
│   │   ├── Response.tsx                  # Collapsible JSON response viewer
│   │   ├── PhoneIcon.tsx
│   │   └── AlertIcon.tsx
│   │
│   ├── containers/
│   │   ├── OTPlessPackage.tsx            # ★ NPM hook integration
│   │   └── OTPlessLegacy.tsx             # Legacy CDN script integration
│   │
│   └── helpers/
│       ├── otpless.ts                    # Legacy SDK loader + request dispatcher
│       ├── appendResponse.ts             # Response DOM logger (SSR-safe)
│       ├── deviceDetection.ts            # Android detection (SSR-safe)
│       └── getStepsText.ts               # Step label strings
│
├── next.config.js
├── .env                                  # App ID + OTP length (edit this)
├── .env.example                          # Reference copy
└── package.json
```

---

## Next.js-Specific Notes

### `NEXT_PUBLIC_` prefix is required

Next.js only exposes environment variables to client-side code when they are prefixed with `NEXT_PUBLIC_`. Without this prefix, `process.env.YOUR_VAR` evaluates to `undefined` in the browser.

```env
# ✓ correct — accessible in client components
NEXT_PUBLIC_OTPLESS_APP_ID=YOUR_APP_ID

# ✗ wrong — undefined in the browser
OTPLESS_APP_ID=YOUR_APP_ID
```

### SSR safety — `typeof document` guards

The OTPless SDK requires `document` and `window`, which do not exist during server-side rendering. All SDK calls in `helpers/` check for the browser environment:

```ts
if (typeof document === "undefined") return resolve();
```

### All containers are Client Components

Both `OTPlessPackage.tsx` and `OTPlessLegacy.tsx` are marked `"use client"` at the top. They only run in the browser.

### `.env.local` for production credentials

Next.js loads env files in this priority order (highest first):

```
.env.local          ← highest priority; should be in .gitignore
.env.development    ← only in development
.env                ← base, committed to git
```

For your App ID, prefer `.env.local` so it never ends up in version control:

```bash
echo "NEXT_PUBLIC_OTPLESS_APP_ID=YOUR_APP_ID" >> .env.local
```

---

## Integration Mode 1 — NPM Package (Recommended)

File: `src/containers/OTPlessPackage.tsx`

### Install

```bash
npm install otpless-headless-js
```

### 1. Initialize the SDK

```tsx
"use client";
import { useOTPless } from "otpless-headless-js";
import { useEffect } from "react";

export default function AuthComponent() {
  const { init, initiate, verify, on, loading } = useOTPless();

  useEffect(() => {
    if (!init || !on) return;

    init(process.env.NEXT_PUBLIC_OTPLESS_APP_ID || "YOUR_APP_ID");

    const off = on({
      ONETAP: handleSuccess,
      OTP_AUTO_READ: handleAutoRead,
      FAILED: handleFailed,
      FALLBACK_TRIGGERED: handleFallback,
    });

    return () => off();
  }, [init, on]);
}
```

### 2. Initiate Phone OTP

```tsx
import { CHANNELS } from "otpless-headless-js";

const handlePhoneSubmit = async () => {
  const response = await initiate({
    channel: CHANNELS.PHONE,
    phone: "9876543210",
    countryCode: "91",

    // Pass custom data through the flow — returned as-is in ONETAP
    metaData: { source: "nextjs-demo" },
  });

  if (response.success) {
    setStep("otp");
  } else {
    setError(response.response?.errorMessage ?? "Failed to send OTP");
  }
};
```

### 3. Initiate Email OTP / Magic Link

```tsx
const handleEmailSubmit = async () => {
  const response = await initiate({
    channel: CHANNELS.EMAIL,
    email: "user@example.com",
  });

  if (response.success) {
    const nextStep = response.response?.authType === "EMAIL_LOGIN" ? "link" : "otp";
    setStep(nextStep);
  }
};
```

### 4. Verify OTP

```tsx
const handleOtpSubmit = async () => {
  const response = await verify({
    channel: CHANNELS.PHONE,
    phone: "9876543210",
    countryCode: "91",
    otp: "123456",
  });

  // On success the ONETAP event fires — handle it in the event callback
  if (!response.success) {
    setError(response.response?.errorMessage ?? "Invalid OTP");
  }
};
```

### 5. Handle Events

```tsx
const handleSuccess = (e: OTPlessResponse) => {
  const { token, idToken, userId } = e.response ?? {};

  // Store session and navigate to your app
  localStorage.setItem("otpless_token", token ?? "");
  router.push("/dashboard"); // Next.js router
};

const handleAutoRead = (e: OTPlessResponse) => {
  // Android only — auto-detected OTP from SMS
  const otp = e.response?.otp;
  if (otp) setOtp(otp.split(""));
};

const handleFailed = (e: OTPlessResponse) => {
  setError(e.response?.errorMessage ?? "Authentication failed");
  setStep("auth"); // reset to login form
};

const handleFallback = (e: OTPlessResponse) => {
  // SDK switched delivery channel (e.g. SMS → voice OTP)
};
```

---

## Integration Mode 2 — Legacy CDN Script

File: `src/containers/OTPlessLegacy.tsx`  
Helper: `src/helpers/otpless.ts`

### How it loads

The `OTPlessSdk()` helper injects the script into `<head>` at runtime:

```ts
const script = document.createElement("script");
script.src = "https://otpless.com/v4.3/headless.js";
script.setAttribute("data-appid", process.env.NEXT_PUBLIC_OTPLESS_APP_ID || "YOUR_APP_ID");
document.head.appendChild(script);
```

### Dispatch requests

```ts
// Initiate
const res = await hitOTPlessSdk({
  requestType: "initiate",
  request: { channel: "PHONE", phone: "9876543210", countryCode: "91" },
});

// Verify
const res = await hitOTPlessSdk({
  requestType: "verify",
  request: { channel: "PHONE", phone: "9876543210", countryCode: "91", otp: "123456" },
});
```

---

## Auth Channels

### Phone (SMS OTP)

```ts
await initiate({ channel: CHANNELS.PHONE, phone: "9876543210", countryCode: "91" });
await verify({ channel: CHANNELS.PHONE, phone: "9876543210", countryCode: "91", otp: "123456" });
```

### Email (Magic Link or OTP)

```ts
await initiate({ channel: CHANNELS.EMAIL, email: "user@example.com" });
// authType "EMAIL_LOGIN" → magic link, no verify() call needed
// authType "OTP"        → call verify() with the emailed code
```

### Google OAuth

```ts
import { OAUTH_CHANNELS } from "otpless-headless-js";
await initiate({ channel: CHANNELS.OAUTH, channelType: OAUTH_CHANNELS.GOOGLE });
```

### Truecaller (Android only)

```ts
if (!isAndroid()) return; // Truecaller requires the app on an Android device
await initiate({ channel: CHANNELS.OAUTH, channelType: OAUTH_CHANNELS.TRUE_CALLER });
```

### Country Codes

| Country | Code |
|---|---|
| India | `91` |
| United States | `1` |
| United Kingdom | `44` |
| UAE | `971` |
| Singapore | `65` |

---

## Event Reference

| Event | `statusCode` | When it fires |
|---|---|---|
| `SDK_READY` | — | SDK loaded and initialized |
| `INITIATE` | `200` / `4xx` | OTP sent (or failed to send) |
| `OTP_AUTO_READ` | — | Android auto-detected incoming SMS OTP |
| `VERIFY` | `200` / `4xx` | OTP verification attempted |
| `ONETAP` | `200` | Authentication succeeded |
| `DELIVERY_STATUS` | — | SMS delivery status update |
| `FALLBACK_TRIGGERED` | — | SDK retried with a different delivery channel |
| `FAILED` | — | Unrecoverable error in the auth flow |

---

## Response Schemas

### ONETAP (success)

```jsonc
{
  "responseType": "ONETAP",
  "statusCode": 200,
  "response": {
    "token":   "<jwt>",   // use for API auth (Authorization: Bearer <token>)
    "idToken": "<jwt>",   // decode to get sub, phone_number, email, etc.
    "userId":  "<uuid>"   // stable OTPless user identifier
  }
}
```

### INITIATE

```jsonc
// Success
{ "responseType": "INITIATE", "statusCode": 200, "response": { "authType": "OTP" } }

// authType values:
// "OTP"        — 6-digit SMS code; show OTP input
// "MAGICLINK"  — magic link sent; show "check your email" screen
// "OAUTH"      — OAuth redirect started; wait for ONETAP

// Failure
{ "responseType": "INITIATE", "statusCode": 400, "response": { "errorMessage": "Invalid phone number" } }
```

### OTP_AUTO_READ

```jsonc
{ "responseType": "OTP_AUTO_READ", "response": { "otp": "123456" } }
```

### FAILED

```jsonc
{ "responseType": "FAILED", "response": { "errorMessage": "Session expired" } }
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_OTPLESS_APP_ID` | **Yes** | Your OTPless App ID |
| `NEXT_PUBLIC_OTP_LENGTH` | No | Number of OTP digits (default `6`) |

Both variables must have the `NEXT_PUBLIC_` prefix to be accessible in Client Components.

```bash
# Development — committed to git, contains placeholder
.env

# Local override — not committed to git, contains real ID
.env.local
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Production build |
| `npm start` | Start production server (requires prior `build`) |
| `npm run lint` | ESLint |

---

## Production Checklist

- [ ] Move your real App ID from `.env` to `.env.local` (add `.env.local` to `.gitignore`)
- [ ] Implement the `ONETAP` handler: store `token` and redirect with `router.push()`
- [ ] Validate `token` server-side: `GET https://headless-auth.otpless.com/v1/user/session/validate`
- [ ] Implement the `FAILED` handler: surface `errorMessage` and allow retry
- [ ] Replace hardcoded `countryCode: "91"` with a country selector if you serve international users
- [ ] Add security headers in `next.config.js` (CSP, HSTS, X-Frame-Options)
- [ ] Remove `console.log` statements from event handlers
- [ ] Test on Android to verify SMS auto-read works
- [ ] Configure allowed redirect URIs in OTPless Dashboard for Google OAuth

---

## Troubleshooting

**`process.env.NEXT_PUBLIC_OTPLESS_APP_ID` is `undefined` at runtime**
- The variable must be prefixed with `NEXT_PUBLIC_`
- After editing `.env` you must restart the dev server

**"OTPless SDK not loaded properly" in console**
- Check that your App ID is correct in `.env`
- Ensure the OTPless CDN script URL is not blocked by a browser extension or corporate firewall

**Google OAuth redirect loops**
- Add your app's origin (`http://localhost:3000` for dev, your production domain for prod) to **Allowed Origins** in the OTPless Dashboard

**App Router hydration mismatch**
- The SDK touches `window` and `document`; always use `"use client"` at the top of any component that calls SDK methods
- Do not call SDK methods in Server Components

**Next.js build error: Module not found**
```bash
npm install otpless-headless-js
```
