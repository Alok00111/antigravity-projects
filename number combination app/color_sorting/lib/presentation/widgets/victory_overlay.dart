import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../state/settings_provider.dart';
import '../../data/models/victory_pack.dart';
import '../../data/models/victory_effect_model.dart';

/// Unified overlay for victory effects (Confetti, Fireworks, Bubbles)
class VictoryOverlay extends StatefulWidget {
  final bool isPlaying;
  final VoidCallback? onComplete;
  
  const VictoryOverlay({
    super.key,
    this.isPlaying = false,
    this.onComplete,
  });
  
  @override
  State<VictoryOverlay> createState() => _VictoryOverlayState();
}

class _VictoryOverlayState extends State<VictoryOverlay> with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  final List<_Particle> _particles = [];
  final Random _random = Random();
  VictoryEffectType _currentType = VictoryEffectType.confetti;
  double _time = 0;
  
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
    
    _time += 0.016; 
    
    // Add new particles occasionally to maintain density (Looping)
    if (_particles.length < 150) { 
       if (_currentType == VictoryEffectType.bubbles && _time % 0.5 < 0.02) {
           // Bubbles can still gently loop as they float up and disappear
           _spawnBubbleBurst();
       } else if (_currentType == VictoryEffectType.fireworks && _random.nextDouble() < 0.05) {
           // Fireworks: Occasional extra bursts are nice, but maybe limit them?
           // User complaint was mostly about confetti.
           // Let's keep fireworks occasional for a "show" but stop confetti.
           _spawnFireworkBurst();
       }
       // Removed Confetti loop: "I need it to do it once"
    }
    
    for (int i = _particles.length - 1; i >= 0; i--) {
        final p = _particles[i];
        
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.life -= p.decay;
        
        // Type specific physics
        if (_currentType == VictoryEffectType.bubbles) {
            // Wobble
            p.x += sin(_time * 2 + p.randomOffset) * 0.001;
            p.vy *= 0.99; // Drag
        } else if (_currentType == VictoryEffectType.fireworks) {
             p.vy += 0.0005; // Gravity
             p.vx *= 0.96; // Drag
             p.vy *= 0.96;
        } else {
             // Confetti: Gravity + Sway
             p.vy += 0.0003; // Light gravity
             p.vx += sin(_time * 3 + p.randomOffset) * 0.0001; // Sway
             p.vx *= 0.99; // Air resistance
        }
        
        // Remove dead particles
        if (p.life <= 0 || p.y > 1.2 || p.y < -0.5) {
           _particles.removeAt(i);
        }
    }
    
    setState(() {});
  }
  
  @override
  void didUpdateWidget(VictoryOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isPlaying && !oldWidget.isPlaying) {
      _startEffect();
    } else if (!widget.isPlaying && oldWidget.isPlaying) {
      _ticker.stop();
      _particles.clear();
    }
  }
  
  void _startEffect() {
    final settings = context.read<SettingsProvider>();
    final effectModel = VictoryPack.getById(settings.activeEffectId);
    _currentType = effectModel.type;
    
    _particles.clear();
    _ticker.start();
    
    // Initial burst
    if (_currentType == VictoryEffectType.confetti) {
       for(int i=0; i<5; i++) _spawnConfettiBurst();
    } else if (_currentType == VictoryEffectType.fireworks) {
       _spawnFireworkBurst();
    } else {
       _spawnBubbleBurst();
    }
  }

  void _spawnConfettiBurst() {
     // Party Popper Style: Burst from bottom corners
     // Left Corner
     for (int i = 0; i < 15; i++) _particles.add(_createConfettiParticle(true));
     // Right Corner
     for (int i = 0; i < 15; i++) _particles.add(_createConfettiParticle(false));
  }
  
  void _spawnFireworkBurst() {
     double cx = 0.2 + _random.nextDouble() * 0.6;
     double cy = 0.2 + _random.nextDouble() * 0.4;
     Color color = _colors[_random.nextInt(_colors.length)];
     
     for (int i=0; i<40; i++) {
        double angle = _random.nextDouble() * 2 * pi;
        double speed = 0.005 + _random.nextDouble() * 0.015;
        _particles.add(_Particle(
           x: cx, y: cy,
           vx: cos(angle) * speed, vy: sin(angle) * speed,
           size: 3 + _random.nextDouble() * 4,
           color: color,
           rotation: 0, rotSpeed: 0,
           life: 1.0, decay: 0.01 + _random.nextDouble() * 0.01,
           randomOffset: 0
        ));
     }
  }
  
  void _spawnBubbleBurst() {
     for (int i=0; i<10; i++) {
        _particles.add(_Particle(
           x: _random.nextDouble(),
           y: 1.1 + _random.nextDouble() * 0.2,
           vx: (_random.nextDouble() - 0.5) * 0.002,
           vy: -0.005 - _random.nextDouble() * 0.01, 
           size: 10 + _random.nextDouble() * 20,
           color: _colors[_random.nextInt(_colors.length)].withValues(alpha: 0.4),
           rotation: 0, rotSpeed: 0,
           life: 1.0, decay: 0.0, // Bubbles live until off screen
           randomOffset: _random.nextDouble() * 100
        ));
     }
  }

  _Particle _createConfettiParticle(bool leftSide) {
      double angleBase = leftSide ? -pi/4 : -3*pi/4; // Aim towards center-up
      double angle = angleBase + (_random.nextDouble() - 0.5); 
      double speed = 0.015 + _random.nextDouble() * 0.015;
      
      return _Particle(
          x: leftSide ? 0.0 : 1.0,
          y: 1.0, // Bottom
          vx: cos(angle) * speed,
          vy: sin(angle) * speed,
          rotation: _random.nextDouble() * pi * 2,
          rotSpeed: (_random.nextDouble() - 0.5) * 0.2,
          size: 6 + _random.nextDouble() * 6,
          color: _colors[_random.nextInt(_colors.length)],
          life: 1.0,
          decay: 0.002 + _random.nextDouble() * 0.005,
          randomOffset: _random.nextDouble() * 10
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
        painter: _VictoryPainter(
          particles: _particles,
          type: _currentType,
        ),
        size: Size.infinite,
      ),
    );
  }
}

class _Particle {
  double x, y;
  double vx, vy;
  double size;
  Color color;
  double rotation;
  double rotSpeed;
  double life;
  double decay;
  double randomOffset;
  
  _Particle({
    required this.x, required this.y, 
    required this.vx, required this.vy,
    required this.size, required this.color,
    required this.rotation, required this.rotSpeed,
    required this.life, required this.decay,
    required this.randomOffset,
  });
}

class _VictoryPainter extends CustomPainter {
  final List<_Particle> particles;
  final VictoryEffectType type;
  
  _VictoryPainter({required this.particles, required this.type});
  
  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      final x = p.x * size.width;
      final y = p.y * size.height;
      if (x < -50 || x > size.width + 50) continue;
      
      final opacity = type == VictoryEffectType.bubbles ? 1.0 : p.life.clamp(0.0, 1.0);
      final paint = Paint()..color = p.color.withValues(alpha: opacity * (p.color.a))..style = PaintingStyle.fill;
      
      if (type == VictoryEffectType.bubbles) {
          canvas.drawCircle(Offset(x, y), p.size, paint);
          final shinePaint = Paint()..color = Colors.white.withValues(alpha: 0.3);
          canvas.drawCircle(Offset(x - p.size*0.25, y - p.size*0.25), p.size * 0.25, shinePaint);
      } else if (type == VictoryEffectType.fireworks) {
           canvas.drawCircle(Offset(x, y), p.size * p.life, paint); // Shrink as they die
      } else {
          canvas.save();
          canvas.translate(x, y);
          canvas.rotate(p.rotation);
          canvas.drawRect(Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size*0.6), paint);
          canvas.restore();
      }
    }
  }
  
  @override
  bool shouldRepaint(_VictoryPainter old) => true;
}
