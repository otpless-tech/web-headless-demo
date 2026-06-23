import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  Clipboard,
  Alert,
} from 'react-native';
import { COLORS } from '../constants';
import ResponseLogPanel from '../components/ResponseLogPanel';
import type { AuthHook } from '../useAuth';

interface Props {
  auth: AuthHook;
}

function truncate(s: string | null | undefined, len: number): string {
  if (!s) return '';
  return s.length <= len ? s : s.slice(0, len) + '...';
}

export default function SuccessScreen({ auth }: Props) {
  const [tokenExpanded, setTokenExpanded] = useState(false);
  const [showValidate, setShowValidate] = useState(false);

  const token = auth.token ?? '';
  const preview = truncate(token, 40);

  const handleCopy = () => {
    Clipboard.setString(token);
    Alert.alert('Copied', 'Token copied to clipboard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success icon */}
        <View style={styles.successCircle}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Authenticated!</Text>
        <Text style={styles.subheading}>
          Signed in with{' '}
          <Text style={styles.phoneHighlight}>
            +{auth.countryCode} {auth.phoneNumber}
          </Text>
        </Text>
        {auth.userId != null && (
          <Text style={styles.userId}>User ID: {auth.userId}</Text>
        )}

        {/* Token card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔑</Text>
            <Text style={styles.cardLabel}>Auth Token</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
              <Text style={styles.copyBtnText}>⎘  Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tokenBox}>
            <Text style={styles.tokenText} selectable>
              {tokenExpanded ? token : preview}
            </Text>
            {token.length > 40 && (
              <TouchableOpacity
                onPress={() => setTokenExpanded(v => !v)}
                style={styles.expandBtn}
              >
                <Text style={styles.expandBtnText}>
                  {tokenExpanded ? 'Show less' : 'Show full token'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Validate button */}
        <TouchableOpacity
          style={styles.validateBtn}
          onPress={() => setShowValidate(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.validateBtnText}>🛡  Validate Token</Text>
        </TouchableOpacity>

        {/* Sign out button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={auth.goToLogin}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ResponseLogPanel logs={auth.logs} onClear={auth.clearLogs} />

      {/* Validate modal */}
      <Modal
        visible={showValidate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowValidate(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowValidate(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeaderRow}>
            <View style={styles.sheetIconBox}>
              <Text style={styles.sheetIcon}>🛡</Text>
            </View>
            <Text style={styles.sheetTitle}>Validate Token</Text>
          </View>

          <Text style={styles.sheetDesc}>
            Send the token to your backend and call the OTPless Verify API to
            confirm the authentication.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeEndpoint}>
              POST https://auth.otpless.app/auth/userInfo
            </Text>
            <Text style={styles.codeBody}>
              {'{\n  "token": "' + truncate(token, 30) + '..."\n}'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.sheetCloseBtn}
            onPress={() => setShowValidate(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.sheetCloseBtnText}>Got it</Text>
          </TouchableOpacity>
          <View style={{ height: 8 }} />
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
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'center',
  },

  // Success animation
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.success + '1F',
    borderWidth: 1.5,
    borderColor: COLORS.success + '4D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 4,
  },
  checkmark: { color: COLORS.success, fontSize: 48, fontWeight: '300' },

  // Heading
  heading: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  phoneHighlight: { color: COLORS.text, fontWeight: '600' },
  userId: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 32,
  },

  // Token card
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 0,
  },
  cardIcon: { fontSize: 14, marginRight: 8 },
  cardLabel: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  copyBtn: {
    backgroundColor: COLORS.primary + '1F',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  copyBtnText: { color: COLORS.primaryLight, fontSize: 11, fontWeight: '600' },
  tokenBox: {
    margin: 16,
    padding: 12,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tokenText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  expandBtn: { marginTop: 8 },
  expandBtnText: { color: COLORS.primaryLight, fontSize: 11, fontWeight: '600' },

  // Validate button
  validateBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  validateBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Sign out
  signOutBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000066' },
  sheet: {
    backgroundColor: COLORS.surface2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.success + '1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sheetIcon: { fontSize: 18 },
  sheetTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  sheetDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  codeBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 16,
  },
  codeEndpoint: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  codeBody: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  sheetCloseBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCloseBtnText: { color: '#fff', fontWeight: '600' },
});
