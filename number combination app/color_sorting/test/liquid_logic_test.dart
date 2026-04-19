import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/liquid_logic.dart';
import 'package:liquid_sort_puzzle/data/models/tube_model.dart';
import 'package:liquid_sort_puzzle/data/models/liquid_model.dart';
import 'package:flutter/material.dart';

void main() {
  group('LiquidLogic Win Condition Tests', () {
    test('Should return FALSE if colors are split across tubes (even if sorted locally)', () {
      // Scenario: Tube 1 has 2 Reds. Tube 2 has 2 Reds. Both are "sorted" individually.
      // But they are not "Complete" (Full).
      
      final redLiquid = LiquidModel(colorId: 'red');
      
      final tube1 = TubeModel(
        id: '1', 
        liquids: [redLiquid, redLiquid], // 2/4 Red
        capacity: 4
      );
      
      final tube2 = TubeModel(
        id: '2', 
        liquids: [redLiquid, redLiquid], // 2/4 Red
        capacity: 4
      );
      
      final result = LiquidLogic.checkWinCondition([tube1, tube2]);
      
      expect(result, isFalse, reason: "Split sorted tubes should NOT be a win");
    });

    test('Should return TRUE if all non-empty tubes are full and sorted', () {
      final redLiquid = LiquidModel(colorId: 'red');
      
      final tube1 = TubeModel(
        id: '1', 
        liquids: [redLiquid, redLiquid, redLiquid, redLiquid], // 4/4 Red
        capacity: 4
      );
      
      final tube2 = TubeModel(
        id: '2', 
        liquids: [], 
        capacity: 4
      );
      
      final result = LiquidLogic.checkWinCondition([tube1, tube2]);
      
      expect(result, isTrue, reason: "Full sorted tubes should be a win");
    });
    
     test('Should return FALSE if a tube is not sorted', () {
      final redLiquid = LiquidModel(colorId: 'red');
      final blueLiquid = LiquidModel(colorId: 'blue');
      
      final tube1 = TubeModel(
        id: '1', 
        liquids: [redLiquid, blueLiquid, redLiquid, blueLiquid], 
        capacity: 4
      );
      
      final result = LiquidLogic.checkWinCondition([tube1]);
      
      expect(result, isFalse);
    });
  });
}
