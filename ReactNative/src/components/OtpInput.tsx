import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { COLORS } from '../constants';

export interface OtpInputRef {
  clear: () => void;
  prefill: (value: string) => void;
}

interface Props {
  length?: number;
  onComplete: (otp: string) => void;
}

const OtpInput = forwardRef<OtpInputRef, Props>(
  ({ length = 6, onComplete }, ref) => {
    const [values, setValues] = useState<string[]>(Array(length).fill(''));
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const inputs = useRef<(TextInput | null)[]>(Array(length).fill(null));

    useImperativeHandle(ref, () => ({
      clear: () => {
        setValues(Array(length).fill(''));
        inputs.current[0]?.focus();
      },
      prefill: (value: string) => {
        const digits = value.slice(0, length).split('');
        const next = [...Array(length).fill(''), ...digits].slice(-length);
        const filled = digits.slice(0, length);
        const newVals = [
          ...filled,
          ...Array(length - filled.length).fill(''),
        ];
        setValues(newVals);
        inputs.current[length - 1]?.blur();
        if (filled.length === length) {
          onComplete(filled.join(''));
        }
      },
    }));

    const handleChange = (index: number, text: string) => {
      const cleaned = text.replace(/\D/g, '');

      // Handle paste of full OTP
      if (cleaned.length > 1) {
        const digits = cleaned.slice(0, length).split('');
        const newVals = [...Array(length).fill(''), ...digits]
          .slice(-length)
          .slice(0, length);
        const filled = digits.slice(0, length);
        const paddedVals = [
          ...filled,
          ...Array(length - filled.length).fill(''),
        ];
        setValues(paddedVals);
        const nextFocus = Math.min(filled.length, length - 1);
        inputs.current[nextFocus]?.focus();
        if (filled.length === length) {
          onComplete(filled.join(''));
        }
        return;
      }

      const newVals = [...values];
      newVals[index] = cleaned;
      setValues(newVals);

      if (cleaned && index < length - 1) {
        inputs.current[index + 1]?.focus();
      }

      const full = newVals.join('');
      if (!newVals.includes('') && full.length === length) {
        onComplete(full);
      }
    };

    const handleKeyPress = (
      index: number,
      e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    ) => {
      if (e.nativeEvent.key === 'Backspace' && values[index] === '' && index > 0) {
        const newVals = [...values];
        newVals[index - 1] = '';
        setValues(newVals);
        inputs.current[index - 1]?.focus();
      }
    };

    return (
      <View style={styles.row}>
        {Array.from({ length }, (_, i) => {
          const isFocused = focusedIndex === i;
          const isFilled = values[i] !== '';
          return (
            <TextInput
              key={i}
              ref={el => (inputs.current[i] = el)}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                isFilled && !isFocused && styles.boxFilled,
              ]}
              value={values[i]}
              onChangeText={t => handleChange(i, t)}
              onKeyPress={e => handleKeyPress(i, e)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              selectTextOnFocus
              caretHidden
              contextMenuHidden
            />
          );
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    width: 46,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '600',
  },
  boxFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  boxFilled: {
    borderColor: COLORS.primary + '80',
  },
});

export default OtpInput;
