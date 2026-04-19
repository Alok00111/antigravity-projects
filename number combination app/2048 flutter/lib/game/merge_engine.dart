/// Merge engine for Block Stack 2048.
/// Handles merging clusters and calculating scores.
library;

import '../models/block.dart';
import '../models/position.dart';
import 'cluster_detector.dart';
import 'grid_manager.dart';

/// Result of a merge operation
class MergeResult {
  /// Positions of blocks that were removed
  final Set<GridPosition> removedPositions;
  
  /// The blocks that were removed (for animation)
  final List<Block> removedBlocks;
  
  /// The new merged block (placed at one of the removed positions)
  final Block newBlock;
  
  /// Score earned from this merge
  final int scoreEarned;
  
  MergeResult({
    required this.removedPositions,
    required this.removedBlocks,
    required this.newBlock,
    required this.scoreEarned,
  });
}

/// Handles merging logic
class MergeEngine {
  final GridManager _gridManager;
  final ClusterDetector _clusterDetector;
  
  MergeEngine(this._gridManager) 
      : _clusterDetector = ClusterDetector(_gridManager);
  
  /// Attempt to merge cluster at the given position
  /// Returns MergeResult if merge occurred, null otherwise
  MergeResult? tryMerge(GridPosition position) {
    final cluster = _clusterDetector.detectCluster(position);
    
    if (cluster == null || !cluster.canMerge) {
      return null;
    }
    
    return _performMerge(cluster);
  }
  
  /// Perform the merge operation
  MergeResult _performMerge(ClusterResult cluster) {
    // Calculate new value (original value × 2, NOT value × cluster size)
    final newValue = cluster.value * 2;
    
    // Calculate the position for the new block
    // Prioritize positions adjacent to existing blocks of the same value (for chain reactions)
    final mergePosition = _findMergePosition(cluster.positions, newValue);
    
    // Calculate score
    final scoreEarned = newValue;
    
    // Capture blocks before removing (for animation)
    final removedBlocks = <Block>[];
    for (final pos in cluster.positions) {
      final block = _gridManager.getBlockAt(pos);
      if (block != null) {
        // Ensure position is set for rendering
        block.gridPosition = pos; 
        removedBlocks.add(block);
      }
    }
    
    // Remove all blocks in the cluster
    _gridManager.removeBlocks(cluster.positions);
    
    // Create and place the new merged block
    final newBlock = Block(value: newValue);
    _gridManager.placeBlockAt(newBlock, mergePosition);
    
    return MergeResult(
      removedPositions: cluster.positions,
      removedBlocks: removedBlocks,
      newBlock: newBlock,
      scoreEarned: scoreEarned,
    );
  }
  
  /// Find the best position for the merged block
  /// Uses a scoring system with deep lookahead (depth 6) to maximize chain reactions
  GridPosition _findMergePosition(Set<GridPosition> positions, int targetValue) {
    GridPosition? bestPos;
    int bestScore = -1;
    
    // Check each position in the cluster to see which offers the best chain potential
    for (final pos in positions) {
      // Calculate score with lookahead
      // Pass the set of positions being removed to ignore them in checks
      final score = _getChainScore(pos, targetValue, 6, ignorePositions: positions);
      
      // If score is better, pick it
      if (score > bestScore) {
        bestScore = score;
        bestPos = pos;
      } else if (score == bestScore && bestPos != null) {
        // Tie-breaker: Prefer UPPER position (lower row number)
        // This makes blocks "merge upward" rather than downward, unless a downward merge enables a better chain
        if (pos.row < bestPos.row) {
          bestPos = pos;
        } else if (pos.row == bestPos.row && pos.column < bestPos.column) {
          // Secondary: prefer left for horizontal ties
          bestPos = pos;
        }
      }
    }
    
    // If we found a position, return it.
    if (bestPos != null) return bestPos;
    
    // Fallback: Return the top-most position
    final sortedList = positions.toList()
      ..sort((a, b) {
        if (a.row != b.row) return a.row.compareTo(b.row);
        return a.column.compareTo(b.column);
      });
    return sortedList.first;
  }

  /// Recursive function to calculate chain reaction potential
  /// [depth] - How many steps ahead to look (requested 6)
  /// [ignorePositions] - Positions to pretend are empty (currently merging blocks)
  int _getChainScore(GridPosition pos, int val, int depth, {Set<GridPosition>? ignorePositions}) {
    if (depth <= 0) return 0;
    
    int maxSubScore = 0;
    final neighbors = _gridManager.getValidNeighbors(pos);
    
    for (final neighbor in neighbors) {
      // Skip ignored positions (blocks currently merging)
      if (ignorePositions != null && ignorePositions.contains(neighbor)) continue;
      
      final neighborBlock = _gridManager.getBlockAt(neighbor);
      if (neighborBlock == null) continue;
      
      // Check if neighbor can continue the chain
      if (neighborBlock.value == val) {
        // Direct merge! This block (val) merges with neighbor (val) -> (val*2)
        // High score for immediate merge
        // Recurse from the neighbor's position with the NEW value
        final currentScore = 100 + _getChainScore(neighbor, val * 2, depth - 1, ignorePositions: ignorePositions);
        if (currentScore > maxSubScore) maxSubScore = currentScore;
        
      } else if (neighborBlock.value == val * 2) {
        // Potential future merge! This block (val) needs one more (val) to become (val*2)
        // Then it would merge with neighbor (val*2)
        // Lower score, but good for setup
        // We don't verify the *formation* of the intermediate block here, just the adjacency bonus
        final currentScore = 50 + _getChainScore(neighbor, val * 2, depth - 1, ignorePositions: ignorePositions);
        if (currentScore > maxSubScore) maxSubScore = currentScore;
      }
    }
    
    return maxSubScore;
  }
  
  /// Process part of a chain reaction - one step at a time
  /// Returns a single MergeResult if a merge occurred, or null if stable
  MergeResult? processNextMerge() {
    // Find all potential clusters
    final clusters = _clusterDetector.detectAllMergeableClusters();
    
    if (clusters.isEmpty) {
      return null;
    }
    
    // Process only the FIRST cluster found
    final cluster = clusters.first;
    final result = _performMerge(cluster);
    
    // Apply gravity immediately to prepare for next potential merge
    applyGravity();
    
    return result;
  }
  
  /// Apply gravity - make blocks fall to fill empty spaces
  /// Returns true if any blocks moved
  bool applyGravity() {
    bool anyMoved = false;
    
    // Process each column from bottom to top
    for (int col = 0; col < _gridManager.columns; col++) {
      anyMoved = _applyGravityToColumn(col) || anyMoved;
    }
    
    return anyMoved;
  }
  
  /// Apply gravity to a single column - blocks rise UP to fill gaps
  /// Keeps moving blocks until all gaps are filled
  bool _applyGravityToColumn(int column) {
    bool anyMoved = false;
    bool moved = true;
    
    // Keep looping until no more moves are possible
    while (moved) {
      moved = false;
      
      // Start from top (row 0), find gaps and move blocks UP
      for (int row = 0; row < _gridManager.rows; row++) {
        final cell = _gridManager.getCellAt(row, column);
        if (cell == null || cell.isOccupied) continue;
        
        // Found an empty cell, look for a block below to pull UP
        for (int below = row + 1; below < _gridManager.rows; below++) {
          final belowCell = _gridManager.getCellAt(below, column);
          if (belowCell != null && belowCell.isOccupied) {
            // Move this block UP
            final block = belowCell.block!;
            belowCell.clear();
            _gridManager.placeBlockAt(block, GridPosition(row, column));
            moved = true;
            anyMoved = true;
            break;
          }
        }
        // After moving one block, restart the loop to fill any new gaps
        if (moved) break;
      }
    }
    
    return anyMoved;
  }
}
