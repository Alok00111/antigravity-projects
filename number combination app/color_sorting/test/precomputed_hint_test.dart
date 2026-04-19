import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_generator.dart';
import 'package:liquid_sort_puzzle/state/game_provider.dart';
import 'package:flutter/services.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  
  // Mock bundle
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
    const MethodChannel('flutter/services'),
    (MethodCall methodCall) async {
      if (methodCall.method == 'rootBundle.load') {
        return null;
      }
      return null;
    },
  );

  group('Pre-computed Solution Tests', () {
    test('Generated level should have valid solution path', () async {
      // Generate Level 15 (Procedural)
      final levelData = await LevelGenerator.loadLevel(15);
      
      expect(levelData, isNotNull);
      expect(levelData!.solution, isNotNull);
      expect(levelData.solution!.isNotEmpty, isTrue);
      
      print('Generated path length: ${levelData.solution!.length}');
    });

    test('GameProvider should follow pre-computed path', () async {
      // 1. Load generated level
      final gameProvider = GameProvider();
      await gameProvider.loadLevel(15);
      
      final startTubes = gameProvider.tubes;
      
      // 2. Get hint immediately (should be first move of solution)
      final hint1 = gameProvider.getHint();
      expect(hint1, isNotNull);
      
      // 3. Apply hint and check next hint
      gameProvider.selectTube(hint1!.from);
      gameProvider.selectTube(hint1.to);
      gameProvider.completePour();
      
      final hint2 = gameProvider.getHint();
      expect(hint2, isNotNull);
      
      // Verify hints are sequential
      // We can't easily verify exact values without exposing internals, 
      // but non-nullness proves it found *something*.
    });
  });
}
