import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_generator.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('LevelGenerator Tests', () {
    test('Level 10 should be Mystery Mode', () async {
      // Level 10 is built-in but logic should apply override or check
      // Wait, loadLevel applies the override wrapper.
      final level = await LevelGenerator.loadLevel(10);
      expect(level, isNotNull);
      expect(level!.isMystery, isTrue);
    });

    test('Level 11 should NOT be Mystery Mode', () async {
      final level = await LevelGenerator.loadLevel(11);
      expect(level, isNotNull);
      expect(level!.isMystery, isFalse);
    });

    test('Level 20 should be Mystery Mode', () async {
      final level = await LevelGenerator.loadLevel(20);
      expect(level, isNotNull);
      expect(level!.isMystery, isTrue);
    });
    
    test('Level 30 should be Mystery Mode', () async {
      final level = await LevelGenerator.loadLevel(30);
      expect(level, isNotNull);
      expect(level!.isMystery, isTrue);
    });

    test('Level 15 Difficulty Scaling (Base)', () async {
      // Level 15: 4 colors + 2 empty = 6 tubes
      final level = await LevelGenerator.loadLevel(15);
      expect(level, isNotNull);
      // Logic: 4 + (0/10) = 4 colors. 4 colors have liquids.
      // Tube count = 4 + 2 = 6.
      expect(level!.tubes.length, 6);
    });
    
    test('Level 25 Difficulty Scaling (+1 Color)', () async {
      // Level 25: (25-15)/10 = 1. 4+1 = 5 colors.
      // 5 colors + 2 empty = 7 tubes.
      final level = await LevelGenerator.loadLevel(25);
      expect(level, isNotNull);
      expect(level!.tubes.length, 7);
    });
  });
}
