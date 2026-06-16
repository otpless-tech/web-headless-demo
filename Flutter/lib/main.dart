import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'auth_controller.dart';
import 'screens/login_screen.dart';
import 'screens/otp_screen.dart';
import 'screens/success_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0D1117),
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const OTPlessDemo());
}

class OTPlessDemo extends StatefulWidget {
  const OTPlessDemo({super.key});

  @override
  State<OTPlessDemo> createState() => _OTPlessDemoState();
}

class _OTPlessDemoState extends State<OTPlessDemo> {
  late final AuthController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AuthController();
    _controller.initialize();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OTPless Headless Demo',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      home: ListenableBuilder(
        listenable: _controller,
        builder: (context, _) => _buildFlow(),
      ),
    );
  }

  Widget _buildFlow() {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 380),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, animation) {
        final isIncoming = child.key == ValueKey(_controller.screen);
        final beginOffset =
            isIncoming ? const Offset(0.06, 0) : const Offset(-0.06, 0);
        return SlideTransition(
          position:
              Tween(begin: beginOffset, end: Offset.zero).animate(animation),
          child: FadeTransition(opacity: animation, child: child),
        );
      },
      child: switch (_controller.screen) {
        AuthScreen.login => LoginScreen(
            key: const ValueKey(AuthScreen.login),
            controller: _controller,
          ),
        AuthScreen.otp => OtpScreen(
            key: const ValueKey(AuthScreen.otp),
            controller: _controller,
          ),
        AuthScreen.success => SuccessScreen(
            key: const ValueKey(AuthScreen.success),
            controller: _controller,
          ),
      },
    );
  }

  ThemeData _buildTheme() {
    const bg = Color(0xFF0D1117);
    const surface = Color(0xFF161B27);
    const primary = Color(0xFF6366F1);

    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bg,
      colorScheme: const ColorScheme.dark(
        surface: surface,
        primary: primary,
        onPrimary: Colors.white,
        onSurface: Colors.white,
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
