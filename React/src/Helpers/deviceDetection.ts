/**
 * Check if the current device is running Android
 * @returns true if the device is running Android
 */
export const isAndroid = (): boolean => {
    return /android/i.test(navigator.userAgent);
};
