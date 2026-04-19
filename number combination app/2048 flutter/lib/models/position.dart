/// Grid position model for Block Stack 2048.
/// Represents a cell location in the grid.
library;

/// Immutable position in the grid
class GridPosition {
  final int row;
  final int column;
  
  const GridPosition(this.row, this.column);
  
  /// Create position from row and column
  factory GridPosition.fromRowColumn(int row, int column) {
    return GridPosition(row, column);
  }
  
  /// Copy with optional modifications
  GridPosition copyWith({int? row, int? column}) {
    return GridPosition(
      row ?? this.row,
      column ?? this.column,
    );
  }
  
  /// Move up one row
  GridPosition get up => GridPosition(row - 1, column);
  
  /// Move down one row
  GridPosition get down => GridPosition(row + 1, column);
  
  /// Move left one column
  GridPosition get left => GridPosition(row, column - 1);
  
  /// Move right one column
  GridPosition get right => GridPosition(row, column + 1);
  
  /// Get all 4 neighbors (up, down, left, right)
  List<GridPosition> get neighbors => [up, down, left, right];
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is GridPosition && 
           other.row == row && 
           other.column == column;
  }
  
  @override
  int get hashCode => row.hashCode ^ column.hashCode;
  
  @override
  String toString() => 'GridPosition($row, $column)';
}
