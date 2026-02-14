import React from "react";

interface AuthTabsProps {
	activeAuthTab: "phone" | "email" | "social";
	setActiveAuthTab: (tab: "phone" | "email" | "social") => void;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({
	activeAuthTab,
	setActiveAuthTab,
}) => {
	return (
		<div className="auth-tabs" role="tablist" aria-label="Sign in methods">
			<button
				type="button"
				role="tab"
				aria-selected={activeAuthTab === "phone"}
				className={`auth-tab ${activeAuthTab === "phone" ? "active" : ""}`}
				onClick={() => setActiveAuthTab("phone")}
			>
				Phone
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeAuthTab === "email"}
				className={`auth-tab ${activeAuthTab === "email" ? "active" : ""}`}
				onClick={() => setActiveAuthTab("email")}
			>
				Email
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeAuthTab === "social"}
				className={`auth-tab ${activeAuthTab === "social" ? "active" : ""}`}
				onClick={() => setActiveAuthTab("social")}
			>
				Social
			</button>
		</div>
	);
};
