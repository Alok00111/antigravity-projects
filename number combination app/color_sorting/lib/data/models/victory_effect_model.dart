enum VictoryEffectType {
  confetti,
  fireworks,
  bubbles,
}

class VictoryEffectModel {
  final String id;
  final VictoryEffectType type;
  final String name;
  final String description;
  final int price;
  final bool isPremium; // If true, maybe costs real money or high coins

  const VictoryEffectModel({
    required this.id,
    required this.type,
    required this.name,
    required this.description,
    required this.price,
    this.isPremium = false,
  });
}
