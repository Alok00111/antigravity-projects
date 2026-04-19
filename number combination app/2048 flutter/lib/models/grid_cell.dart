/// Grid cell model for Block Stack 2048.
/// Represents a single cell in the game grid.
library;

import 'block.dart';
import 'position.dart';

/// A cell in the game grid
class GridCell {
  /// Position of this cell in the grid
  final GridPosition position;
  
  /// Block occupying this cell (null if empty)
  Block? block;
  
  GridCell({
    required this.position,
    this.block,
  });
  
  /// Whether this cell is empty
  bool get isEmpty => block == null;
  
  /// Whether this cell is occupied
  bool get isOccupied => block != null;
  
  /// Clear this cell
  void clear() {
    block = null;
  }
  
  /// Place a block in this cell
  void placeBlock(Block newBlock) {
    block = newBlock;
    newBlock.gridPosition = position;
  }
  
  /// Create a copy of this cell
  GridCell copy() {
    return GridCell(
      position: position,
      block: block?.copyWith(),
    );
  }
  
  @override
  String toString() => 'GridCell(${position.row}, ${position.column}, ${block?.value ?? "empty"})';
}
