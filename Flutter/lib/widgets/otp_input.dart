import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class OtpInput extends StatefulWidget {
  final int length;
  final ValueChanged<String> onCompleted;
  final String? prefillValue;

  const OtpInput({
    super.key,
    this.length = 6,
    required this.onCompleted,
    this.prefillValue,
  });

  @override
  State<OtpInput> createState() => OtpInputState();
}

class OtpInputState extends State<OtpInput> {
  late List<TextEditingController> _controllers;
  late List<FocusNode> _focusNodes;
  final _values = <String>[];

  static const _bg = Color(0xFF161B27);
  static const _border = Color(0xFF2D3748);
  static const _primary = Color(0xFF6366F1);
  static const _text = Color(0xFFF9FAFB);

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(widget.length, (_) => TextEditingController());
    _focusNodes = List.generate(widget.length, (_) => FocusNode());
    _values.addAll(List.filled(widget.length, ''));
  }

  @override
  void didUpdateWidget(OtpInput old) {
    super.didUpdateWidget(old);
    if (widget.prefillValue != null &&
        widget.prefillValue != old.prefillValue &&
        widget.prefillValue!.length == widget.length) {
      _prefill(widget.prefillValue!);
    }
  }

  void _prefill(String value) {
    for (var i = 0; i < widget.length; i++) {
      _controllers[i].text = value[i];
      _values[i] = value[i];
    }
    FocusScope.of(context).unfocus();
    widget.onCompleted(value);
    setState(() {});
  }

  void clear() {
    for (var i = 0; i < widget.length; i++) {
      _controllers[i].clear();
      _values[i] = '';
    }
    _focusNodes[0].requestFocus();
    setState(() {});
  }

  String get currentValue => _values.join();

  void _onChanged(int index, String value) {
    if (value.length > 1) {
      final cleaned = value.replaceAll(RegExp(r'\D'), '');
      if (cleaned.length >= widget.length) {
        _prefill(cleaned.substring(0, widget.length));
        return;
      }
    }

    if (value.isEmpty) {
      _values[index] = '';
    } else {
      _values[index] = value.substring(value.length - 1);
      _controllers[index].text = _values[index];
      _controllers[index].selection = TextSelection.collapsed(
        offset: _controllers[index].text.length,
      );
      if (index < widget.length - 1) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        final full = _values.join();
        if (full.length == widget.length) {
          widget.onCompleted(full);
        }
      }
    }

    setState(() {});
  }

  void _onKeyEvent(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _focusNodes[index - 1].requestFocus();
      _controllers[index - 1].clear();
      _values[index - 1] = '';
      setState(() {});
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(widget.length, (i) {
        final isFilled = _values[i].isNotEmpty;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: 46,
          height: 56,
          decoration: BoxDecoration(
            color: _bg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: _focusNodes[i].hasFocus
                  ? _primary
                  : isFilled
                      ? _primary.withOpacity(0.5)
                      : _border,
              width: _focusNodes[i].hasFocus ? 1.5 : 1,
            ),
          ),
          child: KeyboardListener(
            focusNode: FocusNode(),
            onKeyEvent: (e) => _onKeyEvent(i, e),
            child: TextField(
              controller: _controllers[i],
              focusNode: _focusNodes[i],
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              maxLength: 2,
              style: const TextStyle(
                color: _text,
                fontSize: 22,
                fontWeight: FontWeight.w600,
                letterSpacing: 0,
              ),
              decoration: const InputDecoration(
                counterText: '',
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: (v) => _onChanged(i, v),
              onTap: () {
                _controllers[i].selection = TextSelection(
                  baseOffset: 0,
                  extentOffset: _controllers[i].text.length,
                );
              },
            ),
          ),
        );
      }),
    );
  }
}
