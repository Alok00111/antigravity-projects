import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_solver.dart';
import 'package:liquid_sort_puzzle/data/models/tube_model.dart';
import 'package:liquid_sort_puzzle/data/models/liquid_model.dart';
import 'package:flutter/material.dart';

void main() {
  group('LevelSolver Tests', () {
    test('Should identify a solved state as solvable', () {
      final redLiquid = LiquidModel(colorId: 'red');
      
      final tube1 = TubeModel(
        id: '1', 
        liquids: [redLiquid, redLiquid, redLiquid, redLiquid], 
        capacity: 4
      );
      
      final tube2 = TubeModel(
        id: '2', 
        liquids: [], 
        capacity: 4
      );
      
      final isSolvable = LevelSolver.isSolvable([tube1, tube2]);
      expect(isSolvable, isTrue);
    });

    test('Should identify a simple one-step solvable state', () {
      final redLiquid = LiquidModel(colorId: 'red');
      
      // Tube 1: 3 Reds
      final tube1 = TubeModel(
        id: '1', 
        liquids: [redLiquid, redLiquid, redLiquid], 
        capacity: 4
      );
      
      // Tube 2: 1 Red (Bottom)
      final tube2 = TubeModel(
        id: '2', 
        liquids: [redLiquid], 
        capacity: 4
      );
      
      // Move Tube 2 -> Tube 1 solves it
      final isSolvable = LevelSolver.isSolvable([tube1, tube2]);
      expect(isSolvable, isTrue);
    });
    
    test('Should identify an UNSOLVABLE deadlock', () {
      final redLiquid = LiquidModel(colorId: 'red');
      final blueLiquid = LiquidModel(colorId: 'blue');
      
      // Scenario: 
      // Tube 1: Red (Bottom), Blue (Top) [Full if cap was 2, but here cap is 4]
      // To force deadlock, let's fill them up.
      
      // Tube 1: Blue, Red, Blue, Red
      final tube1 = TubeModel(
        id: '1', 
        liquids: [blueLiquid, redLiquid, blueLiquid, redLiquid], 
        capacity: 4
      );
      
      // Tube 2: Red, Blue, Red, Blue
      final tube2 = TubeModel(
        id: '2', 
        liquids: [redLiquid, blueLiquid, redLiquid, blueLiquid], 
        capacity: 4
      );
      
      // No empty tubes. No moves possible (Blue!=Red).
      
      final isSolvable = LevelSolver.isSolvable([tube1, tube2]);
      expect(isSolvable, isFalse);
    });
  });
}
