/// Math utilities for Block Stack 2048.
/// Position calculations and math helpers.
library;

import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../models/position.dart';

/// Calculate the pixel X position for a column
double columnToX(int column) {
  return kCellPadding + column * (kCellSize + kCellPadding) + kCellSize / 2;
}

/// Calculate the pixel Y position for a row
double rowToY(int row) {
  return kCellPadding + row * (kCellSize + kCellPadding) + kCellSize / 2;
}

/// Calculate column from pixel X position
int xToColumn(double x, double gridWidth) {
  final cellWidth = gridWidth / kGridColumns;
  return (x / cellWidth).floor().clamp(0, kGridColumns - 1);
}

/// Get the top-left corner of a cell in pixels
Offset cellTopLeft(int row, int column) {
  return Offset(
    kCellPadding + column * (kCellSize + kCellPadding),
    kCellPadding + row * (kCellSize + kCellPadding),
  );
}

/// Get the center of a cell in pixels
Offset cellCenter(int row, int column) {
  return Offset(
    columnToX(column),
    rowToY(row),
  );
}

/// Get the center of a cell from GridPosition
Offset cellCenterFromPosition(GridPosition position) {
  return cellCenter(position.row, position.column);
}

/// Calculate cell rect for a given row and column
Rect cellRect(int row, int column) {
  final topLeft = cellTopLeft(row, column);
  return Rect.fromLTWH(topLeft.dx, topLeft.dy, kCellSize, kCellSize);
}

/// Interpolate between two values
double lerp(double a, double b, double t) {
  return a + (b - a) * t;
}

/// Clamp a value between min and max
double clampDouble(double value, double min, double max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/// Calculate spawn area Y position (center)
double getSpawnY() {
  return kGridHeight + kSpawnAreaHeight / 2;
}

/// Get the bottom Y position where shooting starts
double getShootStartY() {
  return kGridHeight + kSpawnAreaHeight * 0.7;
}
