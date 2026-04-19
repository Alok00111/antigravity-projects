import 'dart:collection';
import '../../data/models/tube_model.dart';
import 'liquid_logic.dart';

/// Node for BFS to track path
class _SolverNode {
  final List<TubeModel> tubes;
  final _SolverNode? parent;
  final ({int from, int to})? move;

  _SolverNode(this.tubes, [this.parent, this.move]);
}

/// Utility to verify if a level is solvable and find the solution
class LevelSolver {
  // Prevent instantiation
  LevelSolver._();

  /// Check if the given tube configuration is solvable.
  static bool isSolvable(List<TubeModel> startTubes, {int maxIterations = 5000}) {
    return getSolution(startTubes, maxIterations: maxIterations) != null;
  }

  /// Find a solution path for the given level.
  /// 
  /// Uses Breadth-First Search (BFS) to explore possible moves.
  /// Returns a list of moves to win, or null if unsolvable/timed out.
  static List<({int from, int to})>? getSolution(List<TubeModel> startTubes, {int maxIterations = 5000}) {
    // Queue for BFS
    final queue = Queue<_SolverNode>();
    queue.add(_SolverNode(startTubes));

    // Visited set (hash strings)
    final visited = <String>{};
    visited.add(_generateStateHash(startTubes));

    int iterations = 0;

    while (queue.isNotEmpty) {
      iterations++;
      if (iterations > maxIterations) {
        // Search limit reached. Ideally return null (unknown), but for game hints, 
        // we might just say "No solution found" if it's too deep.
        print('LevelSolver: Max iterations reached ($maxIterations). Optimization needed?');
        return null; 
      }

      final currentNode = queue.removeFirst();
      final currentTubes = currentNode.tubes;

      // Check for win
      if (LiquidLogic.checkWinCondition(currentTubes)) {
        return _reconstructPath(currentNode);
      }

      final moves = LiquidLogic.getValidMoves(currentTubes);

      for (final move in moves) {
        final result = LiquidLogic.pourLiquid(currentTubes, move.from, move.to);
        
        if (result.success) {
          final newState = result.newTubes;
          final stateHash = _generateStateHash(newState);

          if (!visited.contains(stateHash)) {
            visited.add(stateHash);
            queue.add(_SolverNode(newState, currentNode, move));
          }
        }
      }
    }

    // Queue exhausted -> Unsolvable
    return null;
  }
  
  /// Reconstruct path from winning node back to start
  static List<({int from, int to})> _reconstructPath(_SolverNode endNode) {
    final path = <({int from, int to})>[];
    var current = endNode;
    
    while (current.parent != null) {
      path.add(current.move!);
      current = current.parent!;
    }
    
    // Path is currently End -> Start, reverse it
    return path.reversed.toList();
  }

  /// Generate a unique string signature for the tubes state
  static String _generateStateHash(List<TubeModel> tubes) {
    // Canonicalize state by sorting tube signatures
    final tubeStrings = tubes.map((t) {
      if (t.isEmpty) return 'E'; 
      return t.liquids.map((l) => l.colorId).join(',');
    }).toList();

    tubeStrings.sort();
    return tubeStrings.join('|');
  }
}
