import 'package:cloud_firestore/cloud_firestore.dart';

/// Data model for a cortisol scan result.
class ScanResult {
  final String? scanId;
  final String userId;
  final int cortisolLevel;
  final String tier;
  final String roast;
  final double? smilingProbability;
  final String? expressionLabel;
  final DateTime timestamp;

  const ScanResult({
    this.scanId,
    required this.userId,
    required this.cortisolLevel,
    required this.tier,
    required this.roast,
    this.smilingProbability,
    this.expressionLabel,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'cortisolLevel': cortisolLevel,
      'tier': tier,
      'roast': roast,
      'smilingProbability': smilingProbability,
      'expressionLabel': expressionLabel,
      'timestamp': Timestamp.fromDate(timestamp),
    };
  }

  factory ScanResult.fromMap(String id, Map<String, dynamic> map) {
    return ScanResult(
      scanId: id,
      userId: map['userId'] ?? '',
      cortisolLevel: map['cortisolLevel'] ?? 0,
      tier: map['tier'] ?? 'UNKNOWN',
      roast: map['roast'] ?? '',
      smilingProbability: (map['smilingProbability'] as num?)?.toDouble(),
      expressionLabel: map['expressionLabel']?.toString(),
      timestamp: (map['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}
