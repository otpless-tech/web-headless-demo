"use client";

import Link from "next/link";
import OTPlessPackage from "@/containers/OTPlessPackage";

export default function PackagePage() {
	return (
		<div className="App">
			<div className="mode-indicator">
				<Link href="/" className="back-button">
					← Back to selection
				</Link>
			</div>
			<OTPlessPackage />
		</div>
	);
}
