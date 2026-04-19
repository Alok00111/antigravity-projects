/// Game configuration for Block Stack 2048.
/// Contains game rules and spawn probabilities.
library;

/// Block spawn probabilities (must sum to 1.0)
class SpawnProbability {
  final int value;
  final double probability;
  
  const SpawnProbability(this.value, this.probability);
}

/// Default spawn probabilities
const List<SpawnProbability> kSpawnProbabilities = [
  SpawnProbability(2, 0.60),  // 60% chance for 2
  SpawnProbability(4, 0.30),  // 30% chance for 4
  SpawnProbability(8, 0.10),  // 10% chance for 8
];

/// Minimum cluster size required for merge
const int kMinClusterSize = 2;

/// Score multiplier (score += merged block value * multiplier)
const int kScoreMultiplier = 1;

/// Game configuration class for future extensibility
class GameConfig {
  final int gridRows;
  final int gridColumns;
  final List<SpawnProbability> spawnProbabilities;
  final int minClusterSize;
  
  const GameConfig({
    this.gridRows = 7,
    this.gridColumns = 5,
    this.spawnProbabilities = kSpawnProbabilities,
    this.minClusterSize = kMinClusterSize,
  });
  
  /// Easy mode: more 2s spawn
  static const GameConfig easy = GameConfig(
    spawnProbabilities: [
      SpawnProbability(2, 0.80),
      SpawnProbability(4, 0.15),
      SpawnProbability(8, 0.05),
    ],
  );
  
  /// Hard mode: more variety in spawns
  static const GameConfig hard = GameConfig(
    spawnProbabilities: [
      SpawnProbability(2, 0.40),
      SpawnProbability(4, 0.35),
      SpawnProbability(8, 0.20),
      SpawnProbability(16, 0.05),
    ],
  );
}
