import * as React from "react";
import { useEffect, useRef } from "react";

interface OTPInputProps {
	value: string[];
	onChange: (value: string[]) => void;
	length: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({
	value,
	onChange,
	length,
}) => {
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const handleChange = (index: number, inputValue: string) => {
		if (inputValue.length > 1) return;

		const newValue = [...value];
		newValue[index] = inputValue;
		onChange(newValue);

		if (inputValue && index < length - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Backspace" && !value[index] && index > 0) {
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
					ref={(el: HTMLInputElement | null) => {
						inputRefs.current[index] = el;
					}}
					className="otp-input"
					type="text"
					inputMode="numeric"
					pattern="[0-9]*"
					maxLength={1}
					value={value[index] || ""}
					onChange={(e) => handleChange(index, e.target.value)}
					onKeyDown={(e) => handleKeyDown(index, e)}
					required
				/>
			))}
		</div>
	);
};
