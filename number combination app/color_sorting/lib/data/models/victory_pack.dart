import 'victory_effect_model.dart';

class VictoryPack {
  static const List<VictoryEffectModel> allEffects = [
    VictoryEffectModel(
      id: 'effect_confetti',
      type: VictoryEffectType.confetti,
      name: 'Classic Confetti',
      description: 'The classic celebration!',
      price: 0,
    ),
    VictoryEffectModel(
      id: 'effect_fireworks',
      type: VictoryEffectType.fireworks,
      name: 'Big Bang',
      description: 'Explosive fireworks display!',
      price: 5000,
    ),
    VictoryEffectModel(
      id: 'effect_bubbles',
      type: VictoryEffectType.bubbles,
      name: 'Bubbly Fun',
      description: 'Floaty bubbles everywhere.',
      price: 5000,
    ),
  ];
  
  static VictoryEffectModel getById(String id) {
    return allEffects.firstWhere(
      (e) => e.id == id,
      orElse: () => allEffects.first,
    );
  }
}
