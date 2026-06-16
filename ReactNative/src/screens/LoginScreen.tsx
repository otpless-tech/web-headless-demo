import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../constants';
import ResponseLogPanel from '../components/ResponseLogPanel';
import type { AuthHook } from '../useAuth';

interface Props {
  auth: AuthHook;
}

const COUNTRIES = [
  { flag: '🇮🇳', name: 'India', code: '91' },
  { flag: '🇺🇸', name: 'United States', code: '1' },
  { flag: '🇬🇧', name: 'United Kingdom', code: '44' },
  { flag: '🇦🇪', name: 'UAE', code: '971' },
  { flag: '🇸🇬', name: 'Singapore', code: '65' },
];

export default function LoginScreen({ auth }: Props) {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showPicker, setShowPicker] = useState(false);

  const isValid = phone.replace(/\D/g, '').length >= 10;

  const handleSubmit = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || auth.isLoading) return;
    auth.startWithPhone(digits, country.code);
  };

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
          {/* Logo */}
          <View style={styles.logo}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>🔓</Text>
            </View>
            <Text style={styles.logoText}>OTPless</Text>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>DEMO</Text>
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Sign in</Text>
          <Text style={styles.subheading}>
            Enter your phone number to receive a one-time password.
          </Text>

          {/* Phone field label */}
          <Text style={styles.label}>Phone number</Text>

          {/* Phone input row */}
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countryBtn}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.countryCode}>+{country.code}</Text>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>
            <View style={styles.dividerV} />
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={t => setPhone(t.replace(/\D/g, ''))}
              placeholder="9876543210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              editable={!auth.isLoading}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {/* Error */}
          {auth.errorMessage != null && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠  {auth.errorMessage}</Text>
            </View>
          )}

          {/* Send OTP button */}
          <TouchableOpacity
            style={[styles.btn, isValid && !auth.isLoading ? styles.btnActive : styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || auth.isLoading}
            activeOpacity={0.85}
          >
            {auth.isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.btnText, !isValid && styles.btnTextDisabled]}>
                {isValid ? 'Send OTP  →' : 'Send OTP'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>secured by OTPless</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Info note */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ</Text>
            <Text style={styles.infoText}>
              This is a demo. Replace APP_ID in src/constants.ts with your OTPless App ID from the dashboard.
            </Text>
          </View>
        </ScrollView>

        <ResponseLogPanel logs={auth.logs} onClear={auth.clearLogs} />
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Select Country</Text>
          {COUNTRIES.map(c => (
            <TouchableOpacity
              key={c.code}
              style={styles.countryItem}
              onPress={() => { setCountry(c); setShowPicker(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.countryItemFlag}>{c.flag}</Text>
              <Text style={styles.countryItemName}>{c.name}</Text>
              <Text style={styles.countryItemCode}>+{c.code}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 24 }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },

  // Logo
  logo: { flexDirection: 'row', alignItems: 'center', marginBottom: 48 },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoIconText: { fontSize: 18 },
  logoText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  demoBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.primary + '26',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  demoBadgeText: { color: COLORS.primaryLight, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  // Heading
  heading: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },

  // Phone field
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  flag: { fontSize: 18, marginRight: 6 },
  countryCode: { color: COLORS.text, fontSize: 15, fontWeight: '600', marginRight: 4 },
  chevron: { color: COLORS.textMuted, fontSize: 12 },
  dividerV: { width: 1, height: 28, backgroundColor: COLORS.border },
  phoneInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 16,
    letterSpacing: 0.5,
  },

  // Error
  errorBox: {
    backgroundColor: COLORS.error + '1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.error + '4D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: { color: COLORS.error, fontSize: 13 },

  // Button
  btn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
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
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  btnTextDisabled: { color: COLORS.textMuted },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: 11, marginHorizontal: 16 },

  // Info
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '26',
    padding: 14,
  },
  infoIcon: { color: COLORS.primaryLight, fontSize: 14, marginRight: 10 },
  infoText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
  },
  sheet: {
    backgroundColor: COLORS.surface2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  countryItemFlag: { fontSize: 24, marginRight: 12 },
  countryItemName: { flex: 1, color: COLORS.text, fontSize: 15 },
  countryItemCode: { color: COLORS.textSecondary, fontSize: 14 },
});
