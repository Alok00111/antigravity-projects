import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/core/utils/level_generator.dart';
import 'package:liquid_sort_puzzle/data/models/tube_model.dart';

void main() {
  test('Level 15 generation should produce mixed tubes', () async {
    // Generate Level 15
    final level = await LevelGenerator.loadLevel(15);
    
    // Check if any tube has MIXED colors (e.g. Red then Blue)
    bool hasMixedTube = false;
    
    for (final tube in level!.tubes) {
      if (tube.isEmpty) continue;
      
      final firstColor = tube.liquids.first.colorId;
      for (final liquid in tube.liquids) {
        if (liquid.colorId != firstColor) {
           hasMixedTube = true;
           break;
        }
      }
    }
    
    print('DEBUG: Level 15 Has Mixed Tube: $hasMixedTube');
    
    // If logic is broken, hasMixedTube will be FALSE (all tubes are sorted)
    expect(hasMixedTube, isTrue, reason: "Generated level should have at least one mixed color tube");
  });
}
