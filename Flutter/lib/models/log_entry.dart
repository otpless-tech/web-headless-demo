import 'dart:convert';
import 'package:flutter/material.dart';

class LogEntry {
  final String type;
  final int? statusCode;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  const LogEntry({
    required this.type,
    required this.statusCode,
    required this.data,
    required this.timestamp,
  });

  bool get isSuccess =>
      statusCode != null && statusCode! >= 200 && statusCode! < 300;

  String get formattedJson {
    const encoder = JsonEncoder.withIndent('  ');
    return encoder.convert(data);
  }

  Color get color {
    switch (type) {
      case 'SDK_READY':
        return const Color(0xFF10B981);
      case 'ONETAP':
        return const Color(0xFF10B981);
      case 'FAILED':
        return const Color(0xFFEF4444);
      case 'VERIFY':
        return isSuccess ? const Color(0xFF10B981) : const Color(0xFFEF4444);
      case 'INITIATE':
        return const Color(0xFF3B82F6);
      case 'OTP_AUTO_READ':
        return const Color(0xFFF59E0B);
      case 'DELIVERY_STATUS':
        return const Color(0xFF06B6D4);
      case 'FALLBACK_TRIGGERED':
        return const Color(0xFFF97316);
      default:
        return const Color(0xFF9CA3AF);
    }
  }

  IconData get icon {
    switch (type) {
      case 'SDK_READY':
        return Icons.check_circle_outline_rounded;
      case 'ONETAP':
        return Icons.verified_rounded;
      case 'FAILED':
        return Icons.error_outline_rounded;
      case 'VERIFY':
        return isSuccess
            ? Icons.check_circle_outline_rounded
            : Icons.cancel_outlined;
      case 'INITIATE':
        return Icons.send_rounded;
      case 'OTP_AUTO_READ':
        return Icons.auto_fix_high_rounded;
      case 'DELIVERY_STATUS':
        return Icons.inbox_rounded;
      case 'FALLBACK_TRIGGERED':
        return Icons.alt_route_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }
}
