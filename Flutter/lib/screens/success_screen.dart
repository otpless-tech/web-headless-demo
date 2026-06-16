import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../auth_controller.dart';
import '../widgets/response_log_panel.dart';

class SuccessScreen extends StatefulWidget {
  final AuthController controller;

  const SuccessScreen({super.key, required this.controller});

  @override
  State<SuccessScreen> createState() => _SuccessScreenState();
}

class _SuccessScreenState extends State<SuccessScreen>
    with TickerProviderStateMixin {
  late AnimationController _checkController;
  late AnimationController _slideController;
  late Animation<double> _checkScale;
  late Animation<double> _checkOpacity;
  late Animation<Offset> _slideAnim;
  bool _tokenExpanded = false;

  static const _bg = Color(0xFF0D1117);
  static const _surface = Color(0xFF161B27);
  static const _surface2 = Color(0xFF1E2534);
  static const _border = Color(0xFF2D3748);
  static const _primary = Color(0xFF6366F1);
  static const _primaryLight = Color(0xFF818CF8);
  static const _text = Color(0xFFF9FAFB);
  static const _textSecondary = Color(0xFF9CA3AF);
  static const _textMuted = Color(0xFF6B7280);
  static const _success = Color(0xFF10B981);

  @override
  void initState() {
    super.initState();

    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _checkScale = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 0.0, end: 1.2)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 60),
      TweenSequenceItem(
          tween: Tween(begin: 1.2, end: 1.0)
              .chain(CurveTween(curve: Curves.easeIn)),
          weight: 40),
    ]).animate(_checkController);

    _checkOpacity = Tween(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _checkController,
        curve: const Interval(0, 0.4),
      ),
    );

    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutCubic,
    ));

    Future.delayed(const Duration(milliseconds: 100), () {
      _checkController.forward();
      _slideController.forward();
    });
  }

  @override
  void dispose() {
    _checkController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  void _copyToken() {
    final token = widget.controller.token ?? '';
    Clipboard.setData(ClipboardData(text: token));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Colors.white, size: 16),
            SizedBox(width: 8),
            Text('Token copied to clipboard'),
          ],
        ),
        backgroundColor: _success,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showValidateDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: _surface2,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: _border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _success.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.shield_outlined,
                      color: _success, size: 20),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Validate Token',
                  style: TextStyle(
                      color: _text,
                      fontSize: 18,
                      fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Send the token to your backend and call the OTPless Verify API to confirm the authentication.',
              style: TextStyle(
                  color: _textSecondary, fontSize: 14, height: 1.6),
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF0D1117),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'POST https://auth.otpless.app/auth/userInfo',
                    style: TextStyle(
                      color: _primaryLight,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '{\n  "token": "${_truncate(widget.controller.token, 30)}..."\n}',
                    style: const TextStyle(
                      color: _textSecondary,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Got it',
                    style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  String _truncate(String? s, int len) {
    if (s == null || s.length <= len) return s ?? '';
    return s.substring(0, len);
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
                child: SlideTransition(
                  position: _slideAnim,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        const SizedBox(height: 80),
                        _buildSuccessAnimation(),
                        const SizedBox(height: 32),
                        _buildHeading(c),
                        const SizedBox(height: 32),
                        _buildTokenCard(c),
                        const SizedBox(height: 16),
                        _buildValidateButton(),
                        const SizedBox(height: 16),
                        _buildSignOutButton(c),
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

  Widget _buildSuccessAnimation() {
    return ScaleTransition(
      scale: _checkScale,
      child: FadeTransition(
        opacity: _checkOpacity,
        child: Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _success.withOpacity(0.12),
            border: Border.all(color: _success.withOpacity(0.3), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: _success.withOpacity(0.2),
                blurRadius: 32,
                spreadRadius: 4,
              ),
            ],
          ),
          child: const Icon(
            Icons.check_rounded,
            color: _success,
            size: 48,
          ),
        ),
      ),
    );
  }

  Widget _buildHeading(AuthController c) {
    return Column(
      children: [
        const Text(
          'Authenticated!',
          style: TextStyle(
            color: _text,
            fontSize: 28,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            style: const TextStyle(
                color: _textSecondary, fontSize: 14, height: 1.5),
            children: [
              const TextSpan(text: 'Signed in with '),
              TextSpan(
                text: c.phoneNumber != null ? '+91 ${c.phoneNumber}' : 'phone',
                style: const TextStyle(
                  color: _text,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        if (c.userId != null) ...[
          const SizedBox(height: 6),
          Text(
            'User ID: ${c.userId}',
            style: const TextStyle(color: _textMuted, fontSize: 11,
                fontFamily: 'monospace'),
          ),
        ],
      ],
    );
  }

  Widget _buildTokenCard(AuthController c) {
    final token = c.token ?? '';
    final preview = token.length > 40
        ? '${token.substring(0, 40)}...'
        : token;

    return Container(
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                const Icon(Icons.token_outlined, color: _primaryLight, size: 16),
                const SizedBox(width: 8),
                const Text(
                  'Auth Token',
                  style: TextStyle(
                    color: _textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: _copyToken,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _primary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.copy_rounded,
                            color: _primaryLight, size: 12),
                        SizedBox(width: 4),
                        Text(
                          'Copy',
                          style: TextStyle(
                            color: _primaryLight,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _surface2,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _tokenExpanded ? token : preview,
                    style: const TextStyle(
                      color: _textSecondary,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      height: 1.6,
                      letterSpacing: 0.2,
                    ),
                  ),
                  if (token.length > 40) ...[
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: () =>
                          setState(() => _tokenExpanded = !_tokenExpanded),
                      child: Text(
                        _tokenExpanded ? 'Show less' : 'Show full token',
                        style: const TextStyle(
                          color: _primaryLight,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildValidateButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: _primary.withOpacity(0.35),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: _showValidateDialog,
            borderRadius: BorderRadius.circular(14),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.shield_outlined, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text(
                  'Validate Token',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSignOutButton(AuthController c) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton(
        onPressed: c.goToLogin,
        style: OutlinedButton.styleFrom(
          foregroundColor: _textSecondary,
          side: const BorderSide(color: _border),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.logout_rounded, size: 16),
            SizedBox(width: 8),
            Text(
              'Sign out',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}
