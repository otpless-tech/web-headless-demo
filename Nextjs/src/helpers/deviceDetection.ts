/**
 * Check if the current device is running Android
 * @returns true if the device is running Android
 */
export const isAndroid = (): boolean => {
	if (typeof navigator === "undefined") return false;
	return /android/i.test(navigator.userAgent);
};
