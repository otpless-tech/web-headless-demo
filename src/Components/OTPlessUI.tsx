import React from "react";
import "../Containers/OTPlogin.css";
import { AlertIcon } from "./AlertIcon";
import { OTPInput } from "./OTPInput";
import { PhoneIcon } from "./PhoneIcon";
import { Response } from "./Response";

interface OTPlessUIProps {
	// State
	step: string;
	phone: string;
	error: string;
	otp: string[];
	otpLength: number;
	responses?: any[];
	loading: boolean;

	// Handlers
	onPhoneSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onOtpSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onPhoneChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
	setPhone: (phone: string) => void;
	setOtp: (otp: string[]) => void;

	// Additional UI elements
	onTruecallerInitiate?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const OTPlessUI: React.FC<OTPlessUIProps> = ({
	// State
	step,
	phone,
	error,
	otp,
	otpLength,
	responses,
	loading,

	// Handlers
	onPhoneSubmit,
	onOtpSubmit,
	onPhoneChange,
	setPhone,
	setOtp,

	// Additional UI elements
	onTruecallerInitiate,
}) => {
	return (
		<div className="login-wrapper">
			<div className="login-container">
				<div className="header">
					<div className="brand">OTPless Headless</div>
					<h2 className="title">
						{step === "phone" ? `Let's Sign in` : "Verify OTP"}
					</h2>
					<p className="subtitle">
						{step === "phone"
							? "Sign in to your account to continue"
							: `Enter the code we've sent to ${phone}`}
					</p>
				</div>

				{error && (
					<div className="error">
						<AlertIcon />
						{error}
					</div>
				)}

				{step === "phone" ? (
					<form onSubmit={onPhoneSubmit} className="form">
						<div className="input-group">
							<PhoneIcon />
							<input
								className="input"
								type="tel"
								placeholder="Enter your phone number"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								required
							/>
						</div>
						<button
							type="submit"
							className="button button-primary"
							disabled={loading}
						>
							{loading ? "Sending..." : "Continue"}
						</button>

						{onTruecallerInitiate && (
							<button
								className="button button-primary truecaller-button"
								disabled={loading}
								onClick={onTruecallerInitiate}
								type="button"
							>
								{loading
									? "Initiating Truecaller..."
									: "Sign in with Truecaller"}
							</button>
						)}
					</form>
				) : (
					<form onSubmit={onOtpSubmit} className="form">
						<OTPInput value={otp} onChange={setOtp} length={otpLength || 4} />
						<button
							type="submit"
							className="button button-primary"
							disabled={loading}
						>
							{loading ? "Verifying..." : "Verify & Continue"}
						</button>
						<button
							type="button"
							className="button button-text"
							onClick={onPhoneChange}
						>
							Change Phone Number
						</button>
					</form>
				)}
			</div>
			<Response responses={Array.isArray(responses) ? responses : []} />
		</div>
	);
};

export default OTPlessUI;
