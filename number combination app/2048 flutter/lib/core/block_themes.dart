/// Block color themes for Block Stack 2048.
/// Defines purchasable themes with their block color palettes.
library;

import 'package:flutter/material.dart';

/// Represents a purchasable block color theme
class BlockTheme {
  final String id;
  final String name;
  final int price; // 0 = free/default
  final String description;
  final Map<int, Color> blockColors;
  final Map<int, Color> textColors;
  final List<Color> previewColors; // 4 colors for shop preview

  const BlockTheme({
    required this.id,
    required this.name,
    required this.price,
    required this.description,
    required this.blockColors,
    required this.textColors,
    required this.previewColors,
  });
}

/// Dark text for light blocks
const Color _darkText = Color(0xFF776E65);
/// Light text for dark blocks
const Color _lightText = Color(0xFFF9F6F2);

/// All available themes
const List<BlockTheme> availableThemes = [
  // Classic - the original warm palette (FREE)
  BlockTheme(
    id: 'classic',
    name: 'Classic',
    price: 0,
    description: 'The original warm palette',
    blockColors: {
      2: Color(0xFFEEE4DA),
      4: Color(0xFFEDE0C8),
      8: Color(0xFFF2B179),
      16: Color(0xFFF59563),
      32: Color(0xFFF67C5F),
      64: Color(0xFFF65E3B),
      128: Color(0xFFEDCF72),
      256: Color(0xFFEDCC61),
      512: Color(0xFFEDC850),
      1024: Color(0xFFEDC53F),
      2048: Color(0xFFEDC22E),
      4096: Color(0xFF3C3A32),
      8192: Color(0xFF3C3A32),
    },
    textColors: {
      2: _darkText, 4: _darkText,
      8: _lightText, 16: _lightText, 32: _lightText, 64: _lightText,
      128: _lightText, 256: _lightText, 512: _lightText,
      1024: _lightText, 2048: _lightText, 4096: _lightText, 8192: _lightText,
    },
    previewColors: [Color(0xFFEEE4DA), Color(0xFFF2B179), Color(0xFFF67C5F), Color(0xFFEDC22E)],
  ),

  // Neon - bright cyberpunk colors
  BlockTheme(
    id: 'neon',
    name: 'Neon',
    price: 200,
    description: 'Bright cyberpunk vibes',
    blockColors: {
      2: Color(0xFF2D2D44),
      4: Color(0xFF3D3D5C),
      8: Color(0xFF00FFFF),    // Cyan
      16: Color(0xFF00FF88),   // Neon green
      32: Color(0xFFFF00FF),   // Magenta
      64: Color(0xFFFF0080),   // Hot pink
      128: Color(0xFFFFFF00),  // Yellow
      256: Color(0xFFFF8800),  // Orange
      512: Color(0xFF00FF00),  // Lime
      1024: Color(0xFF8800FF), // Purple
      2048: Color(0xFFFFFFFF), // White
      4096: Color(0xFF1A1A2E),
      8192: Color(0xFF1A1A2E),
    },
    textColors: {
      2: _lightText, 4: _lightText,
      8: _darkText, 16: _darkText, 32: _lightText, 64: _lightText,
      128: _darkText, 256: _darkText, 512: _darkText,
      1024: _lightText, 2048: _darkText, 4096: _lightText, 8192: _lightText,
    },
    previewColors: [Color(0xFF00FFFF), Color(0xFFFF00FF), Color(0xFF00FF00), Color(0xFFFFFF00)],
  ),

  // Ocean - calming blue/teal tones
  BlockTheme(
    id: 'ocean',
    name: 'Ocean',
    price: 150,
    description: 'Calming sea waves',
    blockColors: {
      2: Color(0xFFE0F4F4),
      4: Color(0xFFB8E6E6),
      8: Color(0xFF7DD3D3),
      16: Color(0xFF4ECDC4),
      32: Color(0xFF3DBEB6),
      64: Color(0xFF2CA9A0),
      128: Color(0xFF1E8F87),
      256: Color(0xFF15706A),
      512: Color(0xFF0D5550),
      1024: Color(0xFF064541),
      2048: Color(0xFF003333),
      4096: Color(0xFF001A1A),
      8192: Color(0xFF001A1A),
    },
    textColors: {
      2: _darkText, 4: _darkText, 8: _darkText,
      16: _lightText, 32: _lightText, 64: _lightText,
      128: _lightText, 256: _lightText, 512: _lightText,
      1024: _lightText, 2048: _lightText, 4096: _lightText, 8192: _lightText,
    },
    previewColors: [Color(0xFFB8E6E6), Color(0xFF4ECDC4), Color(0xFF1E8F87), Color(0xFF003333)],
  ),

  // Forest - earthy green/brown
  BlockTheme(
    id: 'forest',
    name: 'Forest',
    price: 150,
    description: 'Natural earth tones',
    blockColors: {
      2: Color(0xFFF5F0E6),
      4: Color(0xFFE8DFC9),
      8: Color(0xFFC9B896),
      16: Color(0xFF8FBC8F),   // Dark sea green
      32: Color(0xFF6B8E6B),
      64: Color(0xFF4A7C4A),
      128: Color(0xFF3D6B3D),
      256: Color(0xFF2E5A2E),
      512: Color(0xFF8B4513),   // Saddle brown
      1024: Color(0xFF6B3E0A),
      2048: Color(0xFF4A2800),
      4096: Color(0xFF2D1800),
      8192: Color(0xFF2D1800),
    },
    textColors: {
      2: _darkText, 4: _darkText, 8: _darkText,
      16: _lightText, 32: _lightText, 64: _lightText,
      128: _lightText, 256: _lightText, 512: _lightText,
      1024: _lightText, 2048: _lightText, 4096: _lightText, 8192: _lightText,
    },
    previewColors: [Color(0xFFC9B896), Color(0xFF6B8E6B), Color(0xFF3D6B3D), Color(0xFF8B4513)],
  ),

  // Candy - sweet pastels
  BlockTheme(
    id: 'candy',
    name: 'Candy',
    price: 250,
    description: 'Sweet pastel treats',
    blockColors: {
      2: Color(0xFFFFF0F5),   // Lavender blush
      4: Color(0xFFFFE4EC),
      8: Color(0xFFFFB6C1),   // Light pink
      16: Color(0xFFFF69B4),  // Hot pink
      32: Color(0xFFDA70D6),  // Orchid
      64: Color(0xFFBA55D3),  // Medium orchid
      128: Color(0xFF9370DB), // Medium purple
      256: Color(0xFF8A2BE2), // Blue violet
      512: Color(0xFF7B68EE), // Medium slate blue
      1024: Color(0xFF6A5ACD), // Slate blue
      2048: Color(0xFF483D8B), // Dark slate blue
      4096: Color(0xFF2E1A47),
      8192: Color(0xFF2E1A47),
    },
    textColors: {
      2: _darkText, 4: _darkText, 8: _darkText,
      16: _lightText, 32: _lightText, 64: _lightText,
      128: _lightText, 256: _lightText, 512: _lightText,
      1024: _lightText, 2048: _lightText, 4096: _lightText, 8192: _lightText,
    },
    previewColors: [Color(0xFFFFB6C1), Color(0xFFFF69B4), Color(0xFF9370DB), Color(0xFF483D8B)],
  ),
];

/// Get a theme by ID
BlockTheme getThemeById(String id) {
  return availableThemes.firstWhere(
    (t) => t.id == id,
    orElse: () => availableThemes.first, // Fallback to classic
  );
}

/// Get block color for a specific theme and value
Color getThemedBlockColor(String themeId, int value) {
  final theme = getThemeById(themeId);
  return theme.blockColors[value] ?? const Color(0xFF3C3A32);
}

/// Get text color for a specific theme and value
Color getThemedTextColor(String themeId, int value) {
  final theme = getThemeById(themeId);
  return theme.textColors[value] ?? _lightText;
}
