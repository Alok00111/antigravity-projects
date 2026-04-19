import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_generator.dart';
import 'package:flutter/services.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
    const MethodChannel('flutter/services'),
    (MethodCall methodCall) async {
      return null;
    },
  );

  group('Level 300 Scaling Verification', () {
    test('Level 300 should be solvable within ~30 moves', () async {
      print('Generating Level 300...');
      final stopwatch = Stopwatch()..start();
      final level300 = await LevelGenerator.loadLevel(300);
      stopwatch.stop();
      
      expect(level300, isNotNull);
      expect(level300!.solution, isNotNull);
      
      final moves = level300.solution!.length;
      print('Level 300 Verified Solution Length: $moves');
      print('Generation time: ${stopwatch.elapsedMilliseconds}ms');
      
      // Target: Max ~35 moves. Min ~30.
      // Allowing a buffer.
      expect(moves, lessThanOrEqualTo(45), reason: "Solution should be around 35 (max 45)");
      expect(moves, greaterThanOrEqualTo(25), reason: "Solution should not be trivial (min 25)");
      
      // Also check lower levels for curve
      final level15 = await LevelGenerator.loadLevel(15);
      print('Level 15 Solution Length: ${level15!.solution!.length}');
      expect(level15.solution!.length, lessThan(moves));
    });
  });
}
