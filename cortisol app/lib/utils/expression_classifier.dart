import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

/// Detected facial expression category.
enum FaceExpression {
  bigSmile,
  smiling,
  neutral,
  frowning,
  squinting,
  winking,
  eyesClosed,
  lookingAway,
  confused, // head tilted
}

/// Classifies facial expression from ML Kit Face data.
class ExpressionClassifier {
  /// Classify the dominant expression from a single face.
  static FaceExpression classify(Face face) {
    final smile = face.smilingProbability ?? 0.5;
    final leftEye = face.leftEyeOpenProbability ?? 0.5;
    final rightEye = face.rightEyeOpenProbability ?? 0.5;
    final headY = face.headEulerAngleY ?? 0.0; // left/right turn
    final headZ = face.headEulerAngleZ ?? 0.0; // side tilt

    // Eyes closed (both eyes shut)
    if (leftEye < 0.15 && rightEye < 0.15) {
      return FaceExpression.eyesClosed;
    }

    // Winking (one eye open, one closed — significant difference)
    if ((leftEye > 0.5 && rightEye < 0.2) ||
        (rightEye > 0.5 && leftEye < 0.2)) {
      return FaceExpression.winking;
    }

    // Squinting (both eyes partially closed but not shut)
    if (leftEye < 0.35 && rightEye < 0.35 && leftEye > 0.1 && rightEye > 0.1) {
      return FaceExpression.squinting;
    }

    // Looking away (head turned significantly)
    if (headY.abs() > 25) {
      return FaceExpression.lookingAway;
    }

    // Head tilted / confused
    if (headZ.abs() > 15) {
      return FaceExpression.confused;
    }

    // Big smile
    if (smile > 0.85) {
      return FaceExpression.bigSmile;
    }

    // Normal smile
    if (smile > 0.5) {
      return FaceExpression.smiling;
    }

    // Frowning
    if (smile < 0.15) {
      return FaceExpression.frowning;
    }

    // Default neutral
    return FaceExpression.neutral;
  }

  /// Classify from averaged values over a scan session.
  static FaceExpression classifyFromAverages({
    required double avgSmile,
    required double avgLeftEye,
    required double avgRightEye,
    required double avgHeadY,
    required double avgHeadZ,
  }) {
    // Same logic as single-frame, but with averaged data
    if (avgLeftEye < 0.15 && avgRightEye < 0.15) {
      return FaceExpression.eyesClosed;
    }

    if ((avgLeftEye > 0.5 && avgRightEye < 0.2) ||
        (avgRightEye > 0.5 && avgLeftEye < 0.2)) {
      return FaceExpression.winking;
    }

    if (avgLeftEye < 0.35 && avgRightEye < 0.35 &&
        avgLeftEye > 0.1 && avgRightEye > 0.1) {
      return FaceExpression.squinting;
    }

    if (avgHeadY.abs() > 25) {
      return FaceExpression.lookingAway;
    }

    if (avgHeadZ.abs() > 15) {
      return FaceExpression.confused;
    }

    if (avgSmile > 0.85) {
      return FaceExpression.bigSmile;
    }

    if (avgSmile > 0.5) {
      return FaceExpression.smiling;
    }

    if (avgSmile < 0.15) {
      return FaceExpression.frowning;
    }

    return FaceExpression.neutral;
  }

  /// Human-readable label for the expression.
  static String label(FaceExpression expr) {
    switch (expr) {
      case FaceExpression.bigSmile:
        return '😁 BIG SMILE';
      case FaceExpression.smiling:
        return '🙂 SMILING';
      case FaceExpression.neutral:
        return '😐 NEUTRAL';
      case FaceExpression.frowning:
        return '😠 FROWNING';
      case FaceExpression.squinting:
        return '🫣 SQUINTING';
      case FaceExpression.winking:
        return '😉 WINKING';
      case FaceExpression.eyesClosed:
        return '😴 EYES CLOSED';
      case FaceExpression.lookingAway:
        return '👀 LOOKING AWAY';
      case FaceExpression.confused:
        return '🤨 CONFUSED';
    }
  }
}
