import 'package:flutter/widgets.dart';
import 'package:otpless_headless_flutter/otpless_flutter.dart';
import 'models/log_entry.dart';

const _appId = 'YOUR_APP_ID';

enum AuthScreen { login, otp, success }

class AuthController extends ChangeNotifier {
  final _otpless = Otpless();

  AuthScreen _screen = AuthScreen.login;
  bool _isLoading = false;
  String? _token;
  String? _idToken;
  String? _userId;
  String? _phoneNumber;
  String? _countryCode;
  String? _detectedOtp;
  String? _errorMessage;
  final List<LogEntry> _logs = [];

  AuthScreen get screen => _screen;
  bool get isLoading => _isLoading;
  String? get token => _token;
  String? get idToken => _idToken;
  String? get userId => _userId;
  String? get phoneNumber => _phoneNumber;
  String? get detectedOtp => _detectedOtp;
  String? get errorMessage => _errorMessage;
  List<LogEntry> get logs => List.unmodifiable(_logs);

  void initialize() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _otpless.initialize(_appId);
      _otpless.setResponseCallback(_onResponse);
    });
  }

  void _onResponse(dynamic result) {
    _otpless.commitResponse(result);

    final responseType = result['responseType'] as String?;
    final statusCode = result['statusCode'] as int?;

    _addLog(LogEntry(
      type: responseType ?? 'UNKNOWN',
      statusCode: statusCode,
      data: Map<String, dynamic>.from(result),
      timestamp: DateTime.now(),
    ));

    switch (responseType) {
      case 'SDK_READY':
        break;

      case 'FAILED':
        _isLoading = false;
        _errorMessage =
            result['response']?['errorMessage'] ?? 'SDK initialization failed';

      case 'INITIATE':
        _isLoading = false;
        if (statusCode == 200) {
          final authType = result['response']?['authType'];
          if (authType == 'OTP' || authType == 'MAGICLINK') {
            _screen = AuthScreen.otp;
          }
          _errorMessage = null;
        } else {
          _errorMessage =
              result['response']?['errorMessage'] ?? 'Failed to send OTP';
        }

      case 'OTP_AUTO_READ':
        _detectedOtp = result['response']?['otp'] as String?;

      case 'VERIFY':
        if (statusCode == 200) {
          _errorMessage = null;
        } else {
          _isLoading = false;
          _errorMessage =
              result['response']?['errorMessage'] ?? 'Verification failed';
        }

      case 'ONETAP':
        _isLoading = false;
        final data = result['response']?['data'] as Map<String, dynamic>?;
        _token = data?['token'] as String?;
        _idToken = data?['idToken'] as String?;
        _userId = data?['userId'] as String?;
        _screen = AuthScreen.success;
        _errorMessage = null;

      case 'DELIVERY_STATUS':
      case 'FALLBACK_TRIGGERED':
        break;
    }

    notifyListeners();
  }

  void _addLog(LogEntry entry) {
    _logs.insert(0, entry);
    if (_logs.length > 100) _logs.removeLast();
  }

  Future<void> startWithPhone(String phone, String countryCode) async {
    _phoneNumber = phone;
    _countryCode = countryCode;
    _errorMessage = null;
    _detectedOtp = null;
    _isLoading = true;
    notifyListeners();

    final ready = await _otpless.isSdkReady();
    if (!ready) {
      _isLoading = false;
      _errorMessage = 'SDK not ready. Reinitializing — please try again.';
      _otpless.initialize(_appId);
      notifyListeners();
      return;
    }

    _otpless.start(_onResponse, {
      'phone': phone,
      'countryCode': countryCode,
    });
  }

  void verifyOtp(String otp) {
    _errorMessage = null;
    _detectedOtp = null;
    _isLoading = true;
    notifyListeners();

    _otpless.start(_onResponse, {
      'phone': _phoneNumber!,
      'countryCode': _countryCode!,
      'otp': otp,
    });
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearDetectedOtp() {
    _detectedOtp = null;
  }

  void goToLogin() {
    _screen = AuthScreen.login;
    _isLoading = false;
    _errorMessage = null;
    _phoneNumber = null;
    _countryCode = null;
    _token = null;
    _idToken = null;
    _userId = null;
    _detectedOtp = null;
    notifyListeners();
  }

  void clearLogs() {
    _logs.clear();
    notifyListeners();
  }
}
