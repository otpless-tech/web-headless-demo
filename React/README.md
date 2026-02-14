# OTPless Headless SDK Integration Demo

This repository contains a demo project for integrating the **OTPless Headless SDK** into a mobile login form using React. The project demonstrates two integration approaches:

1. **NPM Package Integration** - Using the official `otpless-headless-js` package
2. **Legacy Script Integration** - Direct script loading using helper functions

The project includes helper files and components to streamline the implementation process for both approaches.

---

## 📂 Project Structure

```
src/
├── Components
│   ├── AlertIcon.tsx
│   ├── OTPInput.tsx
│   ├── OTPlessUI.tsx
│   ├── PhoneIcon.tsx
│   └── Response.tsx
├── Containers
│   ├── OTPlogin.css
│   ├── OTPlessPackage.tsx  # NPM package integration
│   └── OTPlessLegacy.tsx   # Legacy script integration
├── Helpers
│   ├── appendResponse.ts
│   ├── deviceDetection.ts
│   └── otpless.ts
├── App.css
├── App.tsx
├── index.tsx
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### 🔑 Key Files

#### NPM Package Integration
1. **`Containers/OTPlessPackage.tsx`**: Implementation using the official `otpless-headless-js` npm package.
2. **`Components/OTPlessUI.tsx`**: UI components shared between both implementations.

#### Legacy Script Integration
1. **`Helpers/otpless.ts`**: Contains the core functions for initializing and interacting with the OTPless Headless SDK.
2. **`Containers/OTPlessLegacy.tsx`**: Legacy implementation that uses direct script loading.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone git@github.com:Mickey-OTPless/headless.git
cd OTPless-Headless-SDK
```

### 2. Install Dependencies
```bash
npm install
# or
yarn
```

### 3. Create Environment Configuration
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

Edit the `.env` file to include your OTPless App ID:
```bash
REACT_APP_OTPLESS_APP_ID=YOUR_APP_ID
REACT_APP_OTP_LENGTH=4
```

### 4. Start the Development Server
```bash
npm start
# or
yarn start
```

The project will run at `http://localhost:3000/` by default.

---

## 📄 Integration Guide

This project demonstrates two different approaches to integrate the OTPless SDK:

### 🧩 NPM Package Approach (Recommended)

#### 1. Installation

```bash
npm install otpless-headless-js
# or
yarn add otpless-headless-js
```

#### 2. Import and Use the Hook

The `OTPlessPackage.tsx` component demonstrates how to use the `useOTPless` hook:

```typescript
import { CHANNELS, useOTPless } from "otpless-headless-js";

const YourComponent = () => {
  const {
    init,            // Initialize the SDK
    initiate,        // Start OTP process
    verify,          // Verify OTP
    on,              // Subscribe to events
    loading          // Loading state
  } = useOTPless();
  
  // Initialize SDK with your App ID
  useEffect(() => {
    if (init) {
      init(process.env.REACT_APP_OTPLESS_APP_ID || "YOUR_APP_ID");
    }
  }, [init]);
  
  // Example: Initiate OTP
  const startOtpProcess = async () => {
    const response = await initiate({
      channel: CHANNELS.PHONE,
      phone: "1234567890",
      countryCode: "91"
    });
    // Handle response
  };
  
  // Example: Event handling
  const eventCallback = {
    ONETAP: (event) => { /* Handle one-tap event */ },
    OTP_AUTO_READ: (event) => { /* Handle auto-read event */ }
  };
  
  useEffect(() => {
    if (on) {
      const unsubscribe = on(eventCallback);
      return () => unsubscribe();
    }
  }, [on]);
}
```

### 🔧 Legacy Script Integration

The **`Helpers/otpless.ts`** file contains two key functions for the legacy approach:

#### 1. `OTPlessSdk()`
This function loads the OTPless Headless SDK script and initializes the `OTPlessSignin` object.

```typescript
export const OTPlessSdk = async (): Promise<void> =>
	new Promise<void>(async (resolve) => {
		if (document.getElementById("otpless-sdk") && OTPlessSignin)
			return resolve();

		// Get App ID from environment variable or use a default
		const appId = process.env.REACT_APP_OTPLESS_APP_ID || "YOUR_APP_ID";

		const script = document.createElement("script");
		script.src = `https://otpless.com/v4.3/headless.js`;
		script.id = "otpless-sdk";
		script.setAttribute("data-appid", appId);

		script.onload = function () {
			// Initialize OTPless SDK
			resolve();
		};

		document.head.appendChild(script);
	});
```

#### 2. `hitOTPlessSdk(params)`
This function triggers the required request type (e.g., login) using the initialized `OTPlessSignin` object.

```typescript
export const hitOTPlessSdk = async (
	params: OTPlessRequestParams
): Promise<OTPlessResponse> => {
	await OTPlessSdk();

	const { requestType, request } = params;

	return await OTPlessSignin[requestType](request);
};
```

### 🔄 Key Integration Process

Both approaches implement the same flow:

1. **Initialization**:
   - NPM: Use the `init` method from the hook
   - Legacy: Load the script via `OTPlessSdk()`

2. **Phone Number Submission**:
   - User enters their phone number
   - App sends an OTP initiation request
   - Upon success, transition to the OTP verification step

3. **OTP Verification**:
   - User enters the received OTP
   - App sends an OTP verification request
   - Upon successful verification, user is logged in

4. **Event Handling**:
   - NPM: Use the `on` method to subscribe to events
   - Legacy: Set up event listeners manually

```javascript
const handlePhoneSubmit = async (e) => {

    e.preventDefault();
    if (!phone) return setError("Please enter your phone number");

    setError('');
    setLoading(true);

    try {
        const request = {
            channel: 'PHONE',
            phone,
            countryCode,
        };

        const initiate = await hitOTPlessSdk({
            requestType: "initiate",
            request
        });

        if (initiate.success) setStep('otp');
        else setError(initiate.response.errorMessage);

    } catch (err) {
        setError('Failed to send OTP. Please try again.');
    } finally {
        setLoading(false);
    }
};

const handleOtpSubmit = async (e) => {

    e.preventDefault();
    if (!otp.join("")) return setError("Please enter OTP")

    setError('');
    setLoading(true);

    try {
        const verify = await hitOTPlessSdk({
            requestType: "verify",
            request: {
                channel: 'PHONE',
                phone,
                otp: otp.join(""),
                countryCode
            }
        })

        appendResponse(verify)

        console.log({ verify })

        // YOUR_ACTIONS

    } catch (err) {
        setError('Invalid OTP. Please try again.');
    } finally {
        setLoading(false);
    }
};
```

---

## ⚙️ Configuration

### Environment Variables

The application uses environment variables to store configuration settings. Create a `.env` file in the root directory with the following variables:

```bash
# .env file
REACT_APP_OTPLESS_APP_ID=YOUR_APP_ID
REACT_APP_OTP_LENGTH=4
```

A sample `.env.example` file is provided for reference.

### Obtaining Your OTPless App ID

If you do not have an App ID, follow these steps:

1. Log in to the [OTPless Dashboard](https://otpless.com/login).

2. Create a new app if you haven't already.

3. Navigate to App Settings.

4. Copy the App ID provided in the app settings and add it to your `.env` file:

```bash
REACT_APP_OTPLESS_APP_ID=YOUR_APP_ID_HERE
```

This App ID is essential for connecting your app to the OTPless services.

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|--------|
| `REACT_APP_OTPLESS_APP_ID` | Your OTPless App ID | "YOUR_APP_ID" |
| `REACT_APP_OTP_LENGTH` | Length of the OTP code | 4 |

---

## 📚 Available Scripts
In the project directory, you can run:

### `npm start`
Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload if you make edits.

### `npm run build`
Builds the app for production to the `build` folder.

---

## 🛠 Tools & Libraries Used
- **React**: Frontend framework
- **TypeScript**: Type-safe JavaScript
- **otpless-headless-js**: NPM package for OTPless integration
- **OTPless Headless SDK**: For phone number authentication

---

## 📞 Contact
For any issues or questions, feel free to reach out to the OTPless support team or create an issue in this repository.

---

## 📝 License
This project is licensed under the MIT License. See the `LICENSE` file for details.

# web-headless-demo
