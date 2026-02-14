import { PhoneIcon } from "../PhoneIcon";
import { AuthTabs } from "./Tabs";

interface AuthStepProps {
	activeAuthTab: "phone" | "email" | "social";
	setActiveAuthTab: (tab: "phone" | "email" | "social") => void;
	onPhoneSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onEmailSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	loading: boolean;
	phone: string;
	email: string;
	onTruecallerInitiate?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	onGoogleInitiate?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	setPhone: (phone: string) => void;
	setEmail: (email: string) => void;
}

const PhoneTab: React.FC<Partial<AuthStepProps>> = ({
	onPhoneSubmit,
	phone,
	setPhone,
	loading,
}) => {
	return (
		<form onSubmit={onPhoneSubmit} className="form">
			<div className="section-label">Continue with phone</div>
			<div className="input-group">
				<PhoneIcon />
				<input
					className="input"
					type="tel"
					placeholder="Enter your phone number"
					value={phone}
					onChange={(e) => setPhone?.(e.target.value)}
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
		</form>
	);
};

const EmailTab: React.FC<Partial<AuthStepProps>> = ({
	onEmailSubmit,
	email,
	setEmail,
	loading,
}) => {
	return (
		<form onSubmit={onEmailSubmit} className="form">
			<div className="section-label">Continue with email</div>
			<div className="input-group">
				<PhoneIcon />
				<input
					className="input"
					type="email"
					placeholder="Enter your email"
					value={email}
					onChange={(e) => setEmail?.(e.target.value)}
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
		</form>
	);
};

const SocialTab: React.FC<Partial<AuthStepProps>> = ({
	onTruecallerInitiate,
	onGoogleInitiate,
	loading,
}) => {
	return (
		<div className="oauth-section">
			<div className="section-label">Sign in with social account</div>
			<div className="oauth-buttons">
				{onTruecallerInitiate && (
					<button
						className="button button-secondary"
						disabled={loading}
						onClick={onTruecallerInitiate}
						type="button"
					>
						{loading ? "Initiating Truecaller..." : "Sign in with Truecaller"}
					</button>
				)}
				{onGoogleInitiate && (
					<button
						className="button button-secondary"
						disabled={loading}
						onClick={onGoogleInitiate}
						type="button"
					>
						{loading ? "Initiating Google..." : "Sign in with Google"}
					</button>
				)}
			</div>
		</div>
	);
};

export const AuthStep: React.FC<AuthStepProps> = ({
	activeAuthTab,
	setActiveAuthTab,
	onPhoneSubmit,
	onEmailSubmit,
	loading,
	phone,
	email,
	onTruecallerInitiate,
	onGoogleInitiate,
	setPhone,
	setEmail,
}) => {
	const renderAuthTabs = () => {
		const tabs = {
			phone: () => (
				<PhoneTab
					onPhoneSubmit={onPhoneSubmit}
					phone={phone}
					setPhone={setPhone}
					loading={loading}
				/>
			),
			email: () => (
				<EmailTab
					onEmailSubmit={onEmailSubmit}
					email={email}
					setEmail={setEmail}
					loading={loading}
				/>
			),
			social: () => (
				<SocialTab
					onTruecallerInitiate={onTruecallerInitiate}
					onGoogleInitiate={onGoogleInitiate}
					loading={loading}
				/>
			),
		};

		try {
			return tabs[activeAuthTab as keyof typeof tabs]();
		} catch (error) {
			return tabs.phone();
		}
	};

	return (
		<div className="auth-sections">
			<AuthTabs
				activeAuthTab={activeAuthTab}
				setActiveAuthTab={setActiveAuthTab}
			/>

			<div className="compact-form auth-panel">{renderAuthTabs()}</div>
		</div>
	);
};
