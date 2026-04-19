import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Painter that draws a realistic liquid pouring curve using Bezier paths
class LiquidPourStream extends StatelessWidget {
  final Color liquidColor;
  final Offset sourceStartPoint; // The lip of the source tube
  final Offset targetTopPoint;   // The opening of the target tube
  final double pourProgress;
  final double tiltAngle;        // Current tilt angle of source (radians)
  
  const LiquidPourStream({
    super.key,
    required this.liquidColor,
    required this.sourceStartPoint,
    required this.targetTopPoint,
    required this.pourProgress,
    required this.tiltAngle,
  });
  
  @override
  Widget build(BuildContext context) {
    // Show stream during the pour phase (0.40 to 0.90)
    if (pourProgress < 0.38 || pourProgress > 0.92) {
      return const SizedBox.shrink();
    }
    
    // Smooth Fade In/Out
    double opacity = 1.0;
    // Fade in quickly at start of pour (0.40 - 0.45)
    if (pourProgress < 0.45) {
      opacity = (pourProgress - 0.38) / 0.07;
    } 
    // Fade out at end (0.85 - 0.90)
    else if (pourProgress > 0.85) {
      opacity = 1.0 - ((pourProgress - 0.85) / 0.07);
    }
    opacity = opacity.clamp(0.0, 0.95);
    
    // Pulsate width slightly (15Hz)
    final pulse = math.sin(pourProgress * 100) * 0.5;
    final width = 12.0 + pulse;
    
    // Wobble Effect (Slight lateral oscillation)
    // Increases slightly near the end (0.7-0.8) to simulate flow breaking
    double wobbleAmount = 2.0;
    if (pourProgress > 0.70) {
      wobbleAmount += (pourProgress - 0.70) * 30.0; // Grows up to 5.0
    }
    final wobble = math.sin(pourProgress * 80) * wobbleAmount;
    
    return CustomPaint(
      size: Size.infinite,
      painter: _BezierStreamPainter(
        liquidColor: liquidColor,
        p1: sourceStartPoint,
        p2: targetTopPoint,
        opacity: opacity,
        width: width,
        angle: tiltAngle,
        wobbleOffset: wobble,
      ),
    );
  }
}

class _BezierStreamPainter extends CustomPainter {
  final Color liquidColor;
  final Offset p1; // Source
  final Offset p2; // Target
  final double opacity;
  final double width;
  final double angle;
  final double wobbleOffset;
  
  _BezierStreamPainter({
    required this.liquidColor,
    required this.p1,
    required this.p2,
    required this.opacity,
    required this.width,
    required this.angle,
    required this.wobbleOffset,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    if (opacity <= 0) return;
    
    // Target endpoint
    final targetPoint = Offset(p2.dx, p2.dy + 20.0);
    
    // Control Point Calculation
    final exitDir = Offset(math.sin(angle), math.cos(angle));
    
    final distY = (targetPoint.dy - p1.dy).abs();
    final controlDist = distY * 0.5;
    
    // Apply wobble to the control point X
    final controlPoint = p1 + exitDir * controlDist + Offset(wobbleOffset, 0);
    
    // Path Construction
    final path = Path();
    
    final paint = Paint()
      ..color = liquidColor.withValues(alpha: opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = width
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
      
    // Create the curve
    path.moveTo(p1.dx, p1.dy);
    path.quadraticBezierTo(
      controlPoint.dx, controlPoint.dy,
      targetPoint.dx, targetPoint.dy
    );
    
    canvas.drawPath(path, paint);
    
    // Add Highlight
    final highlightPaint = Paint()
      ..color = Colors.white.withValues(alpha: opacity * 0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = width * 0.3
      ..strokeCap = StrokeCap.round;
      
    canvas.drawPath(path, highlightPaint);
  }
  
  @override
  bool shouldRepaint(covariant _BezierStreamPainter oldDelegate) {
    return oldDelegate.opacity != opacity ||
           oldDelegate.p1 != p1 ||
           oldDelegate.p2 != p2 ||
           oldDelegate.angle != angle ||
           oldDelegate.width != width ||
           oldDelegate.wobbleOffset != wobbleOffset;
  }
}
