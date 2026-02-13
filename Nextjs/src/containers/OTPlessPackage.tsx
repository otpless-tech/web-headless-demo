"use client";

import {
	CHANNELS,
	InitiateRequest,
	OAUTH_CHANNELS,
	OTPlessResponse,
	useOTPless,
} from "otpless-headless-js";
import React, { useEffect, useState } from "react";
import OTPlessUI from "@/components/OTPlessUI";
import { isAndroid } from "@/helpers/deviceDetection";

const getEnvConfig = () => ({
	appId: process.env.NEXT_PUBLIC_OTPLESS_APP_ID || "YOUR_APP_ID",
	otpLength: parseInt(process.env.NEXT_PUBLIC_OTP_LENGTH || "4", 10),
});

const OTPlessTesting: React.FC = () => {
	const config = getEnvConfig();
	const otpLength = config.otpLength;
	const [otp, setOtp] = useState<string[]>(Array(otpLength).fill(""));
	const [step, setStep] = useState<string>("auth");
	const [phone, setPhone] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [responses, setResponses] = useState<any[]>([]);
	const countryCode = "91"; // Hardcoded country code
	const {
		init,
		initiate: OTPlessInitiate,
		verify: OTPlessVerify,
		on,
		loading: OTPlessLoading,
	} = useOTPless();

	const initiateRequest = async (request: InitiateRequest) => {
		try {
			const initiate = await OTPlessInitiate(request);
			appendResponse(initiate);

			const step =
				initiate.response?.authType === "EMAIL_LOGIN" ? "link" : "otp";

			setStep(step);

			if (!initiate.success)
				setError(
					initiate.response?.errorMessage || "Unknown error occurred"
				);
		} catch (err) {
			setError("Failed to send OTP. Please try again.");
		}
	};

	const handlePhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		console.log("handlePhoneSubmit");

		if (!phone) return setError("Please enter your phone number");

		setError("");

		const request = {
			channel: CHANNELS.PHONE,
			phone,
			countryCode,
		};

		initiateRequest(request);
	};

	const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log("handleEmailSubmit");

		if (!email) return setError("Please enter your email");

		setError("");

		const request = {
			channel: CHANNELS.EMAIL,
			email,
		};

		initiateRequest(request);
	};

	const initiateTruecaller = async (
		e: React.MouseEvent<HTMLButtonElement>
	) => {
		e.preventDefault();

		if (!isAndroid())
			return setError("Truecaller is only supported on Android devices");

		try {
			const request = {
				channel: CHANNELS.OAUTH,
				channelType: OAUTH_CHANNELS.TRUE_CALLER,
			};

			const initiate = await OTPlessInitiate(request);
			appendResponse(initiate);
		} catch (err) {
			setError("Failed to send OTP. Please try again.");
		}
	};

	const initiateGoogle = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		try {
			const request = {
				channel: CHANNELS.OAUTH,
				channelType: "GMAIL",
			};

			const initiate = await OTPlessInitiate(request);
			appendResponse(initiate);
		} catch (err) {
			setError("Failed to send OTP. Please try again.");
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!otp.join("")) return setError("Please enter OTP");

		setError("");

		try {
			const request = {
				channel: CHANNELS.PHONE,
				phone,
				otp: otp.join(""),
				countryCode,
			};

			const verify = await OTPlessVerify(request);
			appendResponse(verify);
		} catch (err) {
			setError("Invalid OTP. Please try again.");
		}
	};

	const handlePhoneChange = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setStep("auth");
		setError("");
	};

	const appendResponse = (response: OTPlessResponse) => {
		console.log({ response });
		setResponses((prev) => [...prev, response]);
	};

	const ONETAP = (e: OTPlessResponse): void => {
		const { response } = e;
		console.log({ token: response?.token });
		appendResponse(e);

		setStep("success");

		// YOUR_LOGIC
	};

	const OTP_AUTO_READ = (e: OTPlessResponse): void => {
		appendResponse(e);

		const otp = e.response?.otp;
		if (!otp) return;

		// PREFILL OTP
		setOtp(otp.split(""));
	};

	const FAILED = (e: OTPlessResponse): void => {
		appendResponse(e);

		// YOUR_FALLBACK
	};

	const FALLBACK_TRIGGERED = (e: OTPlessResponse): void => {
		appendResponse(e);

		// YOUR_UI_CHANGE
	};

	const callback = { ONETAP, OTP_AUTO_READ, FAILED, FALLBACK_TRIGGERED };

	useEffect(() => {
		if (!init || !on) return;

		// init with app id from environment variables
		init(config.appId);

		// subscribe to multiple events at once (single unsubscribe)
		const off = on(callback);

		return () => off();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [init, on]);

	return (
		<OTPlessUI
			step={step}
			phone={phone}
			email={email}
			error={error}
			otp={otp}
			otpLength={otpLength}
			responses={responses}
			loading={OTPlessLoading}
			onPhoneSubmit={handlePhoneSubmit}
			onEmailSubmit={handleEmailSubmit}
			onOtpSubmit={handleOtpSubmit}
			onPhoneChange={handlePhoneChange}
			setEmail={setEmail}
			setPhone={setPhone}
			setOtp={setOtp}
			onTruecallerInitiate={initiateTruecaller}
			onGoogleInitiate={initiateGoogle}
		/>
	);
};

export default OTPlessTesting;
