/// Grid manager for Block Stack 2048.
/// Handles grid operations and cell queries.
library;

import '../core/constants.dart';
import '../models/block.dart';
import '../models/grid_cell.dart';
import '../models/position.dart';

/// Manages the game grid
class GridManager {
  /// 2D array of grid cells [row][column]
  late List<List<GridCell>> _grid;
  
  /// Number of rows in the grid
  final int rows;
  
  /// Number of columns in the grid
  final int columns;
  
  GridManager({
    this.rows = kGridRows,
    this.columns = kGridColumns,
  }) {
    _initializeGrid();
  }
  
  /// Initialize empty grid
  void _initializeGrid() {
    _grid = List.generate(
      rows,
      (row) => List.generate(
        columns,
        (column) => GridCell(position: GridPosition(row, column)),
      ),
    );
  }
  
  /// Clear the entire grid
  void clear() {
    for (var row in _grid) {
      for (var cell in row) {
        cell.clear();
      }
    }
  }
  
  /// Get cell at position (returns null if out of bounds)
  GridCell? getCell(GridPosition position) {
    if (!isValidPosition(position)) return null;
    return _grid[position.row][position.column];
  }
  
  /// Get cell at row and column (returns null if out of bounds)
  GridCell? getCellAt(int row, int column) {
    return getCell(GridPosition(row, column));
  }
  
  /// Check if position is within grid bounds
  bool isValidPosition(GridPosition position) {
    return position.row >= 0 && 
           position.row < rows &&
           position.column >= 0 && 
           position.column < columns;
  }
  
  /// Check if cell at position is empty
  bool isCellEmpty(GridPosition position) {
    final cell = getCell(position);
    return cell?.isEmpty ?? false;
  }
  
  /// Get the topmost empty row in a column (where a block would land)
  /// Returns -1 if column is full
  int getTopEmptyRow(int column) {
    // Find the first empty row from top (row 0), blocks stack from top downward
    // If row 0 is occupied, check row 1, etc.
    for (int row = 0; row < rows; row++) {
      if (_grid[row][column].isEmpty) {
        return row;
      }
    }
    return -1; // Column is full
  }
  
  /// Check if a column is full
  bool isColumnFull(int column) {
    return getTopEmptyRow(column) == -1;
  }
  
  /// Check if the entire grid is full (game over condition)
  bool isGridFull() {
    for (int col = 0; col < columns; col++) {
      if (!isColumnFull(col)) return false;
    }
    return true;
  }
  
  /// Place a block in the grid at its current position
  bool placeBlock(Block block) {
    if (block.gridPosition == null) return false;
    
    final cell = getCell(block.gridPosition!);
    if (cell == null || !cell.isEmpty) return false;
    
    cell.placeBlock(block);
    return true;
  }
  
  /// Place a block at a specific position
  bool placeBlockAt(Block block, GridPosition position) {
    block.gridPosition = position;
    return placeBlock(block);
  }
  
  /// Remove a block from the grid
  void removeBlock(GridPosition position) {
    final cell = getCell(position);
    cell?.clear();
  }
  
  /// Remove multiple blocks from the grid
  void removeBlocks(Set<GridPosition> positions) {
    for (final position in positions) {
      removeBlock(position);
    }
  }
  
  /// Get all blocks currently in the grid
  List<Block> getAllBlocks() {
    final blocks = <Block>[];
    for (var row in _grid) {
      for (var cell in row) {
        if (cell.block != null) {
          blocks.add(cell.block!);
        }
      }
    }
    return blocks;
  }
  
  /// Get block at position
  Block? getBlockAt(GridPosition position) {
    return getCell(position)?.block;
  }
  
  /// Get all valid neighbors of a position
  List<GridPosition> getValidNeighbors(GridPosition position) {
    return position.neighbors
        .where((p) => isValidPosition(p))
        .toList();
  }
  
  /// Check if any column has space for a new block
  bool hasAvailableColumn() {
    for (int col = 0; col < columns; col++) {
      if (!isColumnFull(col)) return true;
    }
    return false;
  }
  
  /// Get a copy of the grid for rendering
  List<List<GridCell>> get grid => _grid;
  
  @override
  String toString() {
    final buffer = StringBuffer();
    for (int row = 0; row < rows; row++) {
      for (int col = 0; col < columns; col++) {
        final block = _grid[row][col].block;
        if (block != null) {
          buffer.write(block.value.toString().padLeft(5));
        } else {
          buffer.write('    .');
        }
      }
      buffer.writeln();
    }
    return buffer.toString();
  }
}
