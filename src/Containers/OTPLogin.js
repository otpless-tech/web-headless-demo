
// OTPLogin.jsx
import { useEffect, useState } from 'react';
import { AlertIcon } from '../Components/AlertIcon';
import { OTPInput } from '../Components/OTPInput';
import { PhoneIcon } from '../Components/PhoneIcon';
import { appendResponse } from '../Helpers/appendResponse';
import { hitOTPlessSdk, OTPlessSdk } from '../Helpers/otpless';
import "./OTPlogin.css";

const OTPLogin = () => {
    const otpLength = 4;
    const [otp, setOtp] = useState(Array(otpLength).map(_ => ''));
    const [step, setStep] = useState('phone');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const countryCode = "91"

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();

        if (!phone) return setError("Please enter your phone number")

        setError('');
        setLoading(true);

        try {
            const request = {
                channel: 'PHONE',
                phone,
                countryCode,
            }

            const initiate = await hitOTPlessSdk({
                requestType: "initiate",
                request
            })
            appendResponse(initiate)
            console.log({ initiate })

            if (initiate.success) setStep('otp');
            else setError(initiate.response.errorMessage)

        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();

        if (!otp.join("")) return setError("Please enter OTP")

        setError('');
        setLoading(true);

        try {
            const verify = await hitOTPlessSdk({
                requestType: "verify",
                request: {
                    channel: 'PHONE',
                    phone,
                    otp: otp.join(""),
                    countryCode
                }
            })

            appendResponse(verify)

            console.log({ verify })

            // YOUR_ACTIONS

        } catch (err) {
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        OTPlessSdk();
    }, [])

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="header">
                    <div className="brand">OTPless Headless</div>
                    <h2 className="title">
                        {step === 'phone' ? `Let's Sign in` : 'Verify OTP'}
                    </h2>
                    <p className="subtitle">
                        {step === 'phone'
                            ? 'Sign in to your account to continue'
                            : `Enter the code we've sent to ${phone}`
                        }
                    </p>
                </div>

                {error && (
                    <div className="error">
                        <AlertIcon />
                        {error}
                    </div>
                )}

                {step === 'phone' ? (
                    <form onSubmit={handlePhoneSubmit} className="form">
                        <div className="input-group">
                            <PhoneIcon />
                            <input
                                className="input"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Continue'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit} className="form">
                        <OTPInput
                            value={otp}
                            onChange={setOtp}
                            length={otpLength}
                        />
                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                        <button
                            type="button"
                            className="button button-text"
                            onClick={() => {
                                setStep('phone');
                                setError('');
                            }}
                        >
                            Change Phone Number
                        </button>
                    </form>
                )}
            </div>
            <div id="response">
                <p className="title">Response: </p>
            </div>
        </div>
    );
};

export default OTPLogin;
