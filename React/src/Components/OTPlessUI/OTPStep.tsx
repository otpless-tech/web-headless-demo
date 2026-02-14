import { OTPInput } from "../OTPInput";

interface OTPStepProps {
	otp: string[];
	setOtp: (otp: string[]) => void;
	otpLength: number;
	loading: boolean;
	onOtpSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onPhoneChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
	activeAuthTab: "phone" | "email" | "social";
}

export const OTPStep: React.FC<OTPStepProps> = ({
	otp,
	setOtp,
	otpLength,
	loading,
	onOtpSubmit,
	onPhoneChange,
	activeAuthTab,
}) => {
	return (
		<form onSubmit={onOtpSubmit} className="form">
			<OTPInput value={otp} onChange={setOtp} length={otpLength} />
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
				Change {activeAuthTab === "phone" ? "Phone Number" : "Email"}
			</button>
		</form>
	);
};
