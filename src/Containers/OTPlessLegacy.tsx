import React, { useEffect, useState } from "react";
import OTPlessUI from "../Components/OTPlessUI";
import { isAndroid } from "../Helpers/deviceDetection";
import { hitOTPlessSdk, OTPlessSdk } from "../Helpers/otpless";

export interface OTPlessResponse {
	success: boolean;
	response: {
		errorMessage?: string;
		[key: string]: any;
	};
}

// Get configuration from environment variables
const getEnvConfig = () => ({
	otpLength: parseInt(process.env.REACT_APP_OTP_LENGTH || "4", 10),
});

const OTPlessLegacy: React.FC = () => {
	const config = getEnvConfig();
	const otpLength = config.otpLength;
	const [otp, setOtp] = useState<string[]>(Array(otpLength).fill(""));
	const [step, setStep] = useState<string>("phone");
	const [phone, setPhone] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const countryCode = "91"; // Hardcoded country code
	const [responses, setResponses] = useState<any[]>([]);

	const appendResponse = (response: any) =>
		setResponses((prev) => [...prev, response]);

	const handlePhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!phone) return setError("Please enter your phone number");

		setError("");
		setLoading(true);

		try {
			const request = {
				channel: "PHONE",
				phone,
				countryCode,
			};

			const initiate = (await hitOTPlessSdk({
				requestType: "initiate",
				request,
			})) as OTPlessResponse;

			appendResponse(initiate);
			console.log({ initiate });

			if (initiate.success) setStep("otp");
			else setError(initiate.response.errorMessage || "Unknown error");
		} catch (err) {
			setError("Failed to send OTP. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!otp.join("")) return setError("Please enter OTP");

		setError("");
		setLoading(true);

		try {
			const verify = (await hitOTPlessSdk({
				requestType: "verify",
				request: {
					channel: "PHONE",
					phone,
					otp: otp.join(""),
					countryCode,
				},
			})) as OTPlessResponse;

			appendResponse(verify);
			console.log({ verify });
		} catch (err) {
			setError("Invalid OTP. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const initiateTruecaller = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		if (!isAndroid()) {
			return setError("Truecaller is only supported on Android devices");
		}

		setError("");
		setLoading(true);

		try {
			const request = {
				channel: "OAUTH",
				channelType: "TRUE_CALLER",
			};

			const initiate = (await hitOTPlessSdk({
				requestType: "initiate",
				request,
			})) as OTPlessResponse;

			appendResponse(initiate);
			console.log({ initiate });
		} catch (err) {
			setError("Failed to initialize Truecaller. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		OTPlessSdk();
	}, []);

	const handlePhoneChange = (e: React.MouseEvent<HTMLButtonElement>) => {
		setStep("phone");
		setError("");
	};

	return (
		<OTPlessUI
			step={step}
			phone={phone}
			error={error}
			otp={otp}
			otpLength={otpLength}
			loading={loading}
			onPhoneSubmit={handlePhoneSubmit}
			onOtpSubmit={handleOtpSubmit}
			onPhoneChange={handlePhoneChange}
			setPhone={setPhone}
			setOtp={setOtp}
			onTruecallerInitiate={initiateTruecaller}
			responses={responses}
		/>
	);
};

export default OTPlessLegacy;
