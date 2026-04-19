import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

/// Simple confetti overlay for tutorial completion
/// This is a simplified version of VictoryOverlay focused only on confetti
class ConfettiOverlay extends StatefulWidget {
  final bool isPlaying;
  final VoidCallback? onComplete;
  
  const ConfettiOverlay({
    super.key,
    this.isPlaying = false,
    this.onComplete,
  });
  
  @override
  State<ConfettiOverlay> createState() => _ConfettiOverlayState();
}

class _ConfettiOverlayState extends State<ConfettiOverlay> with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  final List<_ConfettiParticle> _particles = [];
  final Random _random = Random();
  
  static const List<Color> _colors = [
    Color(0xFFFF00FF), Color(0xFF00FFFF), Color(0xFFFFFF00),
    Color(0xFF00FF00), Color(0xFFFF6600), Color(0xFFFF69B4),
  ];
  
  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_onTick);
  }
  
  void _onTick(Duration elapsed) {
    if (!widget.isPlaying) return;
    
    for (var p in _particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.001; // Gravity
      p.rotation += p.rotSpeed;
    }
    setState(() {});
  }
  
  @override
  void didUpdateWidget(ConfettiOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isPlaying && !oldWidget.isPlaying) {
      _startEffect();
    } else if (!widget.isPlaying && oldWidget.isPlaying) {
      _ticker.stop();
      _particles.clear();
    }
  }
  
  void _startEffect() {
    _initParticles();
    if (!_ticker.isActive) _ticker.start();
  }
  
  void _initParticles() {
    _particles.clear();
    
    for (int i = 0; i < 50; i++) {
      _particles.add(_createParticle());
    }
  }
  
  _ConfettiParticle _createParticle() {
    return _ConfettiParticle(
      x: _random.nextDouble(),
      y: -0.2 - _random.nextDouble() * 0.5, // Start above screen
      vx: (_random.nextDouble() - 0.5) * 0.005, // Slight horizontal drift
      vy: 0.005 + _random.nextDouble() * 0.01,
      rotation: _random.nextDouble() * pi * 2,
      rotSpeed: (_random.nextDouble() - 0.5) * 0.1,
      size: 8 + _random.nextDouble() * 8,
      color: _colors[_random.nextInt(_colors.length)],
    );
  }
  
  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    if (!widget.isPlaying) return const SizedBox.shrink();
    
    return IgnorePointer(
      child: CustomPaint(
        painter: _ConfettiPainter(particles: _particles),
        size: Size.infinite,
      ),
    );
  }
}

class _ConfettiParticle {
  double x, y;
  double vx, vy;
  double size;
  Color color;
  double rotation;
  double rotSpeed;
  
  _ConfettiParticle({
    required this.x, required this.y, 
    required this.vx, required this.vy,
    required this.size, required this.color,
    required this.rotation, required this.rotSpeed,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_ConfettiParticle> particles;
  
  _ConfettiPainter({required this.particles});
  
  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      if (p.y < -0.2 || p.y > 1.2) continue; // Optimization clipping
      
      final x = p.x * size.width;
      final y = p.y * size.height;
      final paint = Paint()..color = p.color..style = PaintingStyle.fill;
      
      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(p.rotation);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.6), 
        paint
      );
      canvas.restore();
    }
  }
  
  @override
  bool shouldRepaint(_ConfettiPainter old) => true;
}
