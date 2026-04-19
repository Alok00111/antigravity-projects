import 'dart:math';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:vibration/vibration.dart';
import '../features/scanner/data/scan_repository.dart';
import '../features/scanner/domain/scan_model.dart';
import '../services/streak_service.dart';
import '../utils/roast_generator.dart';
import '../widgets/shareable_card.dart';
import 'home_screen.dart';

class ResultScreen extends StatefulWidget {
  final int cortisolLevel;
  final String roast;
  final String tier;
  final Color tierColor;
  final double? smilingProbability;
  final String? expressionLabel;

  const ResultScreen({
    super.key,
    required this.cortisolLevel,
    required this.roast,
    required this.tier,
    required this.tierColor,
    this.smilingProbability,
    this.expressionLabel,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen>
    with TickerProviderStateMixin {
  late AnimationController _meterController;
  late AnimationController _shakeController;
  late AnimationController _textFadeController;

  final ScanRepository _scanRepo = ScanRepository();
  final GlobalKey _shareCardKey = GlobalKey();
  bool _scanSaved = false;
  bool _isSharing = false;

  @override
  void initState() {
    super.initState();

    _meterController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );

    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );

    _textFadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _startRevealSequence();
  }

  Future<void> _startRevealSequence() async {
    await Future.delayed(const Duration(milliseconds: 500));
    _meterController.forward();
    await Future.delayed(const Duration(milliseconds: 1200));
    _triggerShake();

    try {
      if (await Vibration.hasVibrator()) {
        Vibration.vibrate(pattern: [0, 50, 100, 50, 100, 200]);
      }
    } catch (_) {}

    await Future.delayed(const Duration(milliseconds: 800));
    _textFadeController.forward();

    _saveScanToFirestore();
    StreakService.recordScan();
  }

  Future<void> _saveScanToFirestore() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || _scanSaved) return;

    try {
      final scan = ScanResult(
        userId: user.uid,
        cortisolLevel: widget.cortisolLevel,
        tier: widget.tier,
        roast: widget.roast,
        smilingProbability: widget.smilingProbability,
        expressionLabel: widget.expressionLabel,
        timestamp: DateTime.now(),
      );

      await _scanRepo.saveScan(scan);
      _scanSaved = true;
    } catch (e) {
      debugPrint('Failed to save scan: $e');
    }
  }

  void _triggerShake() {
    _shakeController.repeat(reverse: true);
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) _shakeController.stop();
    });
  }

  Future<void> _shareResult() async {
    if (_isSharing) return;
    setState(() => _isSharing = true);

    // Small delay to let the card render
    await Future.delayed(const Duration(milliseconds: 100));

    await ShareableResultCard.captureAndShare(
      repaintKey: _shareCardKey,
      cortisolLevel: widget.cortisolLevel,
      tier: widget.tier,
      roast: widget.roast,
    );

    if (mounted) setState(() => _isSharing = false);
  }

  @override
  void dispose() {
    _meterController.dispose();
    _shakeController.dispose();
    _textFadeController.dispose();
    super.dispose();
  }

  Color _getMeterColor(int value) {
    final ratio = (value / 1000).clamp(0.0, 1.0);
    if (ratio < 0.2) return const Color(0xFF38B29C);
    if (ratio < 0.4) return const Color(0xFFE5DE44);
    if (ratio < 0.6) return const Color(0xFFFBBC05);
    if (ratio < 0.8) return const Color(0xFFF37B21);
    return const Color(0xFFFF1A1A);
  }

  void _scanAgain() {
    Navigator.pushAndRemoveUntil(
      context,
      PageRouteBuilder(
        pageBuilder:
            (context, animation, secondaryAnimation) => const HomeScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 500),
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final emoji = RoastGenerator.getTierEmoji(widget.cortisolLevel);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      body: SafeArea(
        child: Stack(
          children: [
            // Main visible UI
            AnimatedBuilder(
              animation: _shakeController,
              builder: (context, child) {
                final shakeOffset =
                    _shakeController.isAnimating
                        ? (Random().nextDouble() - 0.5) * 6
                        : 0.0;
                return Transform.translate(
                  offset: Offset(shakeOffset, shakeOffset * 0.5),
                  child: child,
                );
              },
              child: CustomScrollView(
                slivers: [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Column(
                        children: [
                          const Spacer(flex: 1),

                          // Header
                          const Text(
                            'Analysis Complete',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF8E8E93),
                              letterSpacing: 1,
                            ),
                          ),

                          // Detected expression
                          if (widget.expressionLabel != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF2F2F7),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: const Color(0xFFE5E5EA),
                                ),
                              ),
                              child: Text(
                                '"${widget.expressionLabel}"',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF3C3C43),
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],

                          const SizedBox(height: 32),

                          // The big cortisol number
                          AnimatedBuilder(
                            animation: _meterController,
                            builder: (context, child) {
                              final displayValue =
                                  (_meterController.value *
                                          widget.cortisolLevel)
                                      .toInt();

                              return Column(
                                children: [
                                  Text(
                                    '$displayValue',
                                    style: TextStyle(
                                      fontSize: 96,
                                      fontWeight: FontWeight.w900,
                                      color: _getMeterColor(displayValue),
                                      height: 1.0,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'ng/dL',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF8E8E93),
                                      letterSpacing: 2,
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),

                          const SizedBox(height: 20),

                          // Tier badge with emoji
                          AnimatedBuilder(
                            animation: _meterController,
                            builder: (context, child) {
                              if (_meterController.value < 0.8) {
                                return const SizedBox.shrink();
                              }
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: _getMeterColor(widget.cortisolLevel),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  '$emoji ${widget.tier}',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                    letterSpacing: 1,
                                  ),
                                ),
                              );
                            },
                          ),

                          const SizedBox(height: 28),

                          // The cortisol meter
                          AnimatedBuilder(
                            animation: _meterController,
                            builder: (context, child) {
                              return SizedBox(
                                height: 220,
                                child: _CortisolGauge(
                                  value:
                                      _meterController.value *
                                      (widget.cortisolLevel / 1000).clamp(
                                        0.0,
                                        1.0,
                                      ),
                                ),
                              );
                            },
                          ),

                          const SizedBox(height: 32),

                          // The roast
                          FadeTransition(
                            opacity: _textFadeController,
                            child: SlideTransition(
                              position: Tween<Offset>(
                                begin: const Offset(0, 0.2),
                                end: Offset.zero,
                              ).animate(
                                CurvedAnimation(
                                  parent: _textFadeController,
                                  curve: Curves.easeOutCubic,
                                ),
                              ),
                              child: Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: const Color(0xFFE5E5EA),
                                  ),
                                ),
                                child: Text(
                                  '"${widget.roast}"',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontStyle: FontStyle.italic,
                                    color: Color(0xFF3C3C43),
                                    height: 1.6,
                                  ),
                                ),
                              ),
                            ),
                          ),

                          const Spacer(flex: 2),

                          // Share button (primary CTA)
                          FadeTransition(
                            opacity: _textFadeController,
                            child: GestureDetector(
                              onTap: _shareResult,
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 18,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFF453A),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (_isSharing)
                                      const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    else ...[
                                      const Icon(
                                        Icons.share_rounded,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'Share & Roast Your Friends',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Scan again (secondary)
                          FadeTransition(
                            opacity: _textFadeController,
                            child: GestureDetector(
                              onTap: _scanAgain,
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: const Color(0xFFE5E5EA),
                                  ),
                                ),
                                child: const Text(
                                  'Scan Again',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF3C3C43),
                                  ),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Off-screen shareable card (rendered for capture only)
            Positioned(
              left: -1000,
              top: -1000,
              child: ShareableResultCard(
                repaintKey: _shareCardKey,
                cortisolLevel: widget.cortisolLevel,
                tier: widget.tier,
                tierColor: _getMeterColor(widget.cortisolLevel),
                roast: widget.roast,
                expressionLabel: widget.expressionLabel,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CortisolGauge extends StatelessWidget {
  final double value; // 0.0 to 1.0

  const _CortisolGauge({required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: CustomPaint(
            size: const Size(double.infinity, 120),
            painter: _GaugePainter(value: value),
          ),
        ),
        const SizedBox(height: 12),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'LOW',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Color(0xFF38B29C),
                letterSpacing: 1.2,
              ),
            ),
            Text(
              'HIGH',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Color(0xFFFF1A1A),
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          'CORTISOL',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: Color(0xFF2B2B2B),
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }
}

class _GaugePainter extends CustomPainter {
  final double value;

  _GaugePainter({required this.value});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height);
    final baseRadius = min(size.width / 2, size.height);
    final radius = baseRadius * 0.85;

    final paint =
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = baseRadius * 0.25
          ..strokeCap = StrokeCap.butt;

    final List<Color> colors = [
      const Color(0xFF38B29C),
      const Color(0xFFE5DE44),
      const Color(0xFFFBBC05),
      const Color(0xFFF37B21),
      const Color(0xFFFF1A1A),
    ];

    final segmentAngle = pi / colors.length;

    // Draw arcs
    for (int i = 0; i < colors.length; i++) {
      paint.color = colors[i];
      final startAngle = pi + (i * segmentAngle);
      final gapAngle = 0.04;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        segmentAngle - gapAngle,
        false,
        paint,
      );
    }

    // Inner thin semi-circle with tick marks
    final innerRadius = radius * 0.75;
    final innerPaint =
        Paint()
          ..color = const Color(0xFF8E8E93)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.0;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: innerRadius),
      pi,
      pi,
      false,
      innerPaint,
    );

    // Draw thick/thin tick marks
    for (int i = 0; i <= 20; i++) {
      final angle = pi + (i * (pi / 20));
      final bool isMajor = i % 5 == 0;
      final tickLength = isMajor ? 12.0 : 6.0;

      final p1 = Offset(
        center.dx + cos(angle) * innerRadius,
        center.dy + sin(angle) * innerRadius,
      );
      final p2 = Offset(
        center.dx + cos(angle) * (innerRadius - tickLength),
        center.dy + sin(angle) * (innerRadius - tickLength),
      );

      canvas.drawLine(p1, p2, innerPaint..strokeWidth = isMajor ? 2.0 : 1.0);
    }

    // Draw needle
    final needleAngle = pi + (value * pi);

    final needleStroke =
        Paint()
          ..color = const Color(0xFFFF1A1A)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 6.0
          ..strokeCap = StrokeCap.round;

    final needleLength = radius * 0.9;

    final endPoint = Offset(
      center.dx + cos(needleAngle) * needleLength,
      center.dy + sin(needleAngle) * needleLength,
    );

    // Red line to point
    canvas.drawLine(center, endPoint, needleStroke);

    // Center circular hub
    final hubPaint =
        Paint()
          ..color = const Color(0xFFFF1A1A)
          ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 12, hubPaint);

    final innerHubPaint =
        Paint()
          ..color = Colors.white
          ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 6, innerHubPaint);
  }

  @override
  bool shouldRepaint(covariant _GaugePainter oldDelegate) {
    return oldDelegate.value != value;
  }
}
