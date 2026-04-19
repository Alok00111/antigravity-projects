import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_generator.dart';
import 'package:liquid_sort_puzzle/state/game_provider.dart';
import 'package:flutter/services.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
    const MethodChannel('flutter/services'),
    (MethodCall methodCall) async {
      return null;
    },
  );

  group('Difficulty Scaling Tests', () {
    test('Higher levels should require more moves', () async {
      // Generate Level 15
      final level15 = await LevelGenerator.loadLevel(15);
      final len15 = level15!.solution!.length;
      print('Level 15 Solution Length: $len15');
      
      // Generate Level 50
      final level50 = await LevelGenerator.loadLevel(50);
      final len50 = level50!.solution!.length;
      print('Level 50 Solution Length: $len50');
      
      // Generate Level 100
      final level100 = await LevelGenerator.loadLevel(100);
      final len100 = level100!.solution!.length;
      print('Level 100 Solution Length: $len100');
      
      // Assert progression
      expect(len100, greaterThan(len15), reason: "Level 100 should be harder than Level 15");
      
      // Assert minimums (approximate)
      // Min formula: L/5 + 2.
      // 15 -> 5. 50 -> 12. 100 -> 22.
      expect(len15, greaterThanOrEqualTo(5)); 
      expect(len50, greaterThanOrEqualTo(10)); 
    });
  });
}
