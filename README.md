# OTPless Headless SDK — Demo Repository

Reference implementations of [OTPless](https://otpless.com) passwordless authentication across four platforms. Each demo shows the complete auth flow — phone entry → OTP verification → success — using the official OTPless Headless SDKs.

> **This is a demo / starter repo.** Clone it, drop in your App ID, and you have a working auth flow on any supported platform. The integration patterns here mirror what you'd ship to production.

---

## Platforms at a Glance

| Platform | SDK | Min Version | Auth Channels | Directory |
|---|---|---|---|---|
| React (CRA) | `otpless-headless-js` | React 18 | Phone, Email, Google, Truecaller | [React/](React/) |
| Next.js 14 | `otpless-headless-js` | Next.js 14 | Phone, Email, Google, Truecaller | [Nextjs/](Nextjs/) |
| Flutter | `otpless_headless_flutter` | Flutter 3.1 | Phone | [Flutter/](Flutter/) |
| React Native | `otpless-headless-rn` | RN 0.70 | Phone | [ReactNative/](ReactNative/) |

---

## Before You Start — Get an App ID

Every platform requires an **OTPless App ID**.

1. Go to [otpless.com/login](https://otpless.com/login) and sign in
2. Create a new app (or open an existing one)
3. Navigate to **App Settings** → copy the **App ID**
4. Follow the platform-specific setup below to plug it in

---

## Quick Start

### React
```bash
cd React && npm install
# Edit .env — set REACT_APP_OTPLESS_APP_ID=<your-id>
npm start                       # http://localhost:3000
```

### Next.js
```bash
cd Nextjs && npm install
# Edit .env — set NEXT_PUBLIC_OTPLESS_APP_ID=<your-id>
npm run dev                     # http://localhost:3000
```

### Flutter
```bash
cd Flutter && flutter pub get
# Edit lib/auth_controller.dart — set const _appId = '<your-id>';
flutter run
```

### React Native
```bash
cd ReactNative && npm install
cd ios && pod install && cd ..   # iOS only
# Edit src/constants.ts — set export const APP_ID = '<your-id>';
npx react-native run-android     # or run-ios
```

Full setup instructions and integration guides are in each platform's README.

---

## What the Demos Show

Every platform implements the same three-screen flow:

```
┌─────────────────┐     initiate()      ┌─────────────────┐     verify()       ┌─────────────────┐
│  Login Screen   │ ──────────────────► │   OTP Screen    │ ──────────────────► │ Success Screen  │
│                 │                     │                 │                     │                 │
│ • Phone input   │                     │ • 6-digit input │                     │ • token         │
│ • Country code  │                     │ • Auto-read     │                     │ • idToken       │
│ • Email input   │◄── Back ────────────│   (Android)     │                     │ • userId        │
│ • Google OAuth  │                     │ • Resend timer  │                     │                 │
│ • Truecaller    │                     │   (30 s)        │                     │                 │
└─────────────────┘                     └─────────────────┘                     └─────────────────┘
```

Additionally, every SDK response is shown in a collapsible log panel so you can inspect the raw payload at each step of the flow.

---

## Authentication Channels

| Channel | Description | Platforms |
|---|---|---|
| `PHONE` | SMS one-time password | All |
| `EMAIL` | Email magic link or OTP | React, Next.js |
| `OAUTH / GOOGLE` | Google one-tap sign-in | React, Next.js |
| `OAUTH / TRUE_CALLER` | Truecaller (Android only) | React, Next.js |

---

## Auth Flow — Sequence Diagram

```
Client                     OTPless SDK                  OTPless Server
  │                              │                              │
  │── init(appId) ──────────────►│                              │
  │◄─ SDK_READY ─────────────────│                              │
  │                              │                              │
  │── initiate({ PHONE, ... }) ─►│── POST /initiate ───────────►│
  │                              │◄─ { authType: "OTP" } ───────│
  │◄─ INITIATE (statusCode 200) ─│                              │
  │                              │          [SMS sent to user]  │
  │                              │                              │
  │── verify({ otp: "123456" }) ─►│── POST /verify ─────────────►│
  │                              │◄─ { token, idToken, userId } ─│
  │◄─ ONETAP ────────────────────│                              │
  │                              │                              │
```

---

## Response Payloads

All SDKs return responses with the same shape. The key fields are:

```jsonc
// ONETAP — authentication succeeded
{
  "responseType": "ONETAP",
  "statusCode": 200,
  "response": {
    "data": {
      "token":   "<jwt>",         // short-lived; use for API auth
      "idToken": "<jwt>",         // identity claims (sub, phone, etc.)
      "userId":  "<uuid>"         // stable OTPless user identifier
    }
  }
}

// INITIATE — OTP sent
{
  "responseType": "INITIATE",
  "statusCode": 200,
  "response": {
    "authType": "OTP"             // "OTP" | "MAGICLINK" | "OAUTH"
  }
}

// OTP_AUTO_READ — SMS auto-detected (Android)
{
  "responseType": "OTP_AUTO_READ",
  "response": { "otp": "123456" }
}

// FAILED — error
{
  "responseType": "FAILED",
  "response": { "errorMessage": "Invalid OTP" }
}
```

> **Web SDK note:** In React/Next.js, `initiate()` and `verify()` also return these payloads directly as promise results, in addition to firing the event callbacks.

---

## Token Validation (Server-Side)

After `ONETAP` fires, validate the `token` on your backend before granting access:

```
GET https://headless-auth.otpless.com/v1/user/session/validate
Authorization: Bearer <token>
```

You'll receive the user's phone, email, and identity claims. Never trust the token client-side alone.

---

## Repository Structure

```
web-headless-demo/
├── React/              # React 18 + TypeScript (Create React App)
│   └── README.md       # Full integration guide
├── Nextjs/             # Next.js 14 App Router
│   └── README.md       # Full integration guide
├── Flutter/            # Flutter 3 (iOS, Android, Web, macOS, Windows)
│   └── README.md       # Full integration guide
└── ReactNative/        # React Native 0.76 (iOS, Android)
    └── README.md       # Full integration guide
```

---

## Web vs. Mobile SDK Differences

| Concern | React / Next.js | Flutter / React Native |
|---|---|---|
| SDK init | `init(appId)` via hook | `initialize(appId)` + `setResponseCallback()` |
| Start flow | `initiate(request)` → Promise | `start(request)` → callback |
| Verify OTP | `verify(request)` → Promise | `start(request + otp)` → callback |
| Must call | — | `commitResponse(result)` inside callback |
| Cleanup | `on()` returns unsubscribe fn | `clearListener()` + `cleanup()` |
| Auto OTP read | Limited (browser) | Full SMS Retriever API (Android) |
| SSR | Next.js helpers guard `typeof document` | N/A |

---

## Resources

- [OTPless Documentation](https://otpless.com/docs)
- [OTPless Dashboard](https://otpless.com/login)
- [Token Validation API](https://headless-auth.otpless.com/v1/user/session/validate)
