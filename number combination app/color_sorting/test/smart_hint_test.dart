import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_solver.dart';
import 'package:liquid_sort_puzzle/data/models/tube_model.dart';
import 'package:liquid_sort_puzzle/data/models/liquid_model.dart';
import 'package:liquid_sort_puzzle/core/utils/liquid_logic.dart';
import 'package:flutter/material.dart';

void main() {
  group('Smart Hint Tests', () {
    test('Should find solution path for simple puzzle', () {
      final red = LiquidModel(colorId: 'red');
      
      // Tube 1: Red, Red, Red (Target)
      final tube1 = TubeModel(
        id: '1', 
        liquids: [red, red, red], 
        capacity: 4
      );
      
      // Tube 2: Red (Source)
      final tube2 = TubeModel(
        id: '2', 
        liquids: [red], 
        capacity: 4
      );
      
      final solution = LevelSolver.getSolution([tube1, tube2]);
      
      expect(solution, isNotNull);
      expect(solution!.isNotEmpty, isTrue);
      
      // Both 1->0 and 0->1 are valid wins (one tube becomes full, one empty)
      expect(solution.length, 1);
      final move = solution.first;
      bool isValid = (move.from == 1 && move.to == 0) || (move.from == 0 && move.to == 1);
      expect(isValid, isTrue, reason: "Move ${move.from}->${move.to} is not one of the expected valid wins");
    });

    test('Should find multi-step solution', () {
      final red = LiquidModel(colorId: 'red');
      final blue = LiquidModel(colorId: 'blue');
      
      // Tube 1: Blue, Red (Bottom)
      final tube1 = TubeModel(
        id: '1', 
        liquids: [red, blue], // Red at bottom
        capacity: 4
      );
      
      // Tube 2: Red (Top is space)
      final tube2 = TubeModel(
        id: '2', 
        liquids: [red], 
        capacity: 4
      );
      
      // Tube 3: Empty
      final tube3 = TubeModel(
        id: '3', 
        liquids: [], 
        capacity: 4
      );
      
      // Goal: Sort Red and Blue.
      // Tube 1 has Blue on Red. Trapped.
      // Steps:
      // 1. Move Blue from Tube 1 -> Tube 3 (Empty)
      // 2. Move Red from Tube 2 -> Tube 1 (on Red)
      // 3. Move Red from Tube 1 (now 2 red) -> Wait, Tube 1 is Red, Red.
      // Actually:
      // 1. T1(Blue) -> T3. T1=[Red], T3=[Blue]
      // 2. T2(Red) -> T1. T1=[Red, Red], T2=[]
      // Solved! (Assuming checkWinCondition allows partial full tubes? Previous fix: NO, must be full. Wait.)
      
      // IMPORTANT: My win condition fix requires FULL tubes.
      // But in this test scenario, I only have 2 Reds and 1 Blue total.
      // They can never be "Full" (capacity 4).
      // So LevelSolver will fail if it strictly checks isComplete (Capacity 4).
      // Let's modify the tubes to be nearly full so they CAN assume full state?
      // OR, check checkWinCondition logic.
      
      // Win Logic:
      // return tubes.every((tube) => tube.isEmpty || tube.isComplete);
      // isComplete => isFull && isSorted.
      // If I only have 1 Blue liquid, it can never form a Complete tube of 4.
      // So this puzzle is UNSOLVABLE by definition of the new win condition.
      
      // I should create a solvable scenario with 4 of each color.
      
      final r = red;
      final b = blue;
      
      // T1: r, r, r, b (Blue on top)
      final t1 = TubeModel(id: '1', liquids: [r, r, r, b], capacity: 4);
      
      // T2: b, b, b (3 Blues)
      final t2 = TubeModel(id: '2', liquids: [b, b, b], capacity: 4);
      
      // T3: Empty
      final t3 = TubeModel(id: '3', liquids: [], capacity: 4);
      
      // Solution:
      // 1. T1 -> T2 (Pour Blue). T1=[rrr], T2=[bbbb] (Complete)
      // T1 is [rrr]. Still not complete (needs 4).
      // Ah, wait. Where is the 4th Red? Check logic.
      // Total: 3 Red + 1 Blue + 3 Blue = 4 Blue, 3 Red.
      // I need 4 Red.
      
      // Let's put 4th Red in T3? No, T3 is empty needed for moves?
      // Actually, if T2 becomes full, we are good.
      // T1 becomes [r,r,r].
      // Need 4th Red.
      // Let's put 4th Red in T3.
      // T3 = [r].
      // 1. T1(b) -> T2.
      // 2. T3(r) -> T1. T1=[rrrr] Complete.
      // Win!
      
      final t3_red = TubeModel(id: '3', liquids: [r], capacity: 4);
      
      final solution = LevelSolver.getSolution([t1, t2, t3_red]);
      if (solution != null) {
         print('Found solution with ${solution.length} steps:');
         for (var m in solution) {
           print('${m.from} -> ${m.to}');
         }
      }

      expect(solution, isNotNull);
      expect(solution!.length, 2);
      
      // Verify that executing these moves results in a win
      var currentTubes = [t1, t2, t3_red];
      for (final move in solution) {
        final result = LiquidLogic.pourLiquid(currentTubes, move.from, move.to);
        expect(result.success, isTrue);
        currentTubes = result.newTubes;
      }
      
      final isWon = LiquidLogic.checkWinCondition(currentTubes);
      expect(isWon, isTrue, reason: "The found solution path should lead to a win state");
    });
  });
}
