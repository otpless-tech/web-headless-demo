import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants';
import OtpInput, { OtpInputRef } from '../components/OtpInput';
import ResponseLogPanel from '../components/ResponseLogPanel';
import type { AuthHook } from '../useAuth';

interface Props {
  auth: AuthHook;
}

export default function OtpScreen({ auth }: Props) {
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(30);
  const otpRef = useRef<OtpInputRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDetectedOtp = useRef<string | null>(null);

  // Start resend countdown
  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Auto-fill OTP when detected
  useEffect(() => {
    if (auth.detectedOtp && auth.detectedOtp !== lastDetectedOtp.current) {
      lastDetectedOtp.current = auth.detectedOtp;
      otpRef.current?.prefill(auth.detectedOtp);
      setOtp(auth.detectedOtp);
      auth.clearDetectedOtp();
    }
  }, [auth.detectedOtp]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendSeconds(30);
    timerRef.current = setInterval(() => {
      setResendSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = () => {
    if (resendSeconds > 0 || auth.isLoading) return;
    otpRef.current?.clear();
    setOtp('');
    auth.clearError();
    auth.startWithPhone(auth.phoneNumber!, auth.countryCode!);
    startTimer();
  };

  const handleVerify = () => {
    if (otp.length < 6 || auth.isLoading) return;
    auth.verifyOtp(otp);
  };

  const canVerify = otp.length === 6 && !auth.isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={auth.isLoading ? undefined : auth.goToLogin}
            activeOpacity={0.7}
          >
            <View style={styles.backIcon}>
              <Text style={styles.backArrow}>←</Text>
            </View>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.icon}>
            <Text style={styles.iconEmoji}>💬</Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Verify OTP</Text>
          <Text style={styles.subheading}>
            Enter the 6-digit OTP sent to{'\n'}
            <Text style={styles.phoneHighlight}>
              +{auth.countryCode} {auth.phoneNumber}
            </Text>
          </Text>

          {/* OTP input */}
          <Text style={styles.label}>One-time password</Text>
          <OtpInput
            ref={otpRef}
            length={6}
            onComplete={v => setOtp(v)}
          />

          {/* Auto-fill badge */}
          {lastDetectedOtp.current != null && (
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>✨  OTP auto-filled from SMS</Text>
            </View>
          )}

          {/* Error */}
          {auth.errorMessage != null && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠  {auth.errorMessage}</Text>
              <TouchableOpacity onPress={auth.clearError} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.errorClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.btn, canVerify ? styles.btnActive : styles.btnDisabled]}
            onPress={handleVerify}
            disabled={!canVerify}
            activeOpacity={0.85}
          >
            {auth.isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.btnText, !canVerify && styles.btnTextDisabled]}>
                {canVerify ? 'Verify OTP  ✓' : 'Verify OTP'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend row */}
          <View style={styles.resendRow}>
            <Text style={styles.resendPrompt}>Didn't receive it? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendSeconds > 0 || auth.isLoading}
            >
              <Text style={[styles.resendText, resendSeconds > 0 && styles.resendDisabled]}>
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ResponseLogPanel logs={auth.logs} onClear={auth.clearLogs} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },

  // Back
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  backIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backArrow: { color: COLORS.textSecondary, fontSize: 16 },
  backText: { color: COLORS.textSecondary, fontSize: 14 },

  // Icon
  icon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '1F',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconEmoji: { fontSize: 26 },

  // Heading
  heading: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 36,
  },
  phoneHighlight: { color: COLORS.text, fontWeight: '600' },

  // OTP label
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },

  // Auto-fill badge
  autoBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: COLORS.warning + '1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning + '4D',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  autoBadgeText: { color: COLORS.warning, fontSize: 12 },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.error + '4D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  errorText: { flex: 1, color: COLORS.error, fontSize: 13 },
  errorClose: { color: COLORS.error, fontSize: 14, marginLeft: 8 },

  // Button
  btn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 24,
  },
  btnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  btnDisabled: { backgroundColor: COLORS.surface2 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnTextDisabled: { color: COLORS.textMuted },

  // Resend
  resendRow: { flexDirection: 'row', justifyContent: 'center' },
  resendPrompt: { color: COLORS.textMuted, fontSize: 14 },
  resendText: { color: COLORS.primaryLight, fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: COLORS.textMuted },
});
