/// Block painter for Block Stack 2048.
/// Draws blocks with smooth animations.
library;

import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../core/colors.dart';
import '../models/block.dart';
import '../utils/math_utils.dart';

/// CustomPainter for drawing blocks with animations
class BlockPainter extends CustomPainter {
  /// List of blocks to draw
  final List<Block> blocks;
  
  /// Active block being dragged (drawn separately)
  final Block? activeBlock;
  
  /// Current column for active block
  final int activeColumn;
  
  /// Animation progress for shooting (0.0 to 1.0)
  final double shootProgress;
  
  /// Target row for shooting block
  final int targetRow;
  
  /// Whether the block is currently shooting
  final bool isShooting;
  
  /// Blocks currently being merged (drawn separately)
  final List<Block> mergingBlocks;
  
  /// Merge animation progress (0.0 to 1.0)
  final double mergeProgress;
  
  /// Newly merged block ID (for special glow effect)
  final String? newMergedBlockId;
  
  /// Active theme ID for block colors
  final String themeId;
  
  BlockPainter({
    required this.blocks,
    this.activeBlock,
    this.activeColumn = 2,
    this.shootProgress = 0.0,
    this.targetRow = -1,
    this.isShooting = false,
    this.mergingBlocks = const [],
    this.mergeProgress = 0.0,
    this.newMergedBlockId,
    this.themeId = 'classic',
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    // Draw all placed blocks
    for (final block in blocks) {
      if (block.gridPosition != null) {
        final isNewMerged = block.id == newMergedBlockId;
        _drawBlock(
          canvas, 
          block, 
          block.gridPosition!.row, 
          block.gridPosition!.column,
          isNewMerged: isNewMerged,
        );
      }
    }
    
    // Draw merging blocks (ghosts) if animating
    if (mergingBlocks.isNotEmpty && mergeProgress < 1.0) {
      for (final block in mergingBlocks) {
        if (block.gridPosition != null) {
          _drawBlock(
            canvas, 
            block, 
            block.gridPosition!.row, 
            block.gridPosition!.column,
            isMerging: true,
          );
        }
      }
    }
    
    // Draw active block (being dragged or shooting)
    if (activeBlock != null) {
      _drawActiveBlock(canvas, size);
    }
  }
  
  /// Draw a block at a grid position
  void _drawBlock(
    Canvas canvas, 
    Block block, 
    int row, 
    int column, {
    double scale = 1.0, 
    double opacity = 1.0,
    bool isMerging = false,
    bool isNewMerged = false,
  }) {
    final center = cellCenter(row, column);
    
    // Calculate scale for merge animation
    double adjustedScale = scale;
    if (isNewMerged && mergeProgress > 0) {
      // Pop effect for newly merged block
      adjustedScale = _calculateMergeScale(mergeProgress);
    } else if (isMerging) {
      // Shrink effect for blocks being merged
      adjustedScale = 1.0 - (mergeProgress * 0.3);
      opacity = 1.0 - mergeProgress;
    }
    
    final halfSize = (kCellSize / 2) * adjustedScale;
    final rect = Rect.fromCenter(
      center: center,
      width: halfSize * 2,
      height: halfSize * 2,
    );
    
    // Draw glow effect for newly merged block
    if (isNewMerged && mergeProgress > 0.3) {
      _drawGlow(canvas, center, halfSize * 1.3, block.value);
    }
    
    // Draw block background
    final baseColor = getBlockColor(block.value, themeId: themeId);
    final blockPaint = Paint()
      ..color = baseColor.withValues(alpha: opacity)
      ..style = PaintingStyle.fill;
    
    final rrect = RRect.fromRectAndRadius(
      rect,
      Radius.circular((kCellBorderRadius - 2) * adjustedScale),
    );
    canvas.drawRRect(rrect, blockPaint);
    
    // Draw block value text
    if (opacity > 0.3) {
      _drawBlockText(canvas, block.value, center, adjustedScale, opacity);
    }
  }
  
  /// Calculate scale during merge animation (shrink -> expand -> settle)
  double _calculateMergeScale(double progress) {
    if (progress < 0.2) {
      // Shrink phase
      return 1.0 - (progress / 0.2) * 0.1;
    } else if (progress < 0.6) {
      // Expand phase
      final expandProgress = (progress - 0.2) / 0.4;
      return 0.9 + expandProgress * 0.35; // 0.9 -> 1.25
    } else {
      // Settle phase
      final settleProgress = (progress - 0.6) / 0.4;
      return 1.25 - settleProgress * 0.25; // 1.25 -> 1.0
    }
  }
  
  /// Draw glow effect around merged block
  void _drawGlow(Canvas canvas, Offset center, double radius, int value) {
    final glowColor = getBlockColor(value, themeId: themeId);
    final glowPaint = Paint()
      ..color = glowColor.withValues(alpha: 0.3)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);
    
    canvas.drawCircle(center, radius, glowPaint);
  }
  
  /// Draw the active block (in spawn area or shooting)
  void _drawActiveBlock(Canvas canvas, Size size) {
    if (activeBlock == null) return;
    
    final centerX = columnToX(activeColumn);
    double centerY;
    double scale = 1.0;
    double trailOpacity = 0.0;
    
    if (isShooting && targetRow >= 0) {
      // Smooth interpolation from spawn area to target position
      final startY = getShootStartY();
      final endY = rowToY(targetRow);
      
      // Use eased progress for smoother motion
      final easedProgress = _easeOutCubic(shootProgress);
      centerY = startY + (endY - startY) * easedProgress;
      
      // Scale effect during shooting (slight stretch in direction of movement)
      scale = 1.0 + (0.08 * math.sin(shootProgress * math.pi));
      
      // Trail effect opacity
      trailOpacity = (1.0 - shootProgress) * 0.4;
    } else {
      // In spawn area - gentle floating animation
      centerY = getSpawnY();
    }
    
    // Draw motion trail when shooting
    if (isShooting && trailOpacity > 0.1) {
      _drawTrail(canvas, centerX, centerY, trailOpacity);
    }
    
    final halfSize = (kCellSize / 2) * scale;
    final rect = Rect.fromCenter(
      center: Offset(centerX, centerY),
      width: halfSize * 2,
      height: halfSize * 2,
    );
    
    // Draw shadow first
    final shadowPaint = Paint()
      ..color = kBlackShadow
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    final shadowRect = rect.shift(const Offset(3, 3));
    final shadowRrect = RRect.fromRectAndRadius(
      shadowRect,
      Radius.circular((kCellBorderRadius - 2) * scale),
    );
    canvas.drawRRect(shadowRrect, shadowPaint);
    
    // Draw block background
    final blockPaint = Paint()
      ..color = getBlockColor(activeBlock!.value, themeId: themeId)
      ..style = PaintingStyle.fill;
    
    final rrect = RRect.fromRectAndRadius(
      rect,
      Radius.circular((kCellBorderRadius - 2) * scale),
    );
    canvas.drawRRect(rrect, blockPaint);
    
    // Draw block value text
    _drawBlockText(canvas, activeBlock!.value, Offset(centerX, centerY), scale, 1.0);
  }
  
  /// Draw motion trail behind shooting block
  void _drawTrail(Canvas canvas, double x, double y, double opacity) {
    final trailPaint = Paint()
      ..color = getBlockColor(activeBlock!.value, themeId: themeId).withValues(alpha: opacity * 0.5)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
    
    // Draw multiple trail segments
    for (int i = 1; i <= 3; i++) {
      final trailY = y + (i * 15);
      final trailScale = 1.0 - (i * 0.15);
      final trailAlpha = opacity * (1.0 - i * 0.3);
      
      if (trailAlpha > 0.05) {
        final trailRect = Rect.fromCenter(
          center: Offset(x, trailY),
          width: kCellSize * trailScale,
          height: kCellSize * trailScale * 0.6,
        );
        trailPaint.color = getBlockColor(activeBlock!.value, themeId: themeId).withValues(alpha: trailAlpha);
        canvas.drawOval(trailRect, trailPaint);
      }
    }
  }
  
  /// Ease out cubic function for smooth deceleration
  double _easeOutCubic(double t) {
    return 1.0 - math.pow(1.0 - t, 3).toDouble();
  }
  
  /// Draw the number text on a block
  void _drawBlockText(Canvas canvas, int value, Offset center, double scale, double opacity) {
    final text = value.toString();
    
    // Determine font size based on number of digits
    double fontSize;
    if (text.length <= 2) {
      fontSize = kBlockFontSizeLarge;
    } else if (text.length == 3) {
      fontSize = kBlockFontSizeMedium;
    } else {
      fontSize = kBlockFontSizeSmall;
    }
    
    fontSize *= scale;
    
    final textColor = getBlockTextColor(value, themeId: themeId).withValues(alpha: opacity);
    
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: textColor,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          fontFamily: 'Roboto',
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    
    textPainter.layout();
    
    final textOffset = Offset(
      center.dx - textPainter.width / 2,
      center.dy - textPainter.height / 2,
    );
    
    textPainter.paint(canvas, textOffset);
  }
  
  @override
  bool shouldRepaint(covariant BlockPainter oldDelegate) {
    return oldDelegate.blocks != blocks ||
           oldDelegate.activeBlock != activeBlock ||
           oldDelegate.activeColumn != activeColumn ||
           oldDelegate.shootProgress != shootProgress ||
           oldDelegate.isShooting != isShooting ||
           oldDelegate.mergeProgress != mergeProgress ||
           oldDelegate.mergingBlocks != mergingBlocks ||
           oldDelegate.newMergedBlockId != newMergedBlockId ||
           oldDelegate.themeId != themeId;
  }
}
