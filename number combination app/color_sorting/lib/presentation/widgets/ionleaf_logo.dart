import 'dart:math' as math;
import 'package:flutter/material.dart';

class IonleafLogo extends StatefulWidget {
  final double size;
  final AnimationController controller;

  const IonleafLogo({
    super.key,
    required this.size,
    required this.controller,
  });

  @override
  State<IonleafLogo> createState() => _IonleafLogoState();
}

class _IonleafLogoState extends State<IonleafLogo> {
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _IonleafPainter(
            progress: widget.controller.value,
          ),
        );
      },
    );
  }
}

class _IonleafPainter extends CustomPainter {
  final double progress;

  _IonleafPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Phases:
    // 0.0 - 0.4: Particles Converge
    // 0.4 - 0.7: Leaf Formation & Orbitals Spin Up
    // 0.7 - 1.0: Pulse & Stable Glow

    // Colors
    final leafColor = const Color(0xFF00E676); // Neon Green
    final coreColor = const Color(0xFF69F0AE); // Light Green
    final electronColor = const Color(0xFFB9F6CA); // Pale Green

    final paint = Paint()..style = PaintingStyle.fill;

    // 1. Leaf / Core Formation
    if (progress > 0.2) {
      double leafOpacity = ((progress - 0.2) / 0.3).clamp(0.0, 1.0);
      double scale = Curves.elasticOut.transform(leafOpacity);
      
      paint.color = leafColor.withValues(alpha: leafOpacity);
      
      // Draw stylized leaf shape (simplified as two arcs)
      final leafPath = Path();
      final leafSize = radius * 0.6 * scale;
      
      // Leaf shape logic
      leafPath.moveTo(center.dx, center.dy - leafSize);
      leafPath.quadraticBezierTo(
        center.dx + leafSize, center.dy, 
        center.dx, center.dy + leafSize
      );
      leafPath.quadraticBezierTo(
        center.dx - leafSize, center.dy, 
        center.dx, center.dy - leafSize
      );
      
      // Rotate leaf slightly
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.rotate(math.pi / 6); // 30 degrees
      canvas.translate(-center.dx, -center.dy);
      
      // Draw Glow
      final glowPaint = Paint()
        ..color = resultColor(progress)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20);
      canvas.drawPath(leafPath, glowPaint);
      
      // Draw Leaf
      canvas.drawPath(leafPath, paint);
      
      // Draw Vein
      paint.color = Colors.white.withValues(alpha: 0.5 * leafOpacity);
      paint.strokeWidth = 3 * scale;
      paint.style = PaintingStyle.stroke;
      canvas.drawLine(
        Offset(center.dx, center.dy - leafSize * 0.8),
        Offset(center.dx, center.dy + leafSize * 0.8),
        paint,
      );
      
      canvas.restore();
    }

    // 2. Orbital Rings / Electrons
    if (progress > 0.0) {
      // Particles converging
      if (progress < 0.4) {
        // Scattering in
        final particleCount = 8;
        final spread = radius * 2 * (1.0 - (progress / 0.4));
        
        paint.style = PaintingStyle.fill;
        paint.color = electronColor;
        
        for (int i = 0; i < particleCount; i++) {
          final angle = (i * 2 * math.pi / particleCount) + (progress * 5);
          final r = radius * 0.5 + spread;
          final x = center.dx + r * math.cos(angle);
          final y = center.dy + r * math.sin(angle);
          
          canvas.drawCircle(Offset(x, y), 4, paint);
        }
      } else {
        // Orbiting
        final orbitProgress = (progress - 0.4) / 0.6;
        final rotation = orbitProgress * 4 * math.pi; // 2 spins
        
        paint.style = PaintingStyle.stroke;
        paint.strokeWidth = 2;
        paint.color = electronColor.withValues(alpha: 0.5);
        
        // Ring 1
        canvas.save();
        canvas.translate(center.dx, center.dy);
        canvas.rotate(rotation);
        canvas.drawOval(
          Rect.fromCenter(center: Offset.zero, width: radius * 2.2, height: radius * 0.8),
          paint
        );
        
        // Electron 1
        paint.style = PaintingStyle.fill;
        paint.color = electronColor;
        final e1X = (radius * 1.1) * math.cos(0);
        final e1Y = (radius * 0.4) * math.sin(0);
        canvas.drawCircle(Offset(e1X, e1Y), 5, paint);
        canvas.restore();
        
        // Ring 2 (Offset)
        canvas.save();
        canvas.translate(center.dx, center.dy);
        canvas.rotate(-rotation + math.pi / 3);
        paint.style = PaintingStyle.stroke;
        paint.color = electronColor.withValues(alpha: 0.5);
         canvas.drawOval(
          Rect.fromCenter(center: Offset.zero, width: radius * 2.2, height: radius * 0.8),
          paint
        );
        
        // Electron 2
        paint.style = PaintingStyle.fill;
        paint.color = electronColor;
         final e2X = (radius * 1.1) * math.cos(math.pi);
        final e2Y = (radius * 0.4) * math.sin(math.pi);
        canvas.drawCircle(Offset(e2X, e2Y), 5, paint);
        
        canvas.restore();
      }
    }
  }
  
  Color resultColor(double progress) {
     if (progress > 0.8) {
       // Pulse
       final pulse = math.sin((progress - 0.8) * 10 * math.pi); // Fast pulse
       return const Color(0xFF00E676).withValues(alpha: 0.4 + (pulse * 0.2));
     }
     return const Color(0xFF00E676).withValues(alpha: 0.4);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
