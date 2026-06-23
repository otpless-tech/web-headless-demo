# OTPless Headless SDK — React Native Demo

A React Native 0.76 + TypeScript demo of [OTPless](https://otpless.com) passwordless phone authentication using the `otpless-headless-rn` package. Runs on Android and iOS.

---

## Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [SDK Integration Guide](#sdk-integration-guide)
- [Complete Auth Flow](#complete-auth-flow)
- [Event Reference](#event-reference)
- [Response Schemas](#response-schemas)
- [Platform Setup](#platform-setup)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js ≥ 18 | |
| React Native 0.70+ | [Environment setup guide](https://reactnative.dev/docs/set-up-your-environment) |
| Xcode ≥ 14 | iOS builds |
| Android Studio | Android builds |
| JDK 17 | Required by RN 0.73+ |

Get a free **OTPless App ID** at [otpless.com/login](https://otpless.com/login).

---

## Setup

### 1. Install dependencies

```bash
cd ReactNative
npm install
```

### 2. iOS — install pods

```bash
cd ios
pod install
cd ..
```

### 3. Set your App ID

Open [src/constants.ts](src/constants.ts) and replace the placeholder:

```ts
// Before
export const APP_ID = 'YOUR_APP_ID';

// After
export const APP_ID = 'PASTE_YOUR_APP_ID_HERE';
```

### 4. Run

```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios

# Start Metro bundler separately (optional — run-android/ios starts it too)
npx react-native start
```

---

## Project Structure

```
ReactNative/
├── App.tsx                         # Root — screen routing + fade transitions
├── index.js                        # Entry point (registerComponent)
│
├── src/
│   ├── constants.ts                # ★ APP_ID placeholder — edit this
│   ├── useAuth.ts                  # ★ All SDK logic — useReducer hook
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Phone + country picker
│   │   ├── OtpScreen.tsx           # 6-digit OTP input, resend timer (30 s)
│   │   └── SuccessScreen.tsx       # token / idToken / userId display
│   │
│   └── components/
│       ├── OtpInput.tsx            # Digit input with auto-advance + paste
│       └── ResponseLogPanel.tsx    # Collapsible response log
│
├── metro.config.js
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## Architecture

All auth state lives in the `useAuth` custom hook (`src/useAuth.ts`). It uses `useReducer` internally and exposes a clean interface to `App.tsx` and the three screens.

```
App.tsx
 └── useAuth() hook
       │  • state: screen, isLoading, token, idToken, userId,
       │            phoneNumber, countryCode, detectedOtp, errorMessage, logs
       │
       ├── LoginScreen    reads: isLoading, errorMessage, logs
       │                  calls: startWithPhone(phone, cc)
       │
       ├── OtpScreen      reads: isLoading, detectedOtp, errorMessage, logs
       │                  calls: verifyOtp(otp), startWithPhone (resend)
       │
       └── SuccessScreen  reads: token, idToken, userId, logs
                          calls: goToLogin()
```

The reducer handles all state transitions. Screens never touch the SDK module directly.

### State shape

```ts
interface State {
  screen: 'login' | 'otp' | 'success';
  isLoading: boolean;
  token: string | null;
  idToken: string | null;
  userId: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  detectedOtp: string | null;   // set by OTP_AUTO_READ; triggers prefill
  errorMessage: string | null;
  logs: LogEntry[];             // capped at 100 entries
}
```

---

## SDK Integration Guide

### Install

```bash
npm install otpless-headless-rn
```

### Import

```ts
import { OtplessHeadlessModule } from 'otpless-headless-rn';
```

### Step 1 — Instantiate and initialize

```ts
import { useRef, useEffect } from 'react';
import { OtplessHeadlessModule } from 'otpless-headless-rn';
import { APP_ID } from './constants';

const moduleRef = useRef<OtplessHeadlessModule | null>(null);

useEffect(() => {
  // Create module instance once
  moduleRef.current = new OtplessHeadlessModule();
  moduleRef.current.initialize(APP_ID);
  moduleRef.current.setResponseCallback(onResponse);

  // Cleanup on unmount
  return () => {
    moduleRef.current?.clearListener();
    moduleRef.current?.cleanup();
  };
}, []);
```

### Step 2 — The response callback

**Every SDK response arrives in `onResponse`.** Call `commitResponse()` first, then route on `responseType`:

```ts
const onResponse = (result: any) => {
  // Required — acknowledge response to SDK internals
  moduleRef.current?.commitResponse(result);

  const responseType = result?.responseType as string;
  const statusCode   = result?.statusCode   as number;

  switch (responseType) {
    case 'SDK_READY':
      // SDK ready — calls to start() will now succeed
      break;

    case 'INITIATE':
      if (statusCode === 200) {
        const authType = result?.response?.authType;
        if (authType === 'OTP' || authType === 'MAGICLINK') {
          dispatch({ type: 'NAVIGATE_OTP' });
        }
      } else {
        dispatch({ type: 'SET_ERROR', message: result?.response?.errorMessage });
      }
      break;

    case 'OTP_AUTO_READ':
      // Android auto-detected OTP from SMS
      dispatch({ type: 'SET_DETECTED_OTP', otp: result?.response?.otp });
      break;

    case 'VERIFY':
      if (statusCode !== 200) {
        dispatch({ type: 'SET_ERROR', message: result?.response?.errorMessage });
      }
      break;

    case 'ONETAP': {
      // Authentication succeeded
      const data = result?.response?.data;
      dispatch({
        type: 'NAVIGATE_SUCCESS',
        token:   data?.token   ?? null,
        idToken: data?.idToken ?? null,
        userId:  data?.userId  ?? null,
      });
      break;
    }

    case 'FAILED':
      dispatch({ type: 'SET_ERROR', message: result?.response?.errorMessage });
      break;

    case 'DELIVERY_STATUS':
    case 'FALLBACK_TRIGGERED':
      break; // optional: update UI to show delivery channel
  }
};
```

### Step 3 — Initiate phone OTP

```ts
const startWithPhone = async (phone: string, cc: string) => {
  dispatch({ type: 'SET_LOADING' });

  // Check SDK is ready before calling start()
  const ready = await moduleRef.current?.isSdkReady();
  if (!ready) {
    moduleRef.current?.initialize(APP_ID);
    dispatch({ type: 'SET_ERROR', message: 'SDK not ready — please try again' });
    return;
  }

  moduleRef.current?.start({ phone, countryCode: cc });
};
```

### Step 4 — Verify OTP

```ts
const verifyOtp = (otp: string) => {
  dispatch({ type: 'SET_LOADING' });

  moduleRef.current?.start({
    phone:       phoneRef.current!,
    countryCode: ccRef.current!,
    otp,
  });
};
```

> `start()` is used for both initiation and verification. The SDK differentiates them by the presence of the `otp` field.

---

## Complete Auth Flow

```
App mounts
    │
    ▼
useAuth() → initialize(APP_ID) + setResponseCallback()
    │
    ▼ SDK_READY
LoginScreen enabled
    │
User enters phone + country code
    │
    ▼
startWithPhone(phone, cc)
    │ isSdkReady() check
    │
    ▼
module.start({ phone, countryCode })
    │
    ▼ INITIATE (statusCode 200)
OtpScreen shown
    │
    ├── OTP_AUTO_READ → detectedOtp set → OtpInput prefilled automatically
    │
User enters / confirms OTP
    │
    ▼
verifyOtp(otp)
    │
module.start({ phone, countryCode, otp })
    │
    ├── VERIFY (statusCode 200) → wait for ONETAP
    │
    ▼ ONETAP (statusCode 200)
SuccessScreen shown
    │   token, idToken, userId displayed
    │
User taps Sign Out
    │
    ▼
goToLogin() → back to LoginScreen (logs preserved)
```

---

## Event Reference

| `responseType` | `statusCode` | When it fires |
|---|---|---|
| `SDK_READY` | — | SDK initialized; safe to call `start()` |
| `INITIATE` | `200` | OTP sent successfully |
| `INITIATE` | `4xx` | Failed to send OTP (`errorMessage` set) |
| `OTP_AUTO_READ` | — | Android SMS Retriever detected the OTP |
| `VERIFY` | `200` | OTP verified; wait for `ONETAP` |
| `VERIFY` | `4xx` | Invalid OTP (`errorMessage` set) |
| `ONETAP` | `200` | Auth complete; `token`, `idToken`, `userId` available |
| `DELIVERY_STATUS` | — | SMS delivery update (no action required) |
| `FALLBACK_TRIGGERED` | — | SDK retried with a different channel |
| `FAILED` | — | Unrecoverable error (`errorMessage` set) |

---

## Response Schemas

### ONETAP (success)

```ts
// result.response.data contains:
{
  token:   string,   // short-lived JWT — use for authenticated API calls
  idToken: string,   // identity claims (sub, phone_number, etc.)
  userId:  string,   // stable OTPless user ID
}
```

Access pattern:

```ts
case 'ONETAP': {
  const data = result?.response?.data;
  // data.token, data.idToken, data.userId
}
```

> Note: In Flutter/RN the token is nested under `response.data`. In the Web SDK it is directly on `response`.

### INITIATE

```ts
// Success
{ responseType: 'INITIATE', statusCode: 200, response: { authType: 'OTP' } }

// authType values:
// 'OTP'       — 6-digit code input
// 'MAGICLINK' — magic link sent

// Failure
{ responseType: 'INITIATE', statusCode: 400, response: { errorMessage: 'Invalid phone' } }
```

### OTP_AUTO_READ

```ts
{ responseType: 'OTP_AUTO_READ', response: { otp: '123456' } }
```

### FAILED / error

```ts
{ responseType: 'FAILED', response: { errorMessage: 'Session expired' } }
```

---

## Platform Setup

### Android

The `otpless-headless-rn` module includes its own Android plugin. No manual Manifest changes are required for basic phone auth.

**Minimum SDK version** (already set by the RN template):

```groovy
// android/app/build.gradle
minSdkVersion = 23
```

**SMS auto-read** uses the Android SMS Retriever API — no runtime permission popup. The SMS must arrive while the app is in the foreground on a physical device.

### iOS

After `npm install`:

```bash
cd ios
pod install
cd ..
```

**Minimum iOS version** (already set):

```ruby
# ios/Podfile
platform :ios, '13.0'
```

No additional Info.plist entries are needed for basic phone auth.

### Running on a physical device (Android)

```bash
# list connected devices
adb devices

# run on a specific device
npx react-native run-android --deviceId <device-id>
```

---

## Production Checklist

- [ ] Replace `'YOUR_APP_ID'` in `src/constants.ts` with your real App ID
- [ ] Validate `token` server-side: `GET https://headless-auth.otpless.com/v1/user/session/validate`
- [ ] After `ONETAP`, navigate to your app's home screen and store the session securely (use `react-native-keychain` or `expo-secure-store`)
- [ ] Handle `FAILED` — surface `errorMessage` to the user and allow retry
- [ ] Test SMS auto-read end-to-end on a physical Android device
- [ ] Test on a physical iOS device (SMS delivery behavior differs from Simulator)
- [ ] Remove `console.log` / debug output before release build
- [ ] Run `npx react-native build-android --mode=release` and sign the APK
- [ ] Run `npx react-native build-ios` and archive in Xcode for App Store

---

## Troubleshooting

**"SDK not ready — please try again"**
- Confirm `APP_ID` in `src/constants.ts` is correct
- Check device network connectivity
- If the error persists, the SDK will re-initialize on the next attempt

**OTP_AUTO_READ not firing**
- Only works on physical Android devices (not emulator)
- The app must be in the foreground when the SMS arrives
- SMS must come from OTPless's sender ID

**Metro bundler error: unable to resolve module**
```bash
npx react-native start --reset-cache
```

**iOS pod install fails**
```bash
cd ios
pod repo update
pod install
cd ..
```

**"No bundle URL present" on iOS Simulator**
Start Metro manually before opening the app:
```bash
npx react-native start
# then in a second terminal:
npx react-native run-ios
```

**Android build: "Duplicate class kotlin.collections…"**
Add to `android/app/build.gradle`:
```groovy
android {
    packagingOptions {
        exclude 'META-INF/DEPENDENCIES'
    }
}
```

**Token is null after ONETAP**
The RN SDK nests the token under `response.data`, not directly on `response`:
```ts
// ✓ correct
const data  = result?.response?.data;
const token = data?.token;

// ✗ wrong
const token = result?.response?.token;
```
