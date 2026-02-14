export const LinkStep: React.FC = () => {
	return (
		<div className="status-screen">
			<div className="loader" aria-hidden="true" />
			<div className="status-title">Verifying your link</div>
			<p className="status-note">
				Please approve the link on your device to continue.
			</p>
		</div>
	);
};
