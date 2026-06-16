import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/log_entry.dart';

class ResponseLogPanel extends StatefulWidget {
  final List<LogEntry> logs;
  final VoidCallback onClear;

  const ResponseLogPanel({
    super.key,
    required this.logs,
    required this.onClear,
  });

  @override
  State<ResponseLogPanel> createState() => _ResponseLogPanelState();
}

class _ResponseLogPanelState extends State<ResponseLogPanel>
    with SingleTickerProviderStateMixin {
  bool _expanded = false;
  late AnimationController _animController;
  late Animation<double> _heightAnim;

  static const _bg = Color(0xFF0D1117);
  static const _surface = Color(0xFF161B27);
  static const _border = Color(0xFF2D3748);
  static const _textSecondary = Color(0xFF9CA3AF);
  static const _textMuted = Color(0xFF6B7280);

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _heightAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() => _expanded = !_expanded);
    if (_expanded) {
      _animController.forward();
    } else {
      _animController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _surface,
        border: Border(top: BorderSide(color: _border)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHeader(),
          SizeTransition(
            sizeFactor: _heightAnim,
            axisAlignment: -1,
            child: SizedBox(
              height: 220,
              child: widget.logs.isEmpty
                  ? _buildEmptyState()
                  : _buildLogList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return GestureDetector(
      onTap: _toggle,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.logs.isEmpty
                    ? _textMuted
                    : const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Response Log',
              style: TextStyle(
                color: _textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            if (widget.logs.isNotEmpty) ...[
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${widget.logs.length}',
                  style: const TextStyle(
                    color: Color(0xFF818CF8),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
            const Spacer(),
            if (widget.logs.isNotEmpty)
              GestureDetector(
                onTap: widget.onClear,
                child: const Text(
                  'Clear',
                  style: TextStyle(
                    color: _textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            const SizedBox(width: 12),
            AnimatedRotation(
              turns: _expanded ? 0.5 : 0,
              duration: const Duration(milliseconds: 300),
              child: const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: _textMuted,
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.terminal_rounded,
            color: _textMuted,
            size: 28,
          ),
          const SizedBox(height: 8),
          const Text(
            'No responses yet',
            style: TextStyle(
              color: _textMuted,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogList() {
    return ListView.builder(
      padding: EdgeInsets.zero,
      reverse: false,
      itemCount: widget.logs.length,
      itemBuilder: (context, i) => _LogEntryTile(entry: widget.logs[i]),
    );
  }
}

class _LogEntryTile extends StatefulWidget {
  final LogEntry entry;

  const _LogEntryTile({required this.entry});

  @override
  State<_LogEntryTile> createState() => _LogEntryTileState();
}

class _LogEntryTileState extends State<_LogEntryTile> {
  bool _expanded = false;

  static const _surface2 = Color(0xFF1E2534);
  static const _border = Color(0xFF2D3748);
  static const _textSecondary = Color(0xFF9CA3AF);
  static const _textMuted = Color(0xFF6B7280);

  @override
  Widget build(BuildContext context) {
    final e = widget.entry;
    final time =
        '${e.timestamp.hour.toString().padLeft(2, '0')}:${e.timestamp.minute.toString().padLeft(2, '0')}:${e.timestamp.second.toString().padLeft(2, '0')}';

    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      child: Container(
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: _border, width: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Icon(e.icon, color: e.color, size: 14),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: e.color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      e.type,
                      style: TextStyle(
                        color: e.color,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                  if (e.statusCode != null) ...[
                    const SizedBox(width: 6),
                    Text(
                      '${e.statusCode}',
                      style: TextStyle(
                        color: e.isSuccess
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const Spacer(),
                  Text(
                    time,
                    style: const TextStyle(
                      color: _textMuted,
                      fontSize: 10,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(width: 8),
                  AnimatedRotation(
                    turns: _expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: _textMuted,
                      size: 14,
                    ),
                  ),
                ],
              ),
            ),
            if (_expanded)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _surface2,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        e.formattedJson,
                        style: const TextStyle(
                          color: _textSecondary,
                          fontSize: 10,
                          fontFamily: 'monospace',
                          height: 1.5,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(
                            ClipboardData(text: e.formattedJson));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Copied to clipboard'),
                            duration: Duration(seconds: 1),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                      child: const Padding(
                        padding: EdgeInsets.only(left: 8),
                        child: Icon(
                          Icons.copy_rounded,
                          color: _textMuted,
                          size: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
