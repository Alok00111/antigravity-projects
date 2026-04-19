import 'package:flutter/material.dart';
import '../../data/models/theme_pack.dart';

/// App Color Palette - Sophisticated & Professional Theme
class AppColors {
  // Prevent instantiation
  AppColors._();

  // Background Colors - Clean solid dark (iOS-inspired)
  static const Color backgroundDark = Color(0xFF000000);
  static const Color backgroundPrimary = Color(0xFF1C1C1E);
  static const Color backgroundSecondary = Color(0xFF2C2C2E);
  
  // Gradient Colors - Solid flat (no gradient)
  static const Color gradientStart = Color(0xFF1C1C1E);
  static const Color gradientMiddle = Color(0xFF1C1C1E);
  static const Color gradientEnd = Color(0xFF1C1C1E);
  
  // Glass Effect - Subtle frosted glass
  static const Color glassBase = Color(0x20FFFFFF);
  static const Color glassBorder = Color(0x40FFFFFF);
  static const Color glassHighlight = Color(0x15FFFFFF);
  
  // Text Colors - Refined whites and grays
  static const Color textPrimary = Color(0xFFF5F5F7);
  static const Color textSecondary = Color(0xFFB0B0B8);
  static const Color textMuted = Color(0xFF6E6E78);
  
  // Accent Colors - Clean blue (iOS system blue)
  static const Color accent = Color(0xFF0A84FF);
  static const Color accentSecondary = Color(0xFF5E5CE6);
  
  // Success/Error - Refined tones
  static const Color success = Color(0xFF7CB97C);
  static const Color error = Color(0xFFE25555);
  
  // Selection Glow - Clean blue glow
  static const Color selectionGlow = Color(0xFF0A84FF);
  
  // Liquid Colors (Default - used as fallback) - Muted, sophisticated palette
  static const Map<String, Color> liquidColors = {
    'cyan': Color(0xFF6BB8C9),
    'magenta': Color(0xFFCB6B9B),
    'lime': Color(0xFF8BC98B),
    'amber': Color(0xFFD4A574),
    'blue': Color(0xFF6B8BC9),
    'coral': Color(0xFFE07A5F),
    'purple': Color(0xFF9B7BC9),
    'pink': Color(0xFFD69BB5),
    'teal': Color(0xFF6BB8B8),
    'orange': Color(0xFFD4956B),
    'violet': Color(0xFF8B7BC9),
    'white': Color(0xFFD8D8D8),
  };
  
  // Color ID to index mapping (for theme color lookup)
  // Each colorId MUST map to a UNIQUE index to prevent duplicate colors in levels
  static const Map<String, int> colorIdToIndex = {
    'cyan': 0,
    'magenta': 1,
    'lime': 2,
    'amber': 3,
    'blue': 4,
    'coral': 5,
    'purple': 6,
    'pink': 7,
    'teal': 8,
    'orange': 9,
    'violet': 10,
    'white': 11,
  };
  
  // Get liquid color by ID (default theme - backwards compatible)
  static Color getLiquidColor(String colorId) {
    return liquidColors[colorId] ?? Colors.grey;
  }
  
  // Get liquid color from theme by ID
  static Color getLiquidColorFromTheme(String colorId, ThemePack theme) {
    final index = colorIdToIndex[colorId] ?? 0;
    return theme.liquidColors[index % theme.liquidColors.length];
  }
  
  // Background Gradient
  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [gradientStart, gradientMiddle, gradientEnd],
    stops: [0.0, 0.5, 1.0],
  );
  
  // Button Gradient - Solid blue (no gradient)
  static const LinearGradient buttonGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0A84FF), Color(0xFF0A84FF)],
  );
  
  // Glass Gradient for tubes
  static const LinearGradient glassGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      Color(0x1AFFFFFF),
      Color(0x33FFFFFF),
      Color(0x1AFFFFFF),
    ],
    stops: [0.0, 0.5, 1.0],
  );
}

