import { appendResponse } from "./appendResponse";

let OTPlessSignin = null;

const callback = (eventCallback) => {

    console.log({ eventCallback });

    appendResponse(eventCallback)

    const ONETAP = () => {
        const { response } = eventCallback;


        console.log({ response, token: response.token });

        // YOUR_LOGIC
    };

    const OTP_AUTO_READ = () => {
        const { response: { otp } } = eventCallback;

        console.log({ otp })
    }

    const FAILED = () => {
        const { response } = eventCallback;

        console.log({ response })
    }

    const FALLBACK_TRIGGERED = () => {
        const { response } = eventCallback;

        console.log({ response })
    }


    const EVENTS_MAP = {
        ONETAP,
        OTP_AUTO_READ,
        FAILED,
        FALLBACK_TRIGGERED
    }

    if ("responseType" in eventCallback) EVENTS_MAP[eventCallback.responseType]()
}

export const OTPlessSdk = async () => new Promise(async (resolve) => {

    if (document.getElementById('otpless-sdk') && OTPlessSignin) return resolve();
    const appId = "YOUR_APP_ID"; // Replace with your App ID

    const script = document.createElement('script');
    script.src = `https://otpless.com/v4.3/headless.js`;
    script.id = "otpless-sdk";
    script.setAttribute('data-appid', appId);

    script.onload = function () {
        const OTPless = Reflect.get(window, "OTPless")
        OTPlessSignin = new OTPless(callback);
        resolve()
    };

    document.head.appendChild(script);
});


export const hitOTPlessSdk = async (params) => {
    await OTPlessSdk();

    const { requestType, request } = params;

    return await OTPlessSignin[requestType](request)
}