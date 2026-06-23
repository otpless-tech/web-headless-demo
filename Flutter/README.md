# OTPless Headless SDK — Flutter Demo

A Flutter 3 demo of [OTPless](https://otpless.com) passwordless phone authentication using the `otpless_headless_flutter` package. Runs on Android, iOS, Web, macOS, Windows, and Linux.

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

| Requirement | Version |
|---|---|
| Flutter SDK | ≥ 3.1.2 |
| Dart SDK | ≥ 3.1.2 |
| Xcode | ≥ 14 (iOS / macOS builds) |
| Android Studio | Latest stable (Android builds) |

Get a free **OTPless App ID** at [otpless.com/login](https://otpless.com/login).

---

## Setup

### 1. Get dependencies

```bash
cd Flutter
flutter pub get
```

### 2. Set your App ID

Open [lib/auth_controller.dart](lib/auth_controller.dart) and replace the placeholder on line 5:

```dart
// Before
const _appId = 'YOUR_APP_ID';

// After
const _appId = 'PASTE_YOUR_APP_ID_HERE';
```

### 3. iOS — install pods

```bash
cd ios
pod install
cd ..
```

### 4. Run

```bash
flutter run                       # prompts for device selection
flutter run -d android            # specific Android device
flutter run -d ios                # iOS Simulator or device
flutter run -d chrome             # Web
```

To list available devices:

```bash
flutter devices
```

---

## Project Structure

```
Flutter/
├── lib/
│   ├── main.dart                   # App entry, theme, AnimatedSwitcher navigation
│   ├── auth_controller.dart        # ★ All SDK logic — ChangeNotifier state manager
│   │
│   ├── models/
│   │   └── log_entry.dart          # LogEntry model for the response log panel
│   │
│   ├── screens/
│   │   ├── login_screen.dart       # Phone + country code input
│   │   ├── otp_screen.dart         # 6-digit OTP entry, resend timer (30 s)
│   │   └── success_screen.dart     # token / idToken / userId display
│   │
│   └── widgets/
│       ├── otp_input.dart          # Custom digit input with auto-advance + paste
│       └── response_log_panel.dart # Collapsible response log with copy + clear
│
├── android/                        # Android native project
├── ios/                            # iOS native project
├── web/                            # Web build assets
├── macos/                          # macOS native project
├── pubspec.yaml
└── analysis_options.yaml
```

---

## Architecture

All auth state lives in `AuthController`, a `ChangeNotifier` that is created once in `main.dart` and shared to every screen via `ListenableBuilder`.

```
main.dart
 └── AuthController (ChangeNotifier)
       │  • holds: screen, isLoading, token, idToken, userId,
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

Screens are **purely presentational** — they never touch the SDK directly.

---

## SDK Integration Guide

### pubspec.yaml

```yaml
dependencies:
  otpless_headless_flutter: ^1.0.1
```

### Import

```dart
import 'package:otpless_headless_flutter/otpless_flutter.dart';
```

### Step 1 — Instantiate and initialize

```dart
class AuthController extends ChangeNotifier {
  final _otpless = Otpless();
  static const _appId = 'YOUR_APP_ID';

  void initialize() {
    // Always call inside addPostFrameCallback so the widget tree is ready
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _otpless.initialize(_appId);
      _otpless.setResponseCallback(_onResponse);
    });
  }
}
```

> `initialize()` is called once in the `initState` of the root widget (`main.dart`).

### Step 2 — The response callback

**Every response from the SDK arrives in `_onResponse`.** You must call `commitResponse()` first, then route on `responseType`:

```dart
void _onResponse(dynamic result) {
  // Required — acknowledge response to SDK internals
  _otpless.commitResponse(result);

  final responseType = result['responseType'] as String?;
  final statusCode   = result['statusCode']   as int?;

  switch (responseType) {
    case 'SDK_READY':
      // SDK is ready — you can now call start()
      break;

    case 'INITIATE':
      if (statusCode == 200) {
        _screen = AuthScreen.otp;   // navigate to OTP entry
      } else {
        _errorMessage = result['response']?['errorMessage'];
      }

    case 'OTP_AUTO_READ':
      // Android read the OTP from SMS automatically
      _detectedOtp = result['response']?['otp'] as String?;

    case 'VERIFY':
      if (statusCode != 200) {
        _errorMessage = result['response']?['errorMessage'];
      }

    case 'ONETAP':
      // Authentication succeeded
      final data = result['response']?['data'] as Map<String, dynamic>?;
      _token   = data?['token'];
      _idToken = data?['idToken'];
      _userId  = data?['userId'];
      _screen  = AuthScreen.success;

    case 'DELIVERY_STATUS':
    case 'FALLBACK_TRIGGERED':
      // Optional: update UI to reflect delivery channel change
      break;

    case 'FAILED':
      _errorMessage = result['response']?['errorMessage'];
  }

  notifyListeners(); // always call at the end
}
```

### Step 3 — Initiate phone OTP

```dart
Future<void> startWithPhone(String phone, String countryCode) async {
  _isLoading = true;
  notifyListeners();

  // Check SDK is ready before calling start()
  final ready = await _otpless.isSdkReady();
  if (!ready) {
    _otpless.initialize(_appId); // re-init and ask user to retry
    _errorMessage = 'SDK not ready — please try again';
    _isLoading = false;
    notifyListeners();
    return;
  }

  _otpless.start(_onResponse, {
    'phone': phone,
    'countryCode': countryCode,
  });
}
```

### Step 4 — Verify OTP

Pass the same phone + countryCode, and add the `otp` field:

```dart
void verifyOtp(String otp) {
  _isLoading = true;
  notifyListeners();

  _otpless.start(_onResponse, {
    'phone': _phoneNumber!,
    'countryCode': _countryCode!,
    'otp': otp,
  });
}
```

> The `start()` method handles both initiation and verification — the SDK differentiates them by the presence of the `otp` field.

---

## Complete Auth Flow

```
App launch
    │
    ▼
AuthController.initialize()
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
_otpless.start({ phone, countryCode })
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
_otpless.start({ phone, countryCode, otp })
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
AuthController.goToLogin() → back to LoginScreen
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

```dart
// result['response']['data'] contains:
{
  'token':   '<jwt>',    // short-lived JWT — use for authenticated API calls
  'idToken': '<jwt>',    // identity claims (sub, phone_number, etc.)
  'userId':  '<uuid>',   // stable OTPless user ID
}
```

Access pattern:

```dart
case 'ONETAP':
  final data = result['response']?['data'] as Map<String, dynamic>?;
  _token   = data?['token']   as String?;
  _idToken = data?['idToken'] as String?;
  _userId  = data?['userId']  as String?;
```

> Note: In the Flutter/RN SDKs the token is nested under `response.data`, whereas in the Web SDK it is directly on `response`.

### INITIATE (success)

```dart
{
  'responseType': 'INITIATE',
  'statusCode': 200,
  'response': { 'authType': 'OTP' },  // 'OTP' or 'MAGICLINK'
}
```

### OTP_AUTO_READ

```dart
{
  'responseType': 'OTP_AUTO_READ',
  'response': { 'otp': '123456' },
}
```

### FAILED / error

```dart
{
  'responseType': 'FAILED',  // or INITIATE/VERIFY with statusCode 4xx
  'response': { 'errorMessage': 'Invalid OTP' },
}
```

---

## Platform Setup

### Android

The `otpless_headless_flutter` plugin handles most Android setup automatically. For SMS auto-read (OTP_AUTO_READ), the plugin uses the Android SMS Retriever API — no runtime permission prompt needed.

If you encounter permission issues, add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.READ_SMS" />
```

Minimum SDK version (already set in the generated project):

```groovy
// android/app/build.gradle
defaultConfig {
    minSdkVersion 21
}
```

### iOS

After `flutter pub get`, run CocoaPods:

```bash
cd ios && pod install && cd ..
```

No additional Info.plist entries are needed for basic phone auth.

For OAuth flows (Google, etc.), configure the URL scheme in Xcode:
1. Open `ios/Runner.xcworkspace` in Xcode
2. Select Runner target → Info → URL Types
3. Add a URL scheme matching your OTPless redirect configuration

### Web

The Web build uses the CDN-loaded SDK. Run `flutter run -d chrome` — no extra setup required.

### macOS

```bash
flutter run -d macos
```

Ensure the macOS entitlements allow outbound networking:

```xml
<!-- macos/Runner/DebugProfile.entitlements -->
<key>com.apple.security.network.client</key>
<true/>
```

---

## Production Checklist

- [ ] Replace `'YOUR_APP_ID'` in `lib/auth_controller.dart` with your real App ID
- [ ] Validate `token` server-side before granting access: `GET https://headless-auth.otpless.com/v1/user/session/validate`
- [ ] Implement post-login navigation in `AuthController` after `ONETAP` (e.g. push your home route)
- [ ] Store `userId` / `token` securely using `flutter_secure_storage` instead of plain state
- [ ] Handle `FAILED` gracefully — show `errorMessage` and offer retry
- [ ] Test SMS auto-read on a physical Android device
- [ ] Run `flutter test` — confirm no widget regressions
- [ ] Run `flutter build apk --release` and `flutter build ipa` before shipping

---

## Troubleshooting

**"SDK not ready — please try again"**
The SDK fires `SDK_READY` before it can accept `start()` calls. The demo uses `isSdkReady()` to guard against early calls. If this persists:
- Confirm your App ID is correct
- Check network connectivity on the device

**OTP_AUTO_READ not firing on Android**
- Test on a physical device, not an emulator
- The SMS must arrive while the app is in the foreground
- The SMS body format must match OTPless's SMS Retriever hash — contact OTPless support if the format is custom

**iOS build fails after `flutter pub get`**
```bash
cd ios
pod install --repo-update
cd ..
flutter clean && flutter run
```

**Token is null after ONETAP**
The Flutter/RN SDKs nest the token under `response.data`, not directly on `response`:
```dart
// ✓ correct
final data = result['response']?['data'] as Map<String, dynamic>?;
final token = data?['token'];

// ✗ wrong
final token = result['response']?['token'];
```

**"MissingPluginException" on first run**
```bash
flutter clean
flutter pub get
cd ios && pod install && cd ..
flutter run
```
