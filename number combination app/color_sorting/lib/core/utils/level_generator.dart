import 'dart:convert';
import 'package:flutter/services.dart';
import 'dart:math';
import '../../data/models/tube_model.dart';
import '../../data/models/liquid_model.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/level_solver.dart';

/// Level data structure
class LevelData {
  final int id;
  final String difficulty;
  final List<TubeModel> tubes;
  
  const LevelData({
    required this.id,
    required this.difficulty,
    required this.tubes,
    this.isMystery = false,
    this.solution,
  });
  
  final bool isMystery;
  final List<({int from, int to})>? solution;
  
  factory LevelData.fromJson(Map<String, dynamic> json, int levelId) {
    final tubesJson = json['tubes'] as List<dynamic>;
    final tubes = <TubeModel>[];
    
    for (int i = 0; i < tubesJson.length; i++) {
      final tubeData = tubesJson[i] as List<dynamic>;
      tubes.add(TubeModel(
        id: 'tube_$i',
        liquids: tubeData.map((c) => LiquidModel(colorId: c as String)).toList(),
        capacity: 4,
      ));
    }
    
    return LevelData(
      id: levelId,
      difficulty: json['difficulty'] as String? ?? 'easy',
      tubes: tubes,
      isMystery: json['isMystery'] as bool? ?? false,
      // Solution not supported in JSON yet (mostly for procedural)
      solution: null,
    );
  }
}

/// Level generator and loader utility
class LevelGenerator {
  static List<LevelData>? _cachedLevels;
  
  // Prevent instantiation
  LevelGenerator._();
  
  /// Load all levels from JSON assets
  static Future<List<LevelData>> loadAllLevels() async {
    if (_cachedLevels != null) return _cachedLevels!;
    
    final levels = <LevelData>[];
    
    try {
      // Load easy levels
      final easyJson = await rootBundle.loadString('assets/levels/levels_easy.json');
      final easyData = json.decode(easyJson) as Map<String, dynamic>;
      final easyLevels = easyData['levels'] as List<dynamic>;
      
      for (int i = 0; i < easyLevels.length; i++) {
        levels.add(LevelData.fromJson(
          easyLevels[i] as Map<String, dynamic>,
          i + 1,
        ));
      }
      
      // Load medium levels
      final mediumJson = await rootBundle.loadString('assets/levels/levels_medium.json');
      final mediumData = json.decode(mediumJson) as Map<String, dynamic>;
      final mediumLevels = mediumData['levels'] as List<dynamic>;
      
      for (int i = 0; i < mediumLevels.length; i++) {
        levels.add(LevelData.fromJson(
          mediumLevels[i] as Map<String, dynamic>,
          easyLevels.length + i + 1,
        ));
      }
    } catch (e) {
      // Return built-in levels if JSON loading fails
      return _getBuiltInLevels();
    }
    
    _cachedLevels = levels;
    return levels;
  }
  
  static Future<LevelData?> loadLevel(int levelId) async {
    LevelData? level;
    
    // For first 9 levels, use built-in/cached levels
    if (levelId < 10) {
      final levels = await loadAllLevels();
      if (levelId >= 1 && levelId <= levels.length) {
        level = levels[levelId - 1];
      }
    } else {
      // For levels 15+, generate procedurally
      level = _generateProceduralLevel(levelId);
    }
    
    // Mystery Mode logic disabled per user request
    // if (level != null && levelId % 10 == 0) { ... }
    
    return level;
  }
  
  /// Get total number of levels
  static Future<int> getTotalLevels() async {
    // Return a large number to effectively support infinite levels
    return 99999;
  }
  
  /// Built-in levels as fallback
  static List<LevelData> _getBuiltInLevels() {
    return [
      // Level 1: Tutorial - 2 colors
      LevelData(
        id: 1,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_2', liquids: []),
        ],
      ),
      // Level 2: 3 colors
      LevelData(
        id: 2,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
          ]),
          TubeModel(id: 'tube_3', liquids: []),
        ],
      ),
      // Level 3
      LevelData(
        id: 3,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_3', liquids: []),
        ],
      ),
      // Level 4
      LevelData(
        id: 4,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_3', liquids: []),
        ],
      ),
      // Level 5
      LevelData(
        id: 5,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'purple'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'lime'),
          ]),
          TubeModel(id: 'tube_3', liquids: []),
        ],
      ),
      // Level 6 - 4 colors
      LevelData(
        id: 6,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_4', liquids: []),
          TubeModel(id: 'tube_5', liquids: []),
        ],
      ),
      // Level 7
      LevelData(
        id: 7,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'purple'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_3', liquids: []),
        ],
      ),
      // Level 8
      LevelData(
        id: 8,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'pink'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
          ]),
          TubeModel(id: 'tube_3', liquids: []),
        ],
      ),
      // Level 9
      LevelData(
        id: 9,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'lime'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_3', liquids: []),
        ],
      ),
      // Level 10
      LevelData(
        id: 10,
        difficulty: 'easy',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_3', liquids: []),
        ],
      ),
      // Medium levels start here
      // Level 11 - 5 colors
      LevelData(
        id: 11,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_5', liquids: []),
          TubeModel(id: 'tube_6', liquids: []),
        ],
      ),
      // Level 12
      LevelData(
        id: 12,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'pink'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'purple'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
          ]),
          TubeModel(id: 'tube_5', liquids: []),
          TubeModel(id: 'tube_6', liquids: []),
        ],
      ),
      // Level 13
      LevelData(
        id: 13,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'lime'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_5', liquids: []),
          TubeModel(id: 'tube_6', liquids: []),
        ],
      ),
      // Level 14
      LevelData(
        id: 14,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'pink'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'purple'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
          ]),
          TubeModel(id: 'tube_5', liquids: []),
          TubeModel(id: 'tube_6', liquids: []),
        ],
      ),
      // Level 15
      LevelData(
        id: 15,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'lime'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'cyan'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_5', liquids: []),
          TubeModel(id: 'tube_6', liquids: []),
        ],
      ),
      // Level 16 - 6 colors
      LevelData(
        id: 16,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_5', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_6', liquids: []),
          TubeModel(id: 'tube_7', liquids: []),
        ],
      ),
      // Level 17
      LevelData(
        id: 17,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'pink'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'pink'),
          ]),
          TubeModel(id: 'tube_5', liquids: [
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_6', liquids: []),
          TubeModel(id: 'tube_7', liquids: []),
        ],
      ),
      // Level 18
      LevelData(
        id: 18,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_5', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_6', liquids: []),
          TubeModel(id: 'tube_7', liquids: []),
        ],
      ),
      // Level 19
      LevelData(
        id: 19,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'orange'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'teal'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'teal'),
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'orange'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'purple'),
            LiquidModel(colorId: 'teal'),
          ]),
          TubeModel(id: 'tube_5', liquids: [
            LiquidModel(colorId: 'pink'),
            LiquidModel(colorId: 'orange'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'amber'),
          ]),
          TubeModel(id: 'tube_6', liquids: []),
          TubeModel(id: 'tube_7', liquids: []),
        ],
      ),
      // Level 20
      LevelData(
        id: 20,
        difficulty: 'medium',
        tubes: [
          TubeModel(id: 'tube_0', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_1', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_2', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_3', liquids: [
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
          ]),
          TubeModel(id: 'tube_4', liquids: [
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
            LiquidModel(colorId: 'cyan'),
            LiquidModel(colorId: 'magenta'),
          ]),
          TubeModel(id: 'tube_5', liquids: [
            LiquidModel(colorId: 'lime'),
            LiquidModel(colorId: 'blue'),
            LiquidModel(colorId: 'amber'),
            LiquidModel(colorId: 'coral'),
          ]),
          TubeModel(id: 'tube_6', liquids: []),
          TubeModel(id: 'tube_7', liquids: []),
        ],
      ),
    ];
  }

  /// Generate a procedural level based on ID
  static LevelData _generateProceduralLevel(int levelId, {int retryCount = 0}) {
    // 1. Determine Difficulty
    // User Request: Start scaling from Level 10.
    
    final allColors = AppColors.liquidColors.keys.toList();
    
    // Base: Level 10 has 4 colors (6 tubes).
    // Every 5 levels add another color for faster difficulty scaling.
    // Level 10-14: 4 colors
    // Level 15-19: 5 colors
    // Level 20-24: 6 colors
    // ...
    // Cap at 10 colors for very deep levels.
    
    int effectiveLevel = (levelId - 10).clamp(0, 99999);
    int numColors = 4 + (effectiveLevel / 5).floor();
    // Cap at 10 colors max for playability
    numColors = numColors.clamp(4, 10); 
    
    // Check if Mystery Mode
    final bool isMystery = false; // Disabled: levelId % 10 == 0;
    
    // Hard Mode logic: Reduce empty tubes to 1 for higher levels (Level 400+)
    // to force "Hardcore Mode" as requested.
    // Ideally we'd have 2 empty tubes for reliability, but 1 is possible if we
    // rely on our construction path guarantee.
    final int numEmptyTubes = (levelId >= 400) ? 1 : 2;
    // final int totalTubes = numColors + numEmptyTubes; // Unused
    
    // Shuffle complexity: 
    // Tuned for Level 300 target (Max ~35 optimal moves) and Level 500 (~45 moves).
    // Slightly increased to enable finding deep solutions.
    // L15 -> ~39 moves. L300 -> ~119 moves. L500 -> ~175 moves.
    final int shuffleMoves = 35 + (levelId * 0.28).round();
    
    // Minimum Moves Target:
    // Reach ~30-35 moves at Level 300, ~40-45 at Level 500.
    // Updated formula for better difficulty scaling:
    // L15: ~6 moves. L21: ~8 moves. L50: ~14 moves. L100: ~22 moves. L300: ~58 moves.
    final int minMoves = (levelId / 5).floor() + 3;
    
    // 2. Setup Solved State
    
    // Create seeded random for ALL operations
    final random = Random(levelId + (retryCount * 10000));
    
    // Pick 'numColors' random colors using seeded random
    final levelColors = List<String>.from(allColors)..shuffle(random);
    final selectedColors = levelColors.take(numColors).toList();
    
    final List<TubeModel> tubes = [];
    
    // Fill color tubes
    for (int i = 0; i < numColors; i++) {
      final colorId = selectedColors[i];
      tubes.add(TubeModel(
        id: 'tube_$i',
        liquids: List.generate(4, (_) => LiquidModel(colorId: colorId)),
        capacity: 4,
      ));
    }
    
    // Add empty tubes
    for (int i = 0; i < numEmptyTubes; i++) {
      tubes.add(TubeModel(
        id: 'tube_${numColors + i}',
        liquids: [],
        capacity: 4,
      ));
    }
    
    // 3. Shuffle (Reverse Pouring) to guarantee solvability
    // Random is already seeded above.
    // final random = Random(levelId); // REMOVED
    int movesPerformed = 0;
    
    // Store history of moves (Construction Path)
    // The SOLUTION is the reverse of this.
    // However, our shuffle logic allows 'Mismatching Pours' (Cheats).
    // So the reverse move (Pouring back) is VALID because it restores the sorted state.
    // Wait, if we move Color A onto Color B (invalid), the reverse is Color A back to Color A (Valid).
    // So yes, Reverse Path is always valid IF we only poured single units or consistent blocks.
    // BUT we need to be careful: if we moved a block of 2, the reverse is moving a block of 2.
    final history = <({int from, int to})>[];
    
    // Track previous move to prevent immediate undo (ping-pong effect)
    // Store as "from->to" hash or just separate vars
    int lastFrom = -1;
    int lastTo = -1;
    
    // Safety break to prevent infinite loops
    int attempts = 0;
    while (movesPerformed < shuffleMoves && attempts < shuffleMoves * 10) {
      attempts++;
      // print('DEBUG: Attempt $attempts, Moves: $movesPerformed/$shuffleMoves');
      
      // Find all valid moves
      final validMoves = <({int from, int to})>[];
      
      for (int f = 0; f < tubes.length; f++) {
        if (tubes[f].isEmpty) continue; // Cannot pore from empty
        
        for (int t = 0; t < tubes.length; t++) {
          if (f == t) continue;
          if (tubes[t].isFull) continue; // Cannot pour into full (capacity 4)
          
          // Logic: Can we pour Top of F into Top of T?
          // YES if: T is empty OR T.top == F.top
          // ALSO check: Do not undo the exact last move if possible? 
          // (Actually, random walk is fine, but avoiding immediate ping-pong helps mixing)
          
          bool canPour = false;
          final sourceLiquid = tubes[f].liquids.last;
          
          if (tubes[t].isEmpty) {
             canPour = true;
          } else {
             // For shuffling, we ALLOW mismatching colors to create entropy!
             // The player's goal is to UN-mix them.
             // So we simulate "Reverse Moves" roughly by just moving things around.
             canPour = true; 
          }
          
          if (canPour) {
            // Prevent immediate undo: Don't pour back exactly where we came from
            if (f == lastTo && t == lastFrom) {
               continue;
            }
            
            validMoves.add((from: f, to: t));
          }
        }
      }
      
      if (validMoves.isEmpty) {
        print('DEBUG: No valid moves found! Breaking early.');
        break; 
      }
      
      // Pick a random move
      final move = validMoves[random.nextInt(validMoves.length)];
      
      // Apply move
      // Remove from source
      final fluid = tubes[move.from].liquids.last;
      final newSourceLiquids = List<LiquidModel>.from(tubes[move.from].liquids)..removeLast();
      tubes[move.from] = tubes[move.from].copyWith(liquids: newSourceLiquids);
      
      // Add to target
      final newTargetLiquids = List<LiquidModel>.from(tubes[move.to].liquids)..add(fluid);
      tubes[move.to] = tubes[move.to].copyWith(liquids: newTargetLiquids);
      
      movesPerformed++;
      
      // Record the move: We moved from 'from' to 'to'.
      // To SOLVE, we must move from 'to' back to 'from'.
      history.add((from: move.from, to: move.to));
      
      // Update history
      lastFrom = move.from;
      lastTo = move.to;
    }
    
    // 4. Construct Solution
    // Priority: Find the OPTIMAL (Shortest) solution using BFS.
    // CRITICAL FIX: We MUST verify solvability with the Solver.
    // The "Construction Path" (Reverse Shuffle) is NOT valid because random shuffle 
    // moves (e.g. putting Color A on Color B) are not reversible in the game.
    
    List<({int from, int to})>? finalSolution;
    
    try {
      // Increase iterations for deep levels to ensure we find the optimal path
      // L300 needs more search space than L15.
      final iterations = 20000 + (levelId * 200); 
      finalSolution = LevelSolver.getSolution(tubes, maxIterations: iterations);
    } catch (e) {
      print("LevelGenerator BFS failed: $e");
    }
    
    // If BFS failed (timeout or error), the level is potentially UNSOLVABLE.
    // We MUST retry generation.
    if (finalSolution == null) {
       print("DEBUG: Level $levelId generated state is unsolvable or too complex. Retrying... (Attempt ${retryCount+1})");
       
       // Cap retries to prevent infinite recursion, but give it a good chance
       // Hard levels (1 empty tube) are very hard to generate solvably.
       if (retryCount < 100) {
         return _generateProceduralLevel(levelId, retryCount: retryCount + 1);
       } else {
         // Fallback to a simpler generation if we fail 100 times? 
         // Or just return a known solvable level (e.g. Level 15 logic)?
         print("CRITICAL: Failed to generate solvable level $levelId after 100 attempts. Constructing simple fallback.");
         return _generateProceduralLevel(15, retryCount: 0); // Fallback to easier difficulty
       }
    }
    
    // 5. Difficulty Verification
    // If the solution is too simple for this level ID, retry.
    final int maxRetries = (levelId >= 400) ? 50 : 20;
    
    if (finalSolution.length < minMoves && 
        retryCount < maxRetries) {
        
       print('DEBUG: Level $levelId solution too short (${finalSolution.length} < $minMoves). Retrying... (Attempt ${retryCount+1}/$maxRetries)');
       return _generateProceduralLevel(levelId, retryCount: retryCount + 1);
    }
    
    return LevelData(
      id: levelId,
      difficulty: levelId > 10 ? 'medium' : 'hard',
      tubes: tubes,
      isMystery: isMystery,
      solution: finalSolution,
    );
  }
}
