"use client";

import Link from "next/link";
import OTPlessLegacy from "@/containers/OTPlessLegacy";

export default function LegacyPage() {
	return (
		<div className="App">
			<div className="mode-indicator">
				<Link href="/" className="back-button">
					← Back to selection
				</Link>
			</div>
			<OTPlessLegacy />
		</div>
	);
}
