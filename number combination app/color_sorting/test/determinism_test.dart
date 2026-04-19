import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_generator.dart';
import 'package:liquid_sort_puzzle/data/models/tube_model.dart';
import 'package:flutter/services.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  
  // Mock MethodChannel for asset loading (though proedural gen might not need it if cached)
  // Actually procedural doesn't load assets, but loadLevel calls loadAllLevels first which does.
  // We need to handle that.
  // Or simpler: call private _generateProceduralLevel if we could, but we can't (private).
  // Implementation detail: loadLevel(15) calls generated logic directly?
  // Check code:
  /*
    if (levelId < 15) { ... loadAllLevels ... } 
    else { ... _generateProceduralLevel ... }
  */
  // So for Level 15+, we don't hit assets. EXCEPT the `loadAllLevels` call inside `loadLevel` if <15.
  // Oh wait, `loadLevel` logic:
  /*
    if (levelId < 15) { ... } else { level = ... }
  */
  // So Level 15 won't trigger asset loading. Safe.

  test('LevelGenerator should be deterministic for Level 15+', () async {
    final levelId = 15;
    
    // First generation
    final levelA = await LevelGenerator.loadLevel(levelId);
    
    // Second generation
    final levelB = await LevelGenerator.loadLevel(levelId);
    
    // Check equality
    // TubeModel.operator== is implemented.
    expect(levelA!.tubes.length, levelB!.tubes.length);
    
    for (int i = 0; i < levelA.tubes.length; i++) {
      final tubeA = levelA.tubes[i];
      final tubeB = levelB.tubes[i];
      
      expect(tubeA.id, tubeB.id);
      expect(tubeA.liquids.length, tubeB.liquids.length);
      
      for (int k = 0; k < tubeA.liquids.length; k++) {
         expect(tubeA.liquids[k].colorId, tubeB.liquids[k].colorId, 
             reason: "Mismatch at Tube $i Liquid $k");
      }
    }
    
    print('Determinism Test Passed: Level $levelId generated identically.');
  });
  
  test('LevelGenerator should produce DIFFERENT levels for different IDs', () async {
    final levelA = await LevelGenerator.loadLevel(15);
    final levelB = await LevelGenerator.loadLevel(16);
    
    // Assuming entropy is high enough, they shouldn't match.
    // Hash check or simply first liquid check.
    
    bool identical = true;
    if (levelA!.tubes.length != levelB!.tubes.length) {
       identical = false;
    } else {
       // Deep check
        for (int i = 0; i < levelA.tubes.length; i++) {
          if (levelA.tubes[i] != levelB.tubes[i]) {
            identical = false; 
            break;
          }
        }
    }
    
    expect(identical, isFalse, reason: "Different levels should not be identical");
  });
}
