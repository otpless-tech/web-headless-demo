import React, { useState } from "react";
import "../../Containers/OTPlogin.css";
import { getSubtitleText, getTitleText } from "../../Helpers/getStepsText";
import { AlertIcon } from "../AlertIcon";
import { Response } from "../Response";
import { AuthStep } from "./AuthStep";
import { LinkStep } from "./LinkStep";
import { OTPStep } from "./OTPStep";
import { SuccessStep } from "./SuccessStep";

interface OTPlessUIProps {
	// State
	step: string;
	phone: string;
	email: string;
	error: string;
	otp: string[];
	otpLength: number;
	responses?: any[];
	loading: boolean;

	// Handlers
	onPhoneSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onEmailSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onOtpSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onPhoneChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
	setPhone: (phone: string) => void;
	setEmail: (email: string) => void;
	setOtp: (otp: string[]) => void;

	// Additional UI elements
	onTruecallerInitiate?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	onGoogleInitiate?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const OTPlessUI: React.FC<OTPlessUIProps> = ({
	// State
	step,
	phone,
	email,
	error,
	otp,
	otpLength,
	responses,
	loading,

	// Handlers
	onPhoneSubmit,
	onEmailSubmit,
	onOtpSubmit,
	onPhoneChange,
	setPhone,
	setEmail,
	setOtp,

	// Additional UI elements
	onTruecallerInitiate,
	onGoogleInitiate,
}) => {
	const [activeAuthTab, setActiveAuthTab] = useState<
		"phone" | "email" | "social"
	>("phone");

	const renderSteps = () => {
		const steps = {
			auth: () => (
				<AuthStep
					activeAuthTab={activeAuthTab}
					setActiveAuthTab={setActiveAuthTab}
					onPhoneSubmit={onPhoneSubmit}
					onEmailSubmit={onEmailSubmit}
					loading={loading}
					phone={phone}
					email={email}
					onTruecallerInitiate={onTruecallerInitiate}
					onGoogleInitiate={onGoogleInitiate}
					setPhone={setPhone}
					setEmail={setEmail}
				/>
			),
			otp: () => (
				<OTPStep
					otp={otp}
					setOtp={setOtp}
					otpLength={otpLength}
					loading={loading}
					onOtpSubmit={onOtpSubmit}
					onPhoneChange={onPhoneChange}
					activeAuthTab={activeAuthTab}
				/>
			),
			link: () => <LinkStep />,
			success: () => <SuccessStep />,
		};

		try {
			return steps[step as keyof typeof steps]();
		} catch (error) {
			return steps.auth();
		}
	};

	return (
		<div className="login-wrapper">
			<div className="login-container">
				<div className="header">
					<div className="brand">OTPless Headless</div>
					<h2 className="title">{getTitleText(step)}</h2>
					<p className="subtitle">{getSubtitleText(step, phone || email)}</p>
				</div>

				{error && (
					<div className="error">
						<AlertIcon />
						{error}
					</div>
				)}

				{renderSteps()}
			</div>
			<Response responses={Array.isArray(responses) ? responses : []} />
		</div>
	);
};

export default OTPlessUI;
