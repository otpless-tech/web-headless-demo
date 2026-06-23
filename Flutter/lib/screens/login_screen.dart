import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../auth_controller.dart';
import '../widgets/response_log_panel.dart';

class LoginScreen extends StatefulWidget {
  final AuthController controller;

  const LoginScreen({super.key, required this.controller});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _phoneController = TextEditingController();
  final _phoneFocus = FocusNode();
  String _countryCode = '+91';
  bool _phoneValid = false;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnim;

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

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();
    _phoneController.addListener(() {
      final digits = _phoneController.text.replaceAll(RegExp(r'\D'), '');
      setState(() => _phoneValid = digits.length >= 10);
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _phoneFocus.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _submit() {
    final digits = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 10) return;
    final code = _countryCode.replaceAll('+', '');
    widget.controller.startWithPhone(digits, code);
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    return ListenableBuilder(
      listenable: c,
      builder: (context, _) {
        return Scaffold(
          backgroundColor: _bg,
          body: Column(
            children: [
              Expanded(
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 72),
                        _buildLogo(),
                        const SizedBox(height: 48),
                        _buildHeading(),
                        const SizedBox(height: 32),
                        _buildPhoneField(c.isLoading),
                        const SizedBox(height: 12),
                        if (c.errorMessage != null) _buildError(c.errorMessage!),
                        const SizedBox(height: 24),
                        _buildSendButton(c.isLoading),
                        const SizedBox(height: 32),
                        _buildDivider(),
                        const SizedBox(height: 20),
                        _buildNote(),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ),
              ResponseLogPanel(
                logs: c.logs,
                onClear: c.clearLogs,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLogo() {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.lock_open_rounded,
              color: Colors.white, size: 20),
        ),
        const SizedBox(width: 12),
        const Text(
          'OTPless',
          style: TextStyle(
            color: _text,
            fontSize: 20,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.3,
          ),
        ),
        Container(
          margin: const EdgeInsets.only(left: 8),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: _primary.withOpacity(0.15),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Text(
            'DEMO',
            style: TextStyle(
              color: _primaryLight,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeading() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Sign in',
          style: TextStyle(
            color: _text,
            fontSize: 32,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.8,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Enter your phone number to receive a one-time password.',
          style: TextStyle(
            color: _textSecondary,
            fontSize: 15,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildPhoneField(bool loading) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Phone number',
          style: TextStyle(
            color: _textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: _surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _phoneFocus.hasFocus ? _primary : _border,
              width: _phoneFocus.hasFocus ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              _buildCountrySelector(),
              Container(width: 1, height: 28, color: _border),
              Expanded(
                child: TextField(
                  controller: _phoneController,
                  focusNode: _phoneFocus,
                  enabled: !loading,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(
                    color: _text,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.5,
                  ),
                  decoration: const InputDecoration(
                    hintText: '9876543210',
                    hintStyle: TextStyle(color: _textMuted, fontSize: 16),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    contentPadding: EdgeInsets.symmetric(
                        horizontal: 16, vertical: 16),
                  ),
                  onSubmitted: (_) => _phoneValid && !loading ? _submit() : null,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCountrySelector() {
    return GestureDetector(
      onTap: () => _showCountryPicker(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: [
            const Text('🇮🇳', style: TextStyle(fontSize: 18)),
            const SizedBox(width: 6),
            Text(
              _countryCode,
              style: const TextStyle(
                color: _text,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down_rounded,
                color: _textMuted, size: 16),
          ],
        ),
      ),
    );
  }

  void _showCountryPicker() {
    final countries = [
      ('🇮🇳', 'India', '+91'),
      ('🇺🇸', 'United States', '+1'),
      ('🇬🇧', 'United Kingdom', '+44'),
      ('🇦🇪', 'UAE', '+971'),
      ('🇸🇬', 'Singapore', '+65'),
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: _surface2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: _border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Select Country',
              style: TextStyle(
                  color: _text, fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
          ...countries.map((c) => ListTile(
                leading: Text(c.$1, style: const TextStyle(fontSize: 24)),
                title: Text(c.$2,
                    style: const TextStyle(color: _text, fontSize: 15)),
                trailing: Text(c.$3,
                    style: const TextStyle(
                        color: _textSecondary, fontSize: 14)),
                onTap: () {
                  setState(() => _countryCode = c.$3);
                  Navigator.pop(context);
                },
              )),
          const SizedBox(height: 16),
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
            child: Text(
              message,
              style: const TextStyle(color: _error, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSendButton(bool loading) {
    final enabled = _phoneValid && !loading;
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
          onTap: enabled ? _submit : null,
          borderRadius: BorderRadius.circular(14),
          child: Center(
            child: loading
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
                        'Send OTP',
                        style: TextStyle(
                          color: enabled ? Colors.white : _textMuted,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.2,
                        ),
                      ),
                      if (enabled) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward_rounded,
                            color: Colors.white, size: 18),
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Divider(color: _border)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'secured by OTPless',
            style: TextStyle(color: _textMuted, fontSize: 11),
          ),
        ),
        Expanded(child: Divider(color: _border)),
      ],
    );
  }

  Widget _buildNote() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _primary.withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _primary.withOpacity(0.15)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline_rounded,
              color: _primaryLight, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'This is a demo. Replace YOUR_APP_ID in auth_controller.dart with your OTPless App ID from the dashboard.',
              style: TextStyle(
                color: _textSecondary,
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
