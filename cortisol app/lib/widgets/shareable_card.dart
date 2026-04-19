import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../utils/roast_generator.dart';

/// A shareable result card that can be captured as an image and shared.
class ShareableResultCard extends StatelessWidget {
  final int cortisolLevel;
  final String tier;
  final Color tierColor;
  final String roast;
  final String? expressionLabel;
  final GlobalKey repaintKey;

  const ShareableResultCard({
    super.key,
    required this.cortisolLevel,
    required this.tier,
    required this.tierColor,
    required this.roast,
    this.expressionLabel,
    required this.repaintKey,
  });

  @override
  Widget build(BuildContext context) {
    final emoji = RoastGenerator.getTierEmoji(cortisolLevel);

    return RepaintBoundary(
      key: repaintKey,
      child: Container(
        width: 380,
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // App branding
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF453A),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.psychology_alt,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Cortisol Scanner',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF000000),
                    decoration: TextDecoration.none,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Big number
            Text(
              '$cortisolLevel',
              style: TextStyle(
                fontSize: 80,
                fontWeight: FontWeight.w900,
                color: tierColor,
                height: 1.0,
                decoration: TextDecoration.none,
              ),
            ),
            const Text(
              'ng/dL',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF8E8E93),
                letterSpacing: 2,
                decoration: TextDecoration.none,
                fontWeight: FontWeight.w400,
              ),
            ),

            const SizedBox(height: 16),

            // Tier badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: tierColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                '$emoji $tier',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 1,
                  decoration: TextDecoration.none,
                ),
              ),
            ),

            if (expressionLabel != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F2F7),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFE5E5EA),
                  ),
                ),
                child: Text(
                  '"$expressionLabel"',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF3C3C43),
                    decoration: TextDecoration.none,
                    height: 1.4,
                  ),
                ),
              ),
            ],

            const SizedBox(height: 20),

            // Roast
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF2F2F7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '"$roast"',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  color: Color(0xFF3C3C43),
                  height: 1.5,
                  decoration: TextDecoration.none,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),

            const SizedBox(height: 20),

            // CTA
            const Text(
              'Scan yours → Cortisol Scanner',
              style: TextStyle(
                fontSize: 11,
                color: Color(0xFF8E8E93),
                fontWeight: FontWeight.w500,
                decoration: TextDecoration.none,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Future<void> captureAndShare({
    required GlobalKey repaintKey,
    required int cortisolLevel,
    required String tier,
    required String roast,
    String? expressionLabel,
  }) async {
    try {
      final boundary = repaintKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;
      if (boundary == null) return;

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData =
          await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/cortisol_result.png');
      await file.writeAsBytes(byteData.buffer.asUint8List());

      final emoji = RoastGenerator.getTierEmoji(cortisolLevel);
      final exprText = expressionLabel != null ? ' (Face: $expressionLabel)' : '';
      await SharePlus.instance.share(
        ShareParams(
          text:
              '$emoji My cortisol: $cortisolLevel ng/dL — $tier$exprText\n"$roast"\n\nScan yours → Cortisol Scanner 💀',
          files: [XFile(file.path)],
        ),
      );
    } catch (e) {
      debugPrint('Share failed: $e');
    }
  }
}
