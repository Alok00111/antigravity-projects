import '../../data/models/tube_model.dart';


/// Result of a pour operation
class PourResult {
  final List<TubeModel> newTubes;
  final int liquidsPoured;
  final bool success;
  
  const PourResult({
    required this.newTubes,
    required this.liquidsPoured,
    required this.success,
  });
}

/// Pure logic functions for liquid sorting game mechanics
class LiquidLogic {
  // Prevent instantiation
  LiquidLogic._();
  
  /// Check if we can pour from one tube to another
  static bool canPour(TubeModel fromTube, TubeModel toTube) {
    // Can't pour from an empty tube
    if (fromTube.isEmpty) return false;
    
    // Can't pour to a full tube
    if (toTube.isFull) return false;
    
    // Can't pour to the same tube
    if (fromTube.id == toTube.id) return false;
    
    // If target tube is empty, can always pour
    if (toTube.isEmpty) return true;
    
    // Colors must match
    return fromTube.topColorId == toTube.topColorId;
  }
  
  /// Execute a pour and return new tube states
  static PourResult pourLiquid(List<TubeModel> tubes, int fromIndex, int toIndex) {
    final fromTube = tubes[fromIndex];
    final toTube = tubes[toIndex];
    
    if (!canPour(fromTube, toTube)) {
      return PourResult(newTubes: tubes, liquidsPoured: 0, success: false);
    }
    
    // Calculate how many liquids we can pour
    int pourCount = fromTube.topSameColorCount;
    final availableSpace = toTube.availableSpace;
    pourCount = pourCount > availableSpace ? availableSpace : pourCount;
    
    // Create new tube states
    var newFromTube = fromTube;
    var newToTube = toTube;
    
    for (int i = 0; i < pourCount; i++) {
      final liquid = newFromTube.topLiquid!;
      newFromTube = newFromTube.removeTopLiquid();
      newToTube = newToTube.addLiquid(liquid);
    }
    
    // Create new tubes list
    final newTubes = tubes.map((tube) {
      if (tube.id == fromTube.id) return newFromTube;
      if (tube.id == toTube.id) return newToTube;
      return tube;
    }).toList();
    
    return PourResult(
      newTubes: newTubes,
      liquidsPoured: pourCount,
      success: true,
    );
  }
  
  /// Check if the puzzle is solved
  static bool checkWinCondition(List<TubeModel> tubes) {
    for (final tube in tubes) {
      // Each tube must be either empty or contain only one color AND be full
      if (!tube.isEmpty && !tube.isComplete) {
        return false;
      }
    }
    return true;
  }
  
  /// Get all valid moves from current state
  static List<({int from, int to})> getValidMoves(List<TubeModel> tubes) {
    final moves = <({int from, int to})>[];
    
    for (int i = 0; i < tubes.length; i++) {
      for (int j = 0; j < tubes.length; j++) {
        if (i != j && canPour(tubes[i], tubes[j])) {
          // Skip moves that don't make progress
          // (pouring from a sorted tube to an empty tube)
          if (tubes[i].isSorted && tubes[j].isEmpty) continue;
          
          moves.add((from: i, to: j));
        }
      }
    }
    
    return moves;
  }
  
  /// Check if the game is stuck (no valid moves and not won)
  static bool isStuck(List<TubeModel> tubes) {
    if (checkWinCondition(tubes)) return false;
    return getValidMoves(tubes).isEmpty;
  }
  
  /// Get a hint (suggests best next move)
  static ({int from, int to})? getHint(List<TubeModel> tubes) {
    final moves = getValidMoves(tubes);
    if (moves.isEmpty) return null;
    
    // Prioritize moves that fill up a tube with same color
    for (final move in moves) {
      final toTube = tubes[move.to];
      final fromTube = tubes[move.from];
      
      // If this move would complete a tube, prioritize it
      if (toTube.availableSpace == fromTube.topSameColorCount) {
        return move;
      }
    }
    
    // Otherwise return first valid move
    return moves.first;
  }
}
