import {
	CHANNELS,
	OAUTH_CHANNELS,
	OTPlessResponse,
	useOTPless,
} from "otpless-headless-js";
import React, { useEffect, useState } from "react";
import OTPlessUI from "../Components/OTPlessUI";
import { isAndroid } from "../Helpers/deviceDetection";

const getEnvConfig = () => ({
	appId: process.env.REACT_APP_OTPLESS_APP_ID || "YOUR_APP_ID",
	otpLength: parseInt(process.env.REACT_APP_OTP_LENGTH || "4", 10),
});

const OTPlessTesting: React.FC = () => {
	const config = getEnvConfig();
	const otpLength = config.otpLength;
	const [otp, setOtp] = useState<string[]>(Array(otpLength).fill(""));
	const [step, setStep] = useState<string>("phone");
	const [phone, setPhone] = useState<string>("");
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

	const handlePhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log("handlePhoneSubmit");

		if (!phone) return setError("Please enter your phone number");

		setError("");

		try {
			const request = {
				channel: CHANNELS.PHONE,
				phone,
				countryCode,
			};

			const initiate = await OTPlessInitiate(request);
			appendResponse(initiate);

			if (initiate.success) setStep("otp");
			else
				setError(initiate.response?.errorMessage || "Unknown error occurred");
		} catch (err) {
			setError("Failed to send OTP. Please try again.");
		}
	};

	const initiateTruecaller = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
		setStep("phone");
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
	}, [init, on]);

	return (
		<OTPlessUI
			step={step}
			phone={phone}
			error={error}
			otp={otp}
			otpLength={otpLength}
			responses={responses}
			loading={OTPlessLoading}
			onPhoneSubmit={handlePhoneSubmit}
			onOtpSubmit={handleOtpSubmit}
			onPhoneChange={handlePhoneChange}
			setPhone={setPhone}
			setOtp={setOtp}
			onTruecallerInitiate={initiateTruecaller}
		/>
	);
};

export default OTPlessTesting;
