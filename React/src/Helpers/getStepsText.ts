export const getTitleText = (step: string) => {
	const map = {
		phone: "Let's Sign in",
		email: "Let's Sign in",
		otp: "Verify OTP",
		link: "Verifying your link",
		success: "Success",
	};

	try {
		return map[step as keyof typeof map];
	} catch (error) {
		console.error(error);
		return "Let's Sign in";
	}
};

export const getSubtitleText = (step: string, value: string) => {
	const map = {
		phone: "Sign in to your account to continue",
		email: "Sign in to your account to continue",
		otp: `Enter the code we've sent to ${value}`,
		link: "Please approve the link to continue",
		success: "You are now securely signed in",
	};

	try {
		return map[step as keyof typeof map];
	} catch (error) {
		console.error(error);
		return "Sign in to your account to continue";
	}
};
