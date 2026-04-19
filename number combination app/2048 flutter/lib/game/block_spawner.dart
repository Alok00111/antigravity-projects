/// Block spawner for Block Stack 2048.
/// Generates new blocks with weighted random values based on current score.
library;

import 'dart:math';
import '../models/block.dart';

/// Spawns new blocks with score-based difficulty
class BlockSpawner {
  final Random _random;
  
  BlockSpawner({Random? random}) : _random = random ?? Random();
  
  List<int> _forcedSequence = [];
  
  /// Set a forced sequence of values for tutorial or testing
  void setForcedSequence(List<int> sequence) {
    _forcedSequence = List.from(sequence);
  }

  /// Spawn a new block with value based on current score, highest block, or forced sequence
  Block spawnBlock({int score = 0, int highestBlock = 2}) {
    if (_forcedSequence.isNotEmpty) {
      final value = _forcedSequence.removeAt(0);
      return Block(value: value);
    }
    
    final value = _getRandomValue(score, highestBlock);
    return Block(value: value);
  }
  
  /// Get a random value based on highest block achieved
  /// Max spawn is highest/4 (so if highest is 128, max spawn is 32)
  /// Distribution is weighted towards lower values but with randomness
  int _getRandomValue(int score, int highestBlock) {
    final roll = _random.nextDouble();
    
    // Max spawnable block is highest / 4 (minimum 2)
    // e.g., highest=128 → max=32, highest=64 → max=16
    final maxSpawnable = (highestBlock ~/ 4).clamp(2, 64);
    
    // Build weighted distribution based on what's available
    // Lower values are more common, but higher values unlock as you progress
    if (maxSpawnable <= 2) {
      // Only 2s available
      return 2;
    } else if (maxSpawnable == 4) {
      // 2 and 4 available
      if (roll < 0.75) return 2;
      return 4;
    } else if (maxSpawnable == 8) {
      // 2, 4, 8 available (highest achieved is 32)
      if (roll < 0.60) return 2;
      if (roll < 0.90) return 4;
      return 8;
    } else if (maxSpawnable == 16) {
      // 2, 4, 8, 16 available (highest achieved is 64)
      if (roll < 0.50) return 2;
      if (roll < 0.80) return 4;
      if (roll < 0.95) return 8;
      return 16;
    } else if (maxSpawnable == 32) {
      // 2, 4, 8, 16, 32 available (highest achieved is 128)
      if (roll < 0.45) return 2;
      if (roll < 0.70) return 4;
      if (roll < 0.88) return 8;
      if (roll < 0.97) return 16;
      return 32;
    } else {
      // Max variety (highest is 256+)
      if (roll < 0.40) return 2;
      if (roll < 0.65) return 4;
      if (roll < 0.82) return 8;
      if (roll < 0.93) return 16;
      if (roll < 0.98) return 32;
      return 64;
    }
  }
  
  /// Spawn a block with a specific value (for testing or loading saved games)
  Block spawnBlockWithValue(int value) {
    return Block(value: value);
  }
}
