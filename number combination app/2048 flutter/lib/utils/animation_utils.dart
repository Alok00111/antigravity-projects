/// Animation utilities for Block Stack 2048.
/// Curves, durations, and animation helpers.
library;

import 'package:flutter/material.dart';
import '../core/constants.dart';

/// Animation durations
class AnimationDurations {
  static const Duration shoot = Duration(milliseconds: kShootDurationMs);
  static const Duration snap = Duration(milliseconds: kSnapDurationMs);
  static const Duration mergePop = Duration(milliseconds: kMergePopDurationMs);
  static const Duration spawnPulse = Duration(milliseconds: kSpawnPulseDurationMs);
  static const Duration scoreUpdate = Duration(milliseconds: kScoreAnimationDurationMs);
  static const Duration gravity = Duration(milliseconds: kGravityDurationMs);
}

/// Animation curves
class AnimationCurves {
  /// Shooting upward - smooth deceleration with slight overshoot feel
  static const Curve shoot = Curves.easeOutCubic;
  
  /// Snapping into place - quick settle with bounce
  static const Curve snap = Curves.easeOutBack;
  
  /// Merge pop effect - elastic overshoot
  static const Curve mergePop = Curves.elasticOut;
  
  /// Merge scale in - anticipation before pop
  static const Curve mergeScaleIn = Curves.easeInBack;
  
  /// Spawn pulse - smooth in and out
  static const Curve spawnPulse = Curves.easeOutBack;
  
  /// Score counting up
  static const Curve scoreUpdate = Curves.easeOut;
  
  /// Gravity fall
  static const Curve gravity = Curves.bounceOut;
}

/// Create a shoot animation controller
AnimationController createShootController(TickerProvider vsync) {
  return AnimationController(
    duration: AnimationDurations.shoot,
    vsync: vsync,
  );
}

/// Create a merge animation controller
AnimationController createMergeController(TickerProvider vsync) {
  return AnimationController(
    duration: AnimationDurations.mergePop,
    vsync: vsync,
  );
}

/// Create a spawn animation controller
AnimationController createSpawnController(TickerProvider vsync) {
  return AnimationController(
    duration: AnimationDurations.spawnPulse,
    vsync: vsync,
  );
}

/// Scale tween for merge pop effect (shrink then expand)
TweenSequence<double> get mergeScaleTweenSequence => TweenSequence<double>([
  TweenSequenceItem(
    tween: Tween<double>(begin: 1.0, end: kMergeScaleMin),
    weight: 20,
  ),
  TweenSequenceItem(
    tween: Tween<double>(begin: kMergeScaleMin, end: kMergeScaleMax),
    weight: 40,
  ),
  TweenSequenceItem(
    tween: Tween<double>(begin: kMergeScaleMax, end: 1.0),
    weight: 40,
  ),
]);

/// Scale tween for spawn pulse (0.8 -> 1.1 -> 1.0)
TweenSequence<double> get spawnScaleTweenSequence => TweenSequence<double>([
  TweenSequenceItem(
    tween: Tween<double>(begin: 0.0, end: 1.1),
    weight: 60,
  ),
  TweenSequenceItem(
    tween: Tween<double>(begin: 1.1, end: 1.0),
    weight: 40,
  ),
]);

/// Opacity tween for fade effects
Tween<double> get fadeInTween => Tween<double>(begin: 0.0, end: 1.0);
Tween<double> get fadeOutTween => Tween<double>(begin: 1.0, end: 0.0);
