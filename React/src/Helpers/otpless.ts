import { appendResponse } from "./appendResponse";

export interface EventCallback {
	responseType?: string;
	response?: {
		otp?: string;
		token?: string;
		[key: string]: any;
	};
	[key: string]: any;
}

interface OTPlessRequest {
	requestType: string;
	request: {
		channel?: string;
		phone?: string;
		countryCode?: string;
		otp?: string;
		channelType?: string;
		[key: string]: any;
	};
}

interface OTPlessInstance {
	initiate: (request: any) => Promise<any>;
	verify: (request: any) => Promise<any>;
	[key: string]: any;
}

interface WindowWithOTPless extends Window {
	OTPless?: new (
		callback: (eventCallback: EventCallback) => void
	) => OTPlessInstance;
}

let OTPlessSignin: OTPlessInstance | null = null;

const callback = (e: EventCallback): void => {
	console.log({ eventCallback: e });

	appendResponse(e);

	const ONETAP = (): void => {
		const { response } = e;
		// ── Session established ──────────────────────────────────────────
		// response.token    → short-lived JWT; attach to your API requests
		// response.idToken  → identity claims (sub, phone, email, etc.)
		// response.userId   → stable OTPless user ID
		//
		// Example:
		//   localStorage.setItem('otpless_token', response?.token ?? '');
		//   window.location.href = '/dashboard';
		// ────────────────────────────────────────────────────────────────
		console.log({ token: response?.token, idToken: response?.idToken, userId: response?.userId });
	};

	const OTP_AUTO_READ = (): void => {
		const { response } = e;
		const otp = response?.otp;
		// OTP auto-detected from SMS — fill the OTP input in your UI
		console.log({ autoReadOtp: otp });
	};

	const FAILED = (): void => {
		const { response } = e;
		// ── Auth flow failed ─────────────────────────────────────────────
		// response.errorMessage → human-readable failure reason
		//
		// Example:
		//   showErrorToUser(response?.errorMessage ?? 'Authentication failed');
		// ────────────────────────────────────────────────────────────────
		console.log({ error: response?.errorMessage });
	};

	const FALLBACK_TRIGGERED = (): void => {
		const { response } = e;
		// ── SDK switched to a fallback channel ───────────────────────────
		// Update your UI copy to reflect the new delivery method.
		// ────────────────────────────────────────────────────────────────
		console.log({ fallback: response });
	};

	const EVENTS_MAP: { [key: string]: () => void } = {
		ONETAP,
		OTP_AUTO_READ,
		FAILED,
		FALLBACK_TRIGGERED,
	};

	if (e.responseType && e.responseType in EVENTS_MAP)
		EVENTS_MAP[e.responseType]();
};

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
			const windowWithOTPless = window as WindowWithOTPless;

			if (windowWithOTPless.OTPless) {
				OTPlessSignin = new windowWithOTPless.OTPless(callback);
				resolve();
			} else {
				console.error("OTPless SDK not loaded properly");
				resolve();
			}
		};

		document.head.appendChild(script);
	});

export const hitOTPlessSdk = async (params: OTPlessRequest): Promise<any> => {
	await OTPlessSdk();

	if (!OTPlessSignin) {
		throw new Error("OTPless SDK not initialized");
	}

	const { requestType, request } = params;
	return await OTPlessSignin[requestType](request);
};
