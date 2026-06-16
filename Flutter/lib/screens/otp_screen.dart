import 'dart:async';
import 'package:flutter/material.dart';
import '../auth_controller.dart';
import '../widgets/otp_input.dart';
import '../widgets/response_log_panel.dart';

class OtpScreen extends StatefulWidget {
  final AuthController controller;

  const OtpScreen({super.key, required this.controller});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen>
    with SingleTickerProviderStateMixin {
  final _otpKey = GlobalKey<OtpInputState>();
  String _otp = '';
  int _resendSeconds = 30;
  Timer? _timer;
  late AnimationController _slideController;
  late Animation<Offset> _slideAnim;
  String? _lastDetectedOtp;

  static const _bg = Color(0xFF0D1117);
  static const _surface = Color(0xFF161B27);
  static const _surface2 = Color(0xFF1E2534);
  static const _border = Color(0xFF2D3748);
  static const _primary = Color(0xFF6366F1);
  static const _primaryLight = Color(0xFF818CF8);
  static const _text = Color(0xFFF9FAFB);
  static const _textSecondary = Color(0xFF9CA3AF);
  static const _textMuted = Color(0xFF6B7280);
  static const _error = Color(0xFFEF4444);
  static const _success = Color(0xFF10B981);
  static const _warning = Color(0xFFF59E0B);

  @override
  void initState() {
    super.initState();
    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutCubic,
    ));
    _slideController.forward();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _slideController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _resendSeconds = 30);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_resendSeconds == 0) {
        _timer?.cancel();
      } else {
        setState(() => _resendSeconds--);
      }
    });
  }

  void _resend() {
    if (_resendSeconds > 0) return;
    _otpKey.currentState?.clear();
    setState(() => _otp = '');
    widget.controller.clearError();
    final phone = widget.controller.phoneNumber ?? '';
    final code = phone.isNotEmpty ? '91' : '91';
    widget.controller.startWithPhone(
      phone,
      code,
    );
    _startTimer();
  }

  void _verify() {
    if (_otp.length < 6) return;
    widget.controller.verifyOtp(_otp);
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    return ListenableBuilder(
      listenable: c,
      builder: (context, _) {
        if (c.detectedOtp != null && c.detectedOtp != _lastDetectedOtp) {
          _lastDetectedOtp = c.detectedOtp;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _otpKey.currentState?.clear();
            setState(() => _otp = c.detectedOtp!);
            c.clearDetectedOtp();
          });
        }

        return Scaffold(
          backgroundColor: _bg,
          body: Column(
            children: [
              Expanded(
                child: SlideTransition(
                  position: _slideAnim,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 60),
                        _buildBackButton(c),
                        const SizedBox(height: 32),
                        _buildHeading(c),
                        const SizedBox(height: 36),
                        _buildOtpSection(c),
                        if (c.errorMessage != null) ...[
                          const SizedBox(height: 16),
                          _buildError(c.errorMessage!),
                        ],
                        const SizedBox(height: 28),
                        _buildVerifyButton(c),
                        const SizedBox(height: 24),
                        _buildResendRow(c),
                        if (c.detectedOtp != null || _otp == c.detectedOtp)
                          _buildAutoReadBadge(),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ),
              ResponseLogPanel(logs: c.logs, onClear: c.clearLogs),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBackButton(AuthController c) {
    return GestureDetector(
      onTap: c.isLoading ? null : c.goToLogin,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _border),
            ),
            child: const Icon(Icons.arrow_back_rounded,
                color: _textSecondary, size: 18),
          ),
          const SizedBox(width: 10),
          const Text(
            'Back',
            style: TextStyle(color: _textSecondary, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildHeading(AuthController c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 56,
          height: 56,
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: _primary.withOpacity(0.12),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _primary.withOpacity(0.25)),
          ),
          child: const Icon(Icons.sms_outlined, color: _primaryLight, size: 26),
        ),
        const Text(
          'Verify OTP',
          style: TextStyle(
            color: _text,
            fontSize: 32,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.8,
          ),
        ),
        const SizedBox(height: 10),
        RichText(
          text: TextSpan(
            style: const TextStyle(
                color: _textSecondary, fontSize: 15, height: 1.5),
            children: [
              const TextSpan(text: 'Enter the 6-digit OTP sent to\n'),
              TextSpan(
                text: '+${c.phoneNumber ?? ''}',
                style: const TextStyle(
                  color: _text,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOtpSection(AuthController c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'One-time password',
          style: TextStyle(
            color: _textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        OtpInput(
          key: _otpKey,
          length: 6,
          prefillValue: c.detectedOtp,
          onCompleted: (v) => setState(() => _otp = v),
        ),
      ],
    );
  }

  Widget _buildAutoReadBadge() {
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: _warning.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _warning.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.auto_fix_high_rounded, color: _warning, size: 14),
          const SizedBox(width: 6),
          const Text(
            'OTP auto-filled from SMS',
            style: TextStyle(color: _warning, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildError(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: _error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _error.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: _error, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message,
                style: const TextStyle(color: _error, fontSize: 13)),
          ),
          GestureDetector(
            onTap: widget.controller.clearError,
            child: const Icon(Icons.close_rounded, color: _error, size: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifyButton(AuthController c) {
    final enabled = _otp.length == 6 && !c.isLoading;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 52,
      decoration: BoxDecoration(
        gradient: enabled
            ? const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              )
            : null,
        color: enabled ? null : _surface2,
        borderRadius: BorderRadius.circular(14),
        boxShadow: enabled
            ? [
                BoxShadow(
                  color: _primary.withOpacity(0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled ? _verify : null,
          borderRadius: BorderRadius.circular(14),
          child: Center(
            child: c.isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Verify OTP',
                        style: TextStyle(
                          color: enabled ? Colors.white : _textMuted,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (enabled) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.verified_outlined,
                            color: Colors.white, size: 18),
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildResendRow(AuthController c) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          "Didn't receive it? ",
          style: TextStyle(color: _textMuted, fontSize: 14),
        ),
        GestureDetector(
          onTap: _resendSeconds == 0 && !c.isLoading ? _resend : null,
          child: Text(
            _resendSeconds > 0
                ? 'Resend in ${_resendSeconds}s'
                : 'Resend OTP',
            style: TextStyle(
              color: _resendSeconds > 0 ? _textMuted : _primaryLight,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
