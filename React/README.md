# OTPless Headless SDK — React Demo

A React 18 + TypeScript demo of [OTPless](https://otpless.com) passwordless authentication. Covers two integration modes (NPM package hook vs. legacy CDN script) and three auth channels (Phone SMS, Email, OAuth).

---

## Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Project Structure](#project-structure)
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

- Node.js 16 or later
- An **OTPless App ID** — [get one free](https://otpless.com/login)

---

## Setup

```bash
# 1. Install dependencies
cd React
npm install

# 2. Set your App ID
#    .env is already present — just replace the placeholder value
nano .env
```

`.env`:

```env
REACT_APP_OTPLESS_APP_ID=YOUR_APP_ID_HERE
REACT_APP_OTP_LENGTH=6
```

```bash
# 3. Start the dev server
npm start
```

Open [http://localhost:3000](http://localhost:3000). The home screen lets you choose between **Package** and **Legacy** integration modes.

> The app ships with a fully functional UI, response log panel, and error display. The only thing you need is your App ID.

---

## Project Structure

```
React/
├── src/
│   ├── App.tsx                        # Root — mode selector (Package | Legacy)
│   ├── index.tsx                      # React DOM entry
│   │
│   ├── Containers/
│   │   ├── OTPlessPackage.tsx         # ★ NPM hook integration
│   │   └── OTPlessLegacy.tsx          # Legacy CDN script integration
│   │
│   ├── Components/
│   │   ├── OTPlessUI/                 # Full auth UI (tabs, steps, success)
│   │   │   ├── index.tsx              #   UI orchestrator
│   │   │   ├── Tabs.tsx               #   Phone / Email / Social tabs
│   │   │   ├── AuthStep.tsx           #   Login form
│   │   │   ├── OTPStep.tsx            #   OTP entry form
│   │   │   ├── LinkStep.tsx           #   Magic-link waiting state
│   │   │   └── SuccessStep.tsx        #   Token display
│   │   ├── OTPInput.tsx               # Auto-advance digit input
│   │   ├── Response.tsx               # Collapsible JSON response viewer
│   │   ├── PhoneIcon.tsx
│   │   └── AlertIcon.tsx
│   │
│   └── Helpers/
│       ├── otpless.ts                 # Legacy SDK loader + request dispatcher
│       ├── appendResponse.ts          # Response DOM logger
│       ├── deviceDetection.ts         # Android detection (Truecaller guard)
│       └── getStepsText.ts            # Step label strings
│
├── .env                               # App ID + OTP length (edit this)
├── .env.example                       # Reference copy
└── package.json
```

---

## Integration Mode 1 — NPM Package (Recommended)

File: `src/Containers/OTPlessPackage.tsx`

This is the preferred approach. The `useOTPless` hook from `otpless-headless-js` manages the SDK lifecycle for you.

### Install

```bash
npm install otpless-headless-js
```

### 1. Initialize the SDK

```tsx
import { useOTPless } from "otpless-headless-js";
import { useEffect } from "react";

function AuthComponent() {
  const { init, initiate, verify, on, loading } = useOTPless();

  useEffect(() => {
    if (!init || !on) return;

    // Initialize with your App ID
    init(process.env.REACT_APP_OTPLESS_APP_ID || "YOUR_APP_ID");

    // Subscribe to async events (ONETAP, OTP_AUTO_READ, FAILED, etc.)
    const off = on({
      ONETAP: handleSuccess,
      OTP_AUTO_READ: handleAutoRead,
      FAILED: handleFailed,
      FALLBACK_TRIGGERED: handleFallback,
    });

    return () => off(); // unsubscribe on unmount
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

    // Optional: pass through custom data; returned as-is in ONETAP response
    metaData: { source: "my-app", plan: "pro" },
  });

  if (response.success) {
    setStep("otp"); // show OTP input screen
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
    // authType "EMAIL_LOGIN" means a magic link was sent; no OTP input needed
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

  // On success the ONETAP event fires — handle it in the event callback below
  if (!response.success) {
    setError(response.response?.errorMessage ?? "Invalid OTP");
  }
};
```

### 5. Handle Events

Events arrive asynchronously via the `on()` subscription. This is where you store the session and navigate.

```tsx
const handleSuccess = (e: OTPlessResponse) => {
  const { token, idToken, userId } = e.response ?? {};

  // Store the session — use token for API calls, idToken for identity claims
  localStorage.setItem("otpless_token", token ?? "");

  // Redirect to your app
  window.location.href = "/dashboard";
};

const handleAutoRead = (e: OTPlessResponse) => {
  // Android auto-detected the OTP from the incoming SMS
  const otp = e.response?.otp;
  if (otp) setOtp(otp.split(""));
};

const handleFailed = (e: OTPlessResponse) => {
  setError(e.response?.errorMessage ?? "Authentication failed");
  setStep("phone"); // reset to start
};

const handleFallback = (e: OTPlessResponse) => {
  // SDK switched delivery channel (e.g. SMS → voice OTP)
  // Update your UI copy if you surface delivery method to the user
};
```

---

## Integration Mode 2 — Legacy CDN Script

File: `src/Containers/OTPlessLegacy.tsx`  
Helper: `src/Helpers/otpless.ts`

Use this if you cannot use npm packages (e.g. script-only environments).

### How it works

`OTPlessSdk()` dynamically injects the SDK script into `<head>` and instantiates a global `OTPlessSignin` object with a callback function:

```ts
// src/Helpers/otpless.ts
export const OTPlessSdk = async (): Promise<void> =>
  new Promise((resolve) => {
    if (document.getElementById("otpless-sdk") && OTPlessSignin) return resolve();

    const script = document.createElement("script");
    script.src = "https://otpless.com/v4.3/headless.js";
    script.id = "otpless-sdk";
    script.setAttribute("data-appid", process.env.REACT_APP_OTPLESS_APP_ID || "YOUR_APP_ID");
    script.onload = () => { /* instantiate OTPlessSignin */ resolve(); };
    document.head.appendChild(script);
  });
```

### Dispatch requests

```ts
// Initiate Phone OTP
const res = await hitOTPlessSdk({
  requestType: "initiate",
  request: { channel: "PHONE", phone: "9876543210", countryCode: "91" },
});

// Verify OTP
const res = await hitOTPlessSdk({
  requestType: "verify",
  request: { channel: "PHONE", phone: "9876543210", countryCode: "91", otp: "123456" },
});
```

### Handle async events

The legacy approach receives OAuth/auto-read events through the callback passed to the `OTPless` constructor. Add your logic inside `Helpers/otpless.ts`:

```ts
const ONETAP = (): void => {
  const { response } = e;
  // Store session and redirect
  localStorage.setItem("otpless_token", response?.token ?? "");
  window.location.href = "/dashboard";
};
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
// If authType === "EMAIL_LOGIN" → magic link sent, no verify() call needed
// If authType === "OTP"        → call verify() with the emailed code
```

### Google OAuth

```ts
import { OAUTH_CHANNELS } from "otpless-headless-js";

await initiate({ channel: CHANNELS.OAUTH, channelType: OAUTH_CHANNELS.GOOGLE });
// Redirects to Google; ONETAP fires on return
```

### Truecaller (Android only)

```ts
if (!isAndroid()) return; // guard — Truecaller is Android-only

await initiate({ channel: CHANNELS.OAUTH, channelType: OAUTH_CHANNELS.TRUE_CALLER });
// Opens Truecaller app; ONETAP fires on approval
```

### Country Codes

The demo defaults to India (`+91`). To support multiple countries, add a country selector and pass the user's choice:

```ts
await initiate({ channel: CHANNELS.PHONE, phone: "2025551234", countryCode: "1" }); // US
```

Common codes:

| Country | Code |
|---|---|
| India | `91` |
| United States | `1` |
| United Kingdom | `44` |
| UAE | `971` |
| Singapore | `65` |

---

## Event Reference

Both integration modes emit the same events.

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
    "token":   "<jwt>",   // attach to Authorization header on API calls
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
// "OTP"        — show 6-digit code input
// "MAGICLINK"  — show "check your email" screen
// "OAUTH"      — OAuth flow started

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

| Variable | Required | Description | Default |
|---|---|---|---|
| `REACT_APP_OTPLESS_APP_ID` | **Yes** | Your OTPless App ID | `YOUR_APP_ID` |
| `REACT_APP_OTP_LENGTH` | No | Number of OTP digits | `6` |

Create `.env` by copying the example:

```bash
cp .env.example .env
# then edit .env and set REACT_APP_OTPLESS_APP_ID
```

> CRA injects env vars at **build time**. Changing `.env` requires restarting the dev server (`npm start`).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Dev server at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Production build in `build/` |
| `npm test` | Run test suite |

---

## Production Checklist

Before shipping your integration:

- [ ] Replace `YOUR_APP_ID` with your real App ID from the OTPless Dashboard
- [ ] Remove `.env` from git (add to `.gitignore` if not already there)
- [ ] Implement the `ONETAP` handler: store `token` securely and redirect the user
- [ ] Validate `token` server-side before granting access: `GET https://headless-auth.otpless.com/v1/user/session/validate`
- [ ] Implement the `FAILED` handler: surface `errorMessage` to the user and allow retry
- [ ] Replace the hardcoded `countryCode: "91"` with a country selector if you serve international users
- [ ] Remove `console.log` statements from event handlers
- [ ] Test on Android to verify SMS auto-read works
- [ ] Test Truecaller flow on a physical Android device

---

## Troubleshooting

**OTP not received**
- Confirm `REACT_APP_OTPLESS_APP_ID` in `.env` matches your Dashboard App ID exactly
- Restart the dev server after editing `.env`
- Check the response log panel on screen — `INITIATE` with `statusCode 4xx` indicates a config issue

**`useOTPless` returns undefined methods**
- Ensure `init()` is called inside a `useEffect` that depends on `[init, on]`
- `init` and `on` are `undefined` on the first render; the effect re-runs when they become available

**Google OAuth not redirecting**
- Configure the allowed redirect URI in your OTPless Dashboard App Settings
- For localhost development, add `http://localhost:3000` as an allowed origin

**Truecaller button appears but does nothing on desktop**
- Expected — Truecaller requires the Truecaller app installed on an Android device
- The `isAndroid()` guard in the demo catches this and shows an error

**Build fails with TypeScript errors**
```bash
npm install --save-dev typescript@4.9.5
```
