/// Grid painter for Block Stack 2048.
/// Draws the game grid background and cells.
library;

import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../core/colors.dart';

/// CustomPainter for drawing the grid background
class GridPainter extends CustomPainter {
  final int rows;
  final int columns;
  
  GridPainter({
    this.rows = kGridRows,
    this.columns = kGridColumns,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    // Draw grid background
    final backgroundPaint = Paint()
      ..color = kGridBackgroundColor
      ..style = PaintingStyle.fill;
    
    final backgroundRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(kCellBorderRadius),
    );
    canvas.drawRRect(backgroundRect, backgroundPaint);
    
    // Draw empty cells
    final cellPaint = Paint()
      ..color = kEmptyCellColor
      ..style = PaintingStyle.fill;
    
    for (int row = 0; row < rows; row++) {
      for (int col = 0; col < columns; col++) {
        final cellRect = _getCellRect(row, col);
        final rrect = RRect.fromRectAndRadius(
          cellRect,
          const Radius.circular(kCellBorderRadius - 2),
        );
        canvas.drawRRect(rrect, cellPaint);
      }
    }
  }
  
  /// Get the rectangle for a cell
  Rect _getCellRect(int row, int column) {
    final x = kCellPadding + column * (kCellSize + kCellPadding);
    final y = kCellPadding + row * (kCellSize + kCellPadding);
    return Rect.fromLTWH(x, y, kCellSize, kCellSize);
  }
  
  @override
  bool shouldRepaint(covariant GridPainter oldDelegate) {
    return oldDelegate.rows != rows || oldDelegate.columns != columns;
  }
}
