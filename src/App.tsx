import React from "react";
import "./App.css";
const OTPlessPackage = React.lazy(() => import("./Containers/OTPlessPackage"));
const OTPlessLegacy = React.lazy(() => import("./Containers/OTPlessLegacy"));

const App: React.FC = () => {
	const [mode, setMode] = React.useState<"package" | "legacy" | null>(null);

	const resetMode = () => setMode(null);

	if (!mode) {
		return (
			<div className="App">
				<header className="App-header">
					<h1>OTPless SDK</h1>
					<div className="mode-selection">
						<button onClick={() => setMode("package")}>Package</button>
						<button onClick={() => setMode("legacy")}>Legacy</button>
					</div>
				</header>
			</div>
		);
	}

	return (
		<div className="App">
			<div className="mode-indicator">
				<button onClick={resetMode} className="back-button">← Back to selection</button>
			</div>
			{mode === "package" ? (
				<React.Suspense fallback={<div>Loading...</div>}>
					<OTPlessPackage />
				</React.Suspense>
			) : (
				<React.Suspense fallback={<div>Loading...</div>}>
					<OTPlessLegacy />
				</React.Suspense>
			)}
		</div>
	);
};

export default App;
