import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Clipboard,
} from 'react-native';
import { COLORS } from '../constants';
import type { LogEntry } from '../useAuth';

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  SDK_READY: COLORS.success,
  ONETAP: COLORS.success,
  FAILED: COLORS.error,
  VERIFY: COLORS.success,
  INITIATE: COLORS.info,
  OTP_AUTO_READ: COLORS.warning,
  DELIVERY_STATUS: COLORS.cyan,
  FALLBACK_TRIGGERED: COLORS.orange,
};

function getTypeColor(type: string, isSuccess?: boolean): string {
  if (type === 'VERIFY') return isSuccess ? COLORS.success : COLORS.error;
  return TYPE_COLORS[type] ?? COLORS.textSecondary;
}

function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function LogItem({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = entry.statusCode != null && entry.statusCode >= 200 && entry.statusCode < 300;
  const color = getTypeColor(entry.type, isSuccess);
  const json = JSON.stringify(entry.data, null, 2);

  const handleCopy = () => {
    Clipboard.setString(json);
  };

  return (
    <TouchableOpacity
      style={styles.logItem}
      onPress={() => setExpanded(v => !v)}
      activeOpacity={0.7}
    >
      <View style={styles.logHeader}>
        <View style={[styles.typeBadge, { backgroundColor: color + '1F' }]}>
          <Text style={[styles.typeText, { color }]}>{entry.type}</Text>
        </View>
        {entry.statusCode != null && (
          <Text style={[styles.statusCode, { color: isSuccess ? COLORS.success : COLORS.error }]}>
            {entry.statusCode}
          </Text>
        )}
        <View style={styles.logSpacer} />
        <Text style={styles.logTime}>{formatTime(entry.timestamp)}</Text>
        <Text style={[styles.chevron, { transform: [{ rotate: expanded ? '180deg' : '0deg' }] }]}>
          ▾
        </Text>
      </View>

      {expanded && (
        <View style={styles.logBody}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.jsonText}>{json}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ResponseLogPanel({ logs, onClear }: Props) {
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(heightAnim, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start();
  };

  const panelHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.7}>
        <View style={[styles.dot, { backgroundColor: logs.length > 0 ? COLORS.success : COLORS.textMuted }]} />
        <Text style={styles.headerTitle}>Response Log</Text>
        {logs.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{logs.length}</Text>
          </View>
        )}
        <View style={styles.logSpacer} />
        {logs.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.chevron, { marginLeft: 10, transform: [{ rotate: expanded ? '180deg' : '0deg' }] }]}>
          ▾
        </Text>
      </TouchableOpacity>

      <Animated.View style={[styles.panelBody, { height: panelHeight }]}>
        {logs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No responses yet</Text>
          </View>
        ) : (
          <ScrollView style={styles.logList} showsVerticalScrollIndicator={false}>
            {logs.map(entry => (
              <LogItem key={entry.id} entry={entry} />
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  headerTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.primary + '26',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  logSpacer: { flex: 1 },
  clearText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginLeft: 8,
  },
  panelBody: {
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  logList: {
    flex: 1,
  },
  logItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typeBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusCode: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
  },
  logTime: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginRight: 4,
  },
  logBody: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    backgroundColor: COLORS.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jsonText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 15,
  },
  copyBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  copyBtnText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
});
