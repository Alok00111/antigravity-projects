import 'package:flutter/animation.dart';

/// Animation Constants - Durations and Curves
class AppAnimations {
  // Prevent instantiation
  AppAnimations._();

  // Durations
  static const Duration instant = Duration(milliseconds: 0);
  static const Duration fastest = Duration(milliseconds: 100);
  static const Duration fast = Duration(milliseconds: 200);
  static const Duration normal = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration slower = Duration(milliseconds: 800);
  static const Duration slowest = Duration(milliseconds: 1000);
  
  // Specific Animation Durations
  static const Duration splashDuration = Duration(milliseconds: 2000);
  static const Duration splashFadeIn = Duration(milliseconds: 800);
  static const Duration splashScale = Duration(milliseconds: 600);
  
  static const Duration tubeSelect = Duration(milliseconds: 150);
  static const Duration pourAnimation = Duration(milliseconds: 1000);
  static const Duration liquidFlow = Duration(milliseconds: 400);
  static const Duration tubeRotation = Duration(milliseconds: 300);
  
  static const Duration buttonPulse = Duration(milliseconds: 1500);
  static const Duration buttonPress = Duration(milliseconds: 100);
  static const Duration buttonRipple = Duration(milliseconds: 300);
  
  static const Duration levelTileStagger = Duration(milliseconds: 50);
  static const Duration levelTileScale = Duration(milliseconds: 300);
  
  static const Duration winConfetti = Duration(milliseconds: 2000);
  static const Duration winGlow = Duration(milliseconds: 500);
  static const Duration winBounce = Duration(milliseconds: 600);
  
  static const Duration backgroundGradient = Duration(seconds: 10);
  static const Duration bubbleFloat = Duration(seconds: 8);
  
  // Curves
  static const Curve defaultCurve = Curves.easeInOut;
  static const Curve bounceCurve = Curves.elasticOut;
  static const Curve smoothCurve = Curves.fastOutSlowIn;
  static const Curve sharpCurve = Curves.easeOutCubic;
  static const Curve gentleCurve = Curves.easeInOutCubic;
  static const Curve springCurve = Curves.elasticInOut;
  
  // Specific Curves
  static const Curve pourCurve = Curves.easeInOutCubic;
  static const Curve selectCurve = Curves.easeOutBack;
  static const Curve pulseCurve = Curves.easeInOut;
  static const Curve scaleCurve = Curves.fastOutSlowIn;
}
