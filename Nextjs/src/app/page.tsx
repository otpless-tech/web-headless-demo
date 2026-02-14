import Link from "next/link";

export default function Home() {
	return (
		<div className="App">
			<header className="App-header">
				<h1>OTPless SDK</h1>
				<div className="mode-selection">
					<Link href="/package">Package</Link>
					<Link href="/legacy">Legacy</Link>
				</div>
			</header>
		</div>
	);
}
