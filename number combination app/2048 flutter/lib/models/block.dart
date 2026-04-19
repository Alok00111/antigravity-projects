/// Block model for Block Stack 2048.
/// Represents a numbered block on the grid.
library;

import 'package:flutter/material.dart';
import 'position.dart';

/// Unique ID generator for blocks
int _nextBlockId = 0;
String _generateBlockId() => 'block_${_nextBlockId++}';

/// Reset block ID counter (useful for testing)
void resetBlockIdCounter() => _nextBlockId = 0;

/// A block with a numeric value
class Block {
  /// Unique identifier for this block
  final String id;
  
  /// Numeric value (power of 2)
  final int value;
  
  /// Current grid position (null if not placed yet)
  GridPosition? gridPosition;
  
  /// Visual offset for animations (pixels from grid position)
  Offset visualOffset;
  
  /// Scale factor for animations (1.0 = normal)
  double scale;
  
  /// Opacity for fade animations (1.0 = fully visible)
  double opacity;
  
  /// Whether this block is currently animating
  bool isAnimating;
  
  /// Whether this block is marked for removal
  bool markedForRemoval;
  
  Block({
    String? id,
    required this.value,
    this.gridPosition,
    this.visualOffset = Offset.zero,
    this.scale = 1.0,
    this.opacity = 1.0,
    this.isAnimating = false,
    this.markedForRemoval = false,
  }) : id = id ?? _generateBlockId();
  
  /// Create a copy with optional modifications
  Block copyWith({
    String? id,
    int? value,
    GridPosition? gridPosition,
    Offset? visualOffset,
    double? scale,
    double? opacity,
    bool? isAnimating,
    bool? markedForRemoval,
  }) {
    return Block(
      id: id ?? this.id,
      value: value ?? this.value,
      gridPosition: gridPosition ?? this.gridPosition,
      visualOffset: visualOffset ?? this.visualOffset,
      scale: scale ?? this.scale,
      opacity: opacity ?? this.opacity,
      isAnimating: isAnimating ?? this.isAnimating,
      markedForRemoval: markedForRemoval ?? this.markedForRemoval,
    );
  }
  
  /// Get the merged value (double the current value)
  int get mergedValue => value * 2;
  
  /// Check if this block can merge with another
  bool canMergeWith(Block other) => value == other.value;
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Block && other.id == id;
  }
  
  @override
  int get hashCode => id.hashCode;
  
  @override
  String toString() => 'Block($id, value: $value, pos: $gridPosition)';
}
