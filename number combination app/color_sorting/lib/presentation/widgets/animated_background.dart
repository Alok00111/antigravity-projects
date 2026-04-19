import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/colors.dart';
import '../../core/services/theme_service.dart';
import '../../state/settings_provider.dart';
import '../../core/utils/sound_manager.dart';

/// Floating bubble particle for generic themes
class _Bubble {
  double x;
  double y;
  double size;
  double speed;
  double wobbleOffset;
  double wobbleSpeed;
  Color color;
  
  _Bubble({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
    required this.wobbleOffset,
    required this.wobbleSpeed,
    required this.color,
  });
}

/// Fire particle for Dragon theme
class _FireParticle {
  double x;
  double y;
  double vx;
  double vy;
  double size;
  double life; // 1.0 to 0.0
  double decay;
  Color startColor;
  Color endColor;
  
  _FireParticle({
    required this.x,
    required this.y,
    required this.vx,
    required this.vy,
    required this.size,
    required this.life,
    required this.decay,
    required this.startColor,
    required this.endColor,
  });
}

/// Animated background with floating bubbles or interactive elements
class AnimatedBackground extends StatefulWidget {
  final Widget child;
  
  const AnimatedBackground({
    super.key,
    required this.child,
  });
  
  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground> with TickerProviderStateMixin {
  late AnimationController _loopController;
  late AnimationController _roarController;
  
  final List<_Bubble> _bubbles = [];
  final List<_FireParticle> _fireParticles = [];
  final Random _random = Random();
  String? _lastThemeId;
  
  static const int _bubbleCount = 15;
  
  @override
  void initState() {
    super.initState();
    _loopController = AnimationController(
      duration: const Duration(seconds: 4), // Slow breathing cycle
      vsync: this,
    )..repeat(reverse: true);
    
    _roarController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }
  
  void _initBubbles(Color accentColor, Color secondaryColor) {
    _bubbles.clear();
    final colors = [
      accentColor.withValues(alpha: 0.15),
      secondaryColor.withValues(alpha: 0.1),
      Colors.white.withValues(alpha: 0.05),
    ];
    
    for (int i = 0; i < _bubbleCount; i++) {
      _bubbles.add(_Bubble(
        x: _random.nextDouble(),
        y: _random.nextDouble(),
        size: 20 + _random.nextDouble() * 60,
        speed: 0.02 + _random.nextDouble() * 0.03,
        wobbleOffset: _random.nextDouble() * pi * 2,
        wobbleSpeed: 0.5 + _random.nextDouble(),
        color: colors[_random.nextInt(colors.length)],
      ));
    }
  }
  
  void _triggerDragonRoar(Size screenSize) {
    if (_roarController.isAnimating) return;
    
    _roarController.forward(from: 0.0).then((_) => _roarController.reverse());
    
    // Haptics
    SoundManager().triggerHaptic(HapticType.heavy);
    
    // Spawn stream of fire from mouth
    // Assuming dragon is bottom-right, faced left (flipped)
    // Mouth approx at:
    final mouthX = screenSize.width * 0.35; // Moved closer to center (Dragon's mouth)
    final mouthY = screenSize.height * 0.65; // Slightly higher
    
    for (int i = 0; i < 60; i++) {
      final angle = pi + (pi / 6) * (_random.nextDouble() - 0.5); // Shoot Left +/- 30 deg
      final speed = 3.0 + _random.nextDouble() * 4.0;
      
      _fireParticles.add(_FireParticle(
        x: mouthX,
        y: mouthY,
        vx: cos(angle) * speed, 
        vy: sin(angle) * speed - 1.0, // Slight upward drift
        size: 15 + _random.nextDouble() * 25,
        life: 1.0,
        decay: 0.015 + _random.nextDouble() * 0.02,
        startColor: Colors.amberAccent,
        endColor: Colors.red.shade900,
      ));
    }
  }
  
  @override
  void dispose() {
    _loopController.dispose();
    _roarController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settings, _) {
        final theme = ThemeService.getActiveTheme(settings);
        final isDragonTheme = theme.id == 'dragon';
        
        // Reinitialize bubbles if theme changed
        if (_lastThemeId != settings.activeThemeId) {
          _lastThemeId = settings.activeThemeId;
          if (!isDragonTheme) {
            _initBubbles(theme.accentColor, theme.secondaryColor);
          } else {
            _bubbles.clear();
          }
        }
        
        if (_bubbles.isEmpty && !isDragonTheme) {
          _initBubbles(theme.accentColor, theme.secondaryColor);
        }
        
        return LayoutBuilder(
          builder: (context, constraints) {
            final size = Size(constraints.maxWidth, constraints.maxHeight);
            
            return Container(
              decoration: BoxDecoration(
                gradient: theme.backgroundGradient,
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // 1. Background Image (Interactive)
                  if (theme.backgroundImageAsset != null)
                    Positioned.fill(
                      child: AnimatedBuilder(
                        animation: Listenable.merge([_loopController, _roarController]),
                        builder: (context, child) {
                           // Subtle breathing zoom
                           final scale = 1.0 + sin(_loopController.value * pi * 2) * 0.02;
                           // Roar zoom punch
                           final roar = _roarController.value * 0.05;
                           
                           return Transform.scale(
                             scale: scale + roar,
                             child: GestureDetector(
                               onTap: () => _triggerDragonRoar(size),
                               child: Image.asset(
                                 theme.backgroundImageAsset!,
                                 fit: BoxFit.cover,
                               ),
                             ),
                           );
                        },
                      ),
                    ),

                  // 2. Designer Overlay (Darken)
                  if (theme.backgroundImageAsset != null)
                    Positioned.fill(
                      child: IgnorePointer( // Allow taps to pass to background
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.3),
                                Colors.transparent,
                                Colors.black.withValues(alpha: 0.8),
                              ],
                              stops: const [0.0, 0.4, 1.0],
                            ),
                          ),
                        ),
                      ),
                    ),

                  // 3. Fire Particles Layer (On top of Background)
                  if (isDragonTheme)
                    Positioned.fill(
                      child: IgnorePointer(
                        child: AnimatedBuilder(
                          animation: _loopController, 
                          builder: (context, child) {
                             return CustomPaint(
                              painter: _FirePainter(
                                particles: _fireParticles,
                              ),
                            );
                          }
                        ),
                      ),
                    )
                  else
                  // Bubbles for non-dragon themes
                    Positioned.fill(
                      child: AnimatedBuilder(
                        animation: _loopController,
                        builder: (context, child) {
                          return CustomPaint(
                            painter: _BubblePainter(
                              bubbles: _bubbles,
                              time: DateTime.now().millisecondsSinceEpoch / 1000,
                            ),
                          );
                        }
                      ),
                    ),
                  
                  // 5. Old Gradient Overlay compat
                  if (theme.backgroundImageAsset == null)
                     Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: RadialGradient(
                            center: Alignment.topRight,
                            radius: 1.5,
                            colors: [
                              theme.accentColor.withValues(alpha: 0.08),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),

                  // 6. Main Game Content
                  widget.child,
                ],
              ),
            );
          }
        );
      },
    );
  }
}

class _BubblePainter extends CustomPainter {
  final List<_Bubble> bubbles;
  final double time;
  
  _BubblePainter({required this.bubbles, required this.time});
  
  @override
  void paint(Canvas canvas, Size size) {
    for (final bubble in bubbles) {
      final wobble = sin(time * bubble.wobbleSpeed + bubble.wobbleOffset) * 20;
      final yOffset = (time * bubble.speed) % 1.3;
      
      var y = (bubble.y - yOffset) * size.height;
      if (y < -bubble.size) {
        y += size.height + bubble.size * 2;
      }
      
      final x = bubble.x * size.width + wobble;
      
      final paint = Paint()
        ..color = bubble.color
        ..style = PaintingStyle.fill;
      
      canvas.drawCircle(Offset(x, y), bubble.size / 2, paint);
    }
  }
  
  @override
  bool shouldRepaint(_BubblePainter oldDelegate) => true;
}

class _FirePainter extends CustomPainter {
  final List<_FireParticle> particles;
  
  _FirePainter({required this.particles});
  
  @override
  void paint(Canvas canvas, Size size) {
    for (int i = particles.length - 1; i >= 0; i--) {
      final p = particles[i];
      
      // Update
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.size += 0.5; // Fire expands
      
      // Remove dead
      if (p.life <= 0) {
        particles.removeAt(i);
        continue;
      }
      
      // Draw
      final paint = Paint()
        ..color = Color.lerp(p.endColor, p.startColor, p.life * p.life)! // *life to bias red
            .withValues(alpha: p.life * 0.8)
        ..style = PaintingStyle.fill
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8); // Heavy glow
        
      canvas.drawCircle(Offset(p.x, p.y), p.size, paint);
    }
  }
  
  @override
  bool shouldRepaint(_FirePainter oldDelegate) => true;
}
