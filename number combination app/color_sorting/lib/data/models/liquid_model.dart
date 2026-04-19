import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';

/// Model representing a single liquid layer
class LiquidModel {
  final String colorId;
  
  const LiquidModel({required this.colorId});
  
  /// Get the actual color from the color ID
  Color get color => AppColors.getLiquidColor(colorId);
  
  /// Create from JSON
  factory LiquidModel.fromJson(String colorId) {
    return LiquidModel(colorId: colorId);
  }
  
  /// Convert to JSON
  String toJson() => colorId;
  
  /// Create a copy
  LiquidModel copyWith({String? colorId}) {
    return LiquidModel(colorId: colorId ?? this.colorId);
  }
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is LiquidModel && other.colorId == colorId;
  }
  
  @override
  int get hashCode => colorId.hashCode;
  
  @override
  String toString() => 'LiquidModel(colorId: $colorId)';
}
