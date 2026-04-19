import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_generator.dart';
import 'package:liquid_sort_puzzle/core/utils/liquid_logic.dart';
import 'package:liquid_sort_puzzle/data/models/tube_model.dart';
import 'package:liquid_sort_puzzle/data/models/liquid_model.dart';

void main() {
  test('Accessing private procedural generator via reflection or mimicking logic', () {
    // Since we can't easily access the private method, we'll manually simulate the issue.
    // Scenario:
    // Shuffle moves:
    // 1. Red -> Tube A 
    // 2. Red -> Tube A (Result: Tube A has Red, Red)
    // Recorded History: [(from: Src, to: A), (from: Src, to: A)]
    // Solution (Reversed): [(from: A, to: Src), (from: A, to: Src)]
    
    // Game Execution:
    // Player requests Hint 1. Gets "A -> Src".
    // Player performs "A -> Src".
    // Tube A has 2 Refs. Src is match.
    // LiquidLogic.pourLiquid moves BOTH Reds at once.
    // Tube A is now empty.
    
    // Player requests Hint 2.
    // Current Game State: Tube A empty.
    // Cached Solution Path expects us to be at step 1?
    // Step 2 is "A -> Src".
    // But Tube A is empty! Move is INVALID.
    // Desync!
    
    final red = LiquidModel(colorId: 'red');
    final tubeA = TubeModel(id: 'A', liquids: [red, red], capacity: 4);
    final tubeSrc = TubeModel(id: 'Src', liquids: [], capacity: 4);
    
    var tubes = [tubeA, tubeSrc];
    
    // The "Raw" Solution Path (Atomic)
    final rawSolution = [
      (from: 0, to: 1), // A -> Src
      (from: 0, to: 1)  // A -> Src
    ];
    
    // Simulation
    print('Start: ${tubes[0].liquids.length} reds in A');
    
    // Execute Move 1
    final move1 = rawSolution[0];
    final result = LiquidLogic.pourLiquid(tubes, move1.from, move1.to);
    tubes = result.newTubes;
    
    print('After Move 1: ${tubes[0].liquids.length} reds in A');
    
    // Check if Move 2 is valid
    final move2 = rawSolution[1];
    final isValid = LiquidLogic.canPour(tubes[move2.from], tubes[move2.to]);
    
    print('Is Move 2 Valid? $isValid');
    
    expect(isValid, isFalse, reason: "The second atomic move becomes invalid because the first move took everything.");
  });
}
