/// Cluster detector for Block Stack 2048.
/// Detects straight-line groups of same-value blocks (horizontal or vertical only).
library;

import '../models/position.dart';
import 'grid_manager.dart';

/// Result of cluster detection
class ClusterResult {
  /// All positions in the cluster
  final Set<GridPosition> positions;
  
  /// The value of blocks in this cluster
  final int value;
  
  ClusterResult({
    required this.positions,
    required this.value,
  });
  
  /// Size of the cluster
  int get size => positions.length;
  
  /// Whether this cluster is large enough to merge (need at least 2)
  bool get canMerge => size >= 2;
  
  @override
  String toString() => 'Cluster(value: $value, size: $size)';
}

/// Detects straight-line clusters of same-value blocks
/// Only merges blocks that are in a continuous horizontal OR vertical line
class ClusterDetector {
  final GridManager _gridManager;
  
  ClusterDetector(this._gridManager);
  
  /// Detect the best line cluster starting from a given position
  /// Returns the longest horizontal or vertical line containing this position
  ClusterResult? detectCluster(GridPosition start) {
    final startBlock = _gridManager.getBlockAt(start);
    if (startBlock == null) return null;
    
    final value = startBlock.value;
    
    // Find horizontal line through this position
    final horizontalLine = _findHorizontalLine(start, value);
    
    // Find vertical line through this position
    final verticalLine = _findVerticalLine(start, value);
    
    // Return the longer line (if both are valid), but limit to PAIRS (size 2)
    // for standard 2048 chain behavior: 2-2-2-2 -> 4-4 -> 8
    if (horizontalLine.length >= 2 && horizontalLine.length >= verticalLine.length) {
      // Prioritize horizontal, take first 2
      final pair = horizontalLine.take(2).toSet();
      return ClusterResult(positions: pair, value: value);
    } else if (verticalLine.length >= 2) {
      // Take first 2
      final pair = verticalLine.take(2).toSet();
      return ClusterResult(positions: pair, value: value);
    }
    
    return null;
  }
  
  /// Find all positions in a horizontal line containing the given position
  Set<GridPosition> _findHorizontalLine(GridPosition start, int value) {
    final positions = <GridPosition>{start};
    
    // Look left
    int col = start.column - 1;
    while (col >= 0) {
      final pos = GridPosition(start.row, col);
      final block = _gridManager.getBlockAt(pos);
      if (block != null && block.value == value) {
        positions.add(pos);
        col--;
      } else {
        break;
      }
    }
    
    // Look right
    col = start.column + 1;
    while (col < _gridManager.columns) {
      final pos = GridPosition(start.row, col);
      final block = _gridManager.getBlockAt(pos);
      if (block != null && block.value == value) {
        positions.add(pos);
        col++;
      } else {
        break;
      }
    }
    
    return positions;
  }
  
  /// Find all positions in a vertical line containing the given position
  Set<GridPosition> _findVerticalLine(GridPosition start, int value) {
    final positions = <GridPosition>{start};
    
    // Look up
    int row = start.row - 1;
    while (row >= 0) {
      final pos = GridPosition(row, start.column);
      final block = _gridManager.getBlockAt(pos);
      if (block != null && block.value == value) {
        positions.add(pos);
        row--;
      } else {
        break;
      }
    }
    
    // Look down
    row = start.row + 1;
    while (row < _gridManager.rows) {
      final pos = GridPosition(row, start.column);
      final block = _gridManager.getBlockAt(pos);
      if (block != null && block.value == value) {
        positions.add(pos);
        row++;
      } else {
        break;
      }
    }
    
    return positions;
  }
  
  /// Find all mergeable line clusters in the grid
  List<ClusterResult> detectAllMergeableClusters() {
    final allClusters = <ClusterResult>[];
    final processed = <GridPosition>{};
    
    for (final block in _gridManager.getAllBlocks()) {
      final position = block.gridPosition!;
      
      if (processed.contains(position)) continue;
      
      final cluster = detectCluster(position);
      if (cluster != null && cluster.canMerge) {
        allClusters.add(cluster);
        processed.addAll(cluster.positions);
      } else {
        processed.add(position);
      }
    }
    
    return allClusters;
  }
  
  /// Check if placing a block would create a mergeable line
  bool wouldCreateMerge(GridPosition position, int value) {
    // Check horizontal neighbors
    int horizontalCount = 1;
    
    // Left neighbor
    final left = GridPosition(position.row, position.column - 1);
    if (_gridManager.isValidPosition(left)) {
      final block = _gridManager.getBlockAt(left);
      if (block != null && block.value == value) horizontalCount++;
    }
    
    // Right neighbor
    final right = GridPosition(position.row, position.column + 1);
    if (_gridManager.isValidPosition(right)) {
      final block = _gridManager.getBlockAt(right);
      if (block != null && block.value == value) horizontalCount++;
    }
    
    if (horizontalCount >= 2) return true;
    
    // Check vertical neighbors
    int verticalCount = 1;
    
    // Up neighbor
    final up = GridPosition(position.row - 1, position.column);
    if (_gridManager.isValidPosition(up)) {
      final block = _gridManager.getBlockAt(up);
      if (block != null && block.value == value) verticalCount++;
    }
    
    // Down neighbor
    final down = GridPosition(position.row + 1, position.column);
    if (_gridManager.isValidPosition(down)) {
      final block = _gridManager.getBlockAt(down);
      if (block != null && block.value == value) verticalCount++;
    }
    
    return verticalCount >= 2;
  }
}
