
import React, { useEffect, useRef } from 'react';

export const OTPInput = ({ value, onChange, length }) => {
    const inputRefs = useRef([]);

    const handleChange = (index, inputValue) => {
        if (inputValue.length > 1) return;

        const newValue = [...value];
        newValue[index] = inputValue;
        onChange(newValue);

        if (inputValue && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    return (
        <div className="otp-group">
            {[...Array(length)].map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={value[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    required
                />
            ))}
        </div>
    );
};
