# OTPless Headless SDK Integration Demo

This repository contains a demo project for integrating the **OTPless Headless SDK** into a mobile login form using React. The project includes helper files and components to streamline the implementation process.

---

## 📂 Project Structure

```
src/
├── Components
│   ├── AlertIcon.js
│   ├── OTPInput.js
│   └── PhoneIcon.js
├── Containers
│   ├── OTPLogin.css
│   └── OTPLogin.jsx
├── Helpers
│   ├── appendResponse.js
│   └── otpless.js
├── App.css
├── App.js
├── index.js
├── .gitignore
├── package.json
└── README.md
```

### 🔑 Key Files

1. **`Helpers/otpless.js`**: Contains the core functions for initializing and interacting with the OTPless Headless SDK.
2. **`Containers/OTPLogin.jsx`**: Contains the login form for users to enter their phone number and verify using the OTPless SDK.

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
```

### 3. Start the Development Server
```bash
npm start
```

The project will run at `http://localhost:3000/` by default.

---

## 📄 Integration Guide

### 🧩 OTPless SDK Helper Functions

The **`[Helpers/otpless.js](./src/Helpers/otpless.js)`** file contains two key functions:

#### 1. `OTPlessSdk()`
This function loads the OTPless Headless SDK script and initializes the `OTPlessSignin` object.

```javascript
export const OTPlessSdk = async () => new Promise(async (resolve) => {
    if (document.getElementById('otpless-sdk') && OTPlessSignin) return resolve();
    const appId = "YOUR_APP_ID"; // Replace with your App ID

    const script = document.createElement('script');
    script.src = `https://otpless.com/v4.3/headless.js`;
    script.id = "otpless-sdk";
    script.setAttribute('data-appid', appId);

    script.onload = function () {
        const OTPless = Reflect.get(window, "OTPless");
        OTPlessSignin = new OTPless(callback);
        resolve();
    };

    document.head.appendChild(script);
});
```

#### 2. `hitOTPlessSdk(params)`
This function triggers the required request type (e.g., login) using the initialized `OTPlessSignin` object.

```javascript
export const hitOTPlessSdk = async (params) => {
    await OTPlessSdk();

    const { requestType, request } = params;

    return await OTPlessSignin[requestType](request);
};
```

### 🔧 Usage in the Login Form

The `OTPLogin.jsx` component is a sample implementation of a mobile login form that uses the above helper functions to verify phone numbers via the OTPless SDK.

Key steps in the login process:

- **Phone Number Submission**:
  - Users enter their phone number.
  - The app sends an OTP initiation request via `hitOTPlessSdk`.
  - Upon success, the app transitions to the OTP verification step.

- **OTP Verification**:
  - Users enter the received OTP.
  - The app sends an OTP verification request via `hitOTPlessSdk`.
  - Upon successful verification, the user is logged in.

Example snippet from `OTPLogin.jsx`:

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
Replace **`YOUR_APP_ID`** in the `OTPlessSdk()` function with your actual OTPless App ID.

To configure the OTPless Headless SDK, you need to replace the placeholder YOUR_APP_ID in the OTPlessSdk() function with your actual App ID.

Obtaining Your OTPless App ID

If you do not have an App ID, follow these steps:

1. Log in to the OTPless Dashboard. https://otpless.com/login

2. Create a new app if you haven't already.

3. Navigate to App Settings.

4. Copy the App ID provided in the app settings and paste it in the appId field within the OTPlessSdk() function.

```javascript
const appId = "YOUR_APP_ID";
```
This App ID is essential for connecting your app to the OTPless services.

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
- **OTPless Headless SDK**: For phone number authentication

---

## 📞 Contact
For any issues or questions, feel free to reach out to the OTPless support team or create an issue in this repository.

---

## 📝 License
This project is licensed under the MIT License. See the `LICENSE` file for details.

# web-headless-demo
