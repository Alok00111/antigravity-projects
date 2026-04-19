import 'liquid_model.dart';

/// Model representing a test tube with liquid layers
class TubeModel {
  final String id;
  final List<LiquidModel> liquids; // Bottom to top
  final int capacity;
  
  const TubeModel({
    required this.id,
    required this.liquids,
    this.capacity = 4,
  });
  
  /// Check if tube is empty
  bool get isEmpty => liquids.isEmpty;
  
  /// Check if tube is full
  bool get isFull => liquids.length >= capacity;
  
  /// Get the top liquid color ID (or null if empty)
  String? get topColorId => liquids.isNotEmpty ? liquids.last.colorId : null;
  
  /// Get the top liquid (or null if empty)
  LiquidModel? get topLiquid => liquids.isNotEmpty ? liquids.last : null;
  
  /// Get available space in the tube
  int get availableSpace => capacity - liquids.length;
  
  /// Check if tube contains only one color (sorted)
  bool get isSorted {
    if (liquids.isEmpty) return true;
    final firstColor = liquids.first.colorId;
    return liquids.every((l) => l.colorId == firstColor);
  }
  
  /// Check if tube is complete (full and sorted)
  bool get isComplete => isFull && isSorted;
  
  /// Count consecutive same-color liquids from top
  int get topSameColorCount {
    if (liquids.isEmpty) return 0;
    final topColor = liquids.last.colorId;
    int count = 0;
    for (int i = liquids.length - 1; i >= 0; i--) {
      if (liquids[i].colorId == topColor) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
  
  /// Create from JSON
  factory TubeModel.fromJson(Map<String, dynamic> json) {
    return TubeModel(
      id: json['id'] as String,
      liquids: (json['liquids'] as List<dynamic>)
          .map((c) => LiquidModel.fromJson(c as String))
          .toList(),
      capacity: json['capacity'] as int? ?? 4,
    );
  }
  
  /// Convert to JSON
  Map<String, dynamic> toJson() => {
    'id': id,
    'liquids': liquids.map((l) => l.toJson()).toList(),
    'capacity': capacity,
  };
  
  /// Create a copy with modifications
  TubeModel copyWith({
    String? id,
    List<LiquidModel>? liquids,
    int? capacity,
  }) {
    return TubeModel(
      id: id ?? this.id,
      liquids: liquids ?? List.from(this.liquids),
      capacity: capacity ?? this.capacity,
    );
  }
  
  /// Add a liquid to the top
  TubeModel addLiquid(LiquidModel liquid) {
    if (isFull) return this;
    return copyWith(liquids: [...liquids, liquid]);
  }
  
  /// Remove the top liquid
  TubeModel removeTopLiquid() {
    if (isEmpty) return this;
    return copyWith(liquids: liquids.sublist(0, liquids.length - 1));
  }
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! TubeModel) return false;
    if (other.id != id || other.capacity != capacity) return false;
    if (other.liquids.length != liquids.length) return false;
    for (int i = 0; i < liquids.length; i++) {
      if (other.liquids[i] != liquids[i]) return false;
    }
    return true;
  }
  
  @override
  int get hashCode => Object.hash(id, capacity, Object.hashAll(liquids));
  
  @override
  String toString() => 'TubeModel(id: $id, liquids: ${liquids.length}/$capacity)';
}
