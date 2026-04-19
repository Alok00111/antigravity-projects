/// Color palette for Block Stack 2048.
/// Soft, warm colors mapped to block values.
library;

import 'package:flutter/material.dart';
import 'block_themes.dart';

/// Light theme background colors
const Color kBackgroundColor = Color(0xFFFAF8F5);
const Color kGridBackgroundColor = Color(0xFFBBADA0);
const Color kEmptyCellColor = Color(0xFFCDC1B4);

/// Dark theme background colors
const Color kBackgroundColorDark = Color(0xFF1A1A1A);
const Color kGridBackgroundColorDark = Color(0xFF3C3A32);
const Color kEmptyCellColorDark = Color(0xFF4A4842);

/// Light theme UI colors
const Color kTextPrimaryColor = Color(0xFF776E65);
const Color kTextLightColor = Color(0xFFF9F6F2);
const Color kScoreBackgroundColor = Color(0xFFBBADA0);
const Color kValidationColor = Color(0xFF66BB6A); // Green for success/tutorial

/// Dark theme UI colors
const Color kTextPrimaryColorDark = Color(0xFFE0E0E0);
const Color kScoreBackgroundColorDark = Color(0xFF5C5448);

/// Theme-aware color getters
Color getBackgroundColor(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark 
      ? kBackgroundColorDark 
      : kBackgroundColor;
}

Color getGridBackgroundColor(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark 
      ? kGridBackgroundColorDark 
      : kGridBackgroundColor;
}

Color getEmptyCellColor(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark 
      ? kEmptyCellColorDark 
      : kEmptyCellColor;
}

Color getTextPrimaryColor(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark 
      ? kTextPrimaryColorDark 
      : kTextPrimaryColor;
}

Color getScoreBackgroundColor(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark 
      ? kScoreBackgroundColorDark 
      : kScoreBackgroundColor;
}

Color getTextPrimaryTransparent(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark 
      ? const Color(0xB3E0E0E0)  // ~70% opacity light text
      : const Color(0xB3776E65); // ~70% opacity dark text
}

Color getBlackShadow(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark 
      ? const Color(0x33FFFFFF)  // Light shadow for dark mode
      : const Color(0x33000000); // Dark shadow for light mode
}

/// Block colors mapped to values (powers of 2)
/// Using a warm, harmonious palette
const Map<int, Color> kBlockColors = {
  2: Color(0xFFEEE4DA),      // Soft beige
  4: Color(0xFFEDE0C8),      // Light tan
  8: Color(0xFFF2B179),      // Coral orange
  16: Color(0xFFF59563),     // Warm orange
  32: Color(0xFFF67C5F),     // Salmon
  64: Color(0xFFF65E3B),     // Bright coral
  128: Color(0xFFEDCF72),    // Golden yellow
  256: Color(0xFFEDCC61),    // Amber
  512: Color(0xFFEDC850),    // Rich gold
  1024: Color(0xFFEDC53F),   // Deep gold
  2048: Color(0xFFEDC22E),   // Brilliant gold
  4096: Color(0xFF3C3A32),   // Dark slate
  8192: Color(0xFF3C3A32),   // Dark slate
  16384: Color(0xFF3C3A32),  // Dark slate
  32768: Color(0xFF3C3A32),  // Dark slate
  65536: Color(0xFF3C3A32),  // Dark slate
  131072: Color(0xFF3C3A32), // Dark slate
};

/// Block text colors - dark text for light blocks, light text for dark blocks
const Map<int, Color> kBlockTextColors = {
  2: Color(0xFF776E65),
  4: Color(0xFF776E65),
  8: Color(0xFFF9F6F2),
  16: Color(0xFFF9F6F2),
  32: Color(0xFFF9F6F2),
  64: Color(0xFFF9F6F2),
  128: Color(0xFFF9F6F2),
  256: Color(0xFFF9F6F2),
  512: Color(0xFFF9F6F2),
  1024: Color(0xFFF9F6F2),
  2048: Color(0xFFF9F6F2),
  4096: Color(0xFFF9F6F2),
  8192: Color(0xFFF9F6F2),
  16384: Color(0xFFF9F6F2),
  32768: Color(0xFFF9F6F2),
  65536: Color(0xFFF9F6F2),
  131072: Color(0xFFF9F6F2),
};

/// Get block color for a value, with fallback
/// If themeId is provided, uses that theme's colors
Color getBlockColor(int value, {String? themeId}) {
  if (themeId != null) {
    return getThemedBlockColor(themeId, value);
  }
  return kBlockColors[value] ?? const Color(0xFF3C3A32);
}

/// Get text color for a block value
/// If themeId is provided, uses that theme's colors
Color getBlockTextColor(int value, {String? themeId}) {
  if (themeId != null) {
    return getThemedTextColor(themeId, value);
  }
  return kBlockTextColors[value] ?? const Color(0xFFF9F6F2);
}

/// Create a color with specified opacity (avoiding deprecated withOpacity)
Color withOpacitySafe(Color color, double opacity) {
  return color.withValues(alpha: opacity);
}

/// Pre-computed semi-transparent colors to avoid deprecated API (for legacy compatibility)
const Color kTextPrimaryTransparent = Color(0xB3776E65); // ~70% opacity
const Color kBlackTransparent = Color(0xB3000000);       // ~70% opacity
const Color kBlackShadow = Color(0x33000000);            // ~20% opacity
