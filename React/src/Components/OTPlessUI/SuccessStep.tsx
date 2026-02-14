export const SuccessStep: React.FC = () => {
	return (
		<div className="status-screen success-screen">
			<div className="success-icon" aria-hidden="true">
				✓
			</div>
			<div className="status-title">Sign in successful</div>
			<p className="status-note">You can now continue to your account.</p>
		</div>
	);
};
