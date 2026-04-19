import 'dart:math';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

/// Draws a targeting overlay around detected faces with
/// corner brackets, data readouts, and face contour tracing.
class FaceScanPainter extends CustomPainter {
  final List<Face> faces;
  final Size imageSize;
  final Size widgetSize;
  final double progress;
  final bool isFrontCamera;

  FaceScanPainter({
    required this.faces,
    required this.imageSize,
    required this.widgetSize,
    required this.progress,
    this.isFrontCamera = true,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (final face in faces) {
      final rect = _scaleRect(face.boundingBox);

      final expandedRect = Rect.fromCenter(
        center: rect.center,
        width: rect.width * 1.4,
        height: rect.height * 1.5,
      );

      _drawCornerBrackets(canvas, expandedRect);
      _drawDataReadouts(canvas, expandedRect, face);
      _drawFaceContours(canvas, face);
    }
  }

  Rect _scaleRect(Rect rect) {
    final scaleX = widgetSize.width / imageSize.height;
    final scaleY = widgetSize.height / imageSize.width;

    double left, top, right, bottom;

    if (isFrontCamera) {
      left = widgetSize.width - rect.right * scaleX;
      right = widgetSize.width - rect.left * scaleX;
    } else {
      left = rect.left * scaleX;
      right = rect.right * scaleX;
    }

    top = rect.top * scaleY;
    bottom = rect.bottom * scaleY;

    return Rect.fromLTRB(left, top, right, bottom);
  }

  Offset _scalePoint(Point<int> point) {
    final scaleX = widgetSize.width / imageSize.height;
    final scaleY = widgetSize.height / imageSize.width;

    double x;
    if (isFrontCamera) {
      x = widgetSize.width - point.x * scaleX;
    } else {
      x = point.x * scaleX;
    }
    final y = point.y * scaleY;

    return Offset(x, y);
  }

  void _drawCornerBrackets(Canvas canvas, Rect rect) {
    final paint = Paint()
      ..color = const Color(0xFFFF453A).withValues(alpha: 0.9)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    const cornerLength = 20.0;

    // Top-left
    canvas.drawLine(
        rect.topLeft, rect.topLeft + const Offset(cornerLength, 0), paint);
    canvas.drawLine(
        rect.topLeft, rect.topLeft + const Offset(0, cornerLength), paint);

    // Top-right
    canvas.drawLine(
        rect.topRight, rect.topRight + const Offset(-cornerLength, 0), paint);
    canvas.drawLine(
        rect.topRight, rect.topRight + const Offset(0, cornerLength), paint);

    // Bottom-left
    canvas.drawLine(rect.bottomLeft,
        rect.bottomLeft + const Offset(cornerLength, 0), paint);
    canvas.drawLine(rect.bottomLeft,
        rect.bottomLeft + const Offset(0, -cornerLength), paint);

    // Bottom-right
    canvas.drawLine(rect.bottomRight,
        rect.bottomRight + const Offset(-cornerLength, 0), paint);
    canvas.drawLine(rect.bottomRight,
        rect.bottomRight + const Offset(0, -cornerLength), paint);

    // Subtle border
    final borderPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.15)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    canvas.drawRect(rect, borderPaint);
  }

  void _drawDataReadouts(Canvas canvas, Rect rect, Face face) {
    final textPainter = TextPainter(
      textDirection: ui.TextDirection.ltr,
    );

    final readings = <String>[
      'FACE_ID: ${face.trackingId ?? "N/A"}',
      'HEAD_Y: ${face.headEulerAngleY?.toStringAsFixed(1) ?? "-"}°',
      'HEAD_Z: ${face.headEulerAngleZ?.toStringAsFixed(1) ?? "-"}°',
      if (face.smilingProbability != null)
        'SMILE: ${(face.smilingProbability! * 100).toStringAsFixed(0)}%',
      'STRESS_MAP: ${(progress * 100).toInt()}%',
    ];

    for (int i = 0; i < readings.length; i++) {
      textPainter.text = TextSpan(
        text: readings[i],
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.8),
          fontSize: 9,
          fontFamily: 'monospace',
          fontWeight: FontWeight.w500,
        ),
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(rect.right + 8, rect.top + i * 14),
      );
    }
  }

  void _drawFaceContours(Canvas canvas, Face face) {
    final paint = Paint()
      ..color = const Color(0xFFFF453A).withValues(alpha: 0.5 * progress)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    for (final contourType in FaceContourType.values) {
      final contour = face.contours[contourType];
      if (contour == null) continue;

      final points = contour.points.map(_scalePoint).toList();
      if (points.length < 2) continue;

      final path = Path()..moveTo(points.first.dx, points.first.dy);
      for (int i = 1; i < points.length; i++) {
        path.lineTo(points[i].dx, points[i].dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant FaceScanPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.faces != faces;
}
