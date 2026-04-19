import 'package:flutter/material.dart';

/// Theme pack data model
class ThemePack {
  final String id;
  final String name;
  final String description;
  final int price;
  final Color primaryColor;
  final Color secondaryColor;
  final Color accentColor;
  final List<Color> liquidColors;
  final Color tubeColor;
  final LinearGradient backgroundGradient;
  final bool isDefault;
  final bool hasPremiumTubeDesign; // Premium themes have custom tube art
  final Color? tubeGlowColor; // Custom glow for premium tubes
  final Color? tubeRimColor; // Custom rim color for premium tubes
  final String? backgroundImageAsset; // Custom background image for premium themes
  final String? foregroundImageAsset; // Custom foreground image (e.g. dragon head)

  const ThemePack({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.liquidColors,
    required this.tubeColor,
    required this.backgroundGradient,
    this.isDefault = false,
    this.hasPremiumTubeDesign = false,
    this.tubeGlowColor,
    this.tubeRimColor,
    this.backgroundImageAsset,
    this.foregroundImageAsset,
  });



  /// All available theme packs
  static List<ThemePack> get allThemes => [
    // Default (Free) - Clean professional theme with solid background
    ThemePack(
      id: 'default',
      name: 'Classic',
      description: 'Clean & minimal',
      price: 0,
      isDefault: true,
      primaryColor: const Color(0xFF1C1C1E),
      secondaryColor: const Color(0xFF2C2C2E),
      accentColor: const Color(0xFF0A84FF),
      tubeColor: Colors.white.withValues(alpha: 0.10),
      liquidColors: [
        const Color(0xFFFF6B6B), // 0: Coral red
        const Color(0xFF4DABF7), // 1: Blue
        const Color(0xFF69DB7C), // 2: Green
        const Color(0xFFFFD43B), // 3: Yellow
        const Color(0xFF845EF7), // 4: Deep Purple
        const Color(0xFFFF922B), // 5: Orange
        const Color(0xFFE599F7), // 6: Light Pink
        const Color(0xFF20C997), // 7: Teal
        const Color(0xFFFF8787), // 8: Light Coral
        const Color(0xFF748FFC), // 9: Indigo
        const Color(0xFFFFEC99), // 10: Light Yellow
        const Color(0xFFE8E8E8), // 11: White/Silver
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF1C1C1E), Color(0xFF1C1C1E)], // Solid color (same start/end)
      ),
    ),

    // Ocean Theme
    ThemePack(
      id: 'ocean',
      name: 'Ocean Breeze',
      description: 'Cool ocean vibes',
      price: 2500,
      primaryColor: const Color(0xFF0A1628),
      secondaryColor: const Color(0xFF1A3A5C),
      accentColor: const Color(0xFF00CED1),
      tubeColor: Colors.cyan.withValues(alpha: 0.2),
      liquidColors: [
        const Color(0xFF003366), // 0: Navy blue
        const Color(0xFF00D4AA), // 1: Bright teal
        const Color(0xFF87CEEB), // 2: Sky blue
        const Color(0xFFFFD700), // 3: Golden sand
        const Color(0xFF2E8B57), // 4: Sea green
        const Color(0xFFFF6B6B), // 5: Coral
        const Color(0xFFE040FB), // 6: Magenta
        const Color(0xFF00897B), // 7: Dark teal
        const Color(0xFFFFAB91), // 8: Peach
        const Color(0xFF5C6BC0), // 9: Indigo
        const Color(0xFFAED581), // 10: Light green
        const Color(0xFFE0E0E0), // 11: Silver
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF0A1628), Color(0xFF1A3A5C), Color(0xFF0D2137)],
      ),
    ),

    // Sunset Theme
    ThemePack(
      id: 'sunset',
      name: 'Sunset Glow',
      description: 'Warm sunset colors',
      price: 2500,
      primaryColor: const Color(0xFF2D1B4E),
      secondaryColor: const Color(0xFF4A1942),
      accentColor: const Color(0xFFFF6B35),
      tubeColor: Colors.orange.withValues(alpha: 0.15),
      liquidColors: [
        const Color(0xFFFF4500), // 0: Bright orange
        const Color(0xFFFFD700), // 1: Gold
        const Color(0xFFE91E63), // 2: Magenta pink
        const Color(0xFF9C27B0), // 3: Purple
        const Color(0xFFFF8A65), // 4: Light coral
        const Color(0xFF00BCD4), // 5: Cyan contrast
        const Color(0xFF4CAF50), // 6: Green
        const Color(0xFF3F51B5), // 7: Blue
        const Color(0xFFFF1744), // 8: Red
        const Color(0xFF6D4C41), // 9: Brown
        const Color(0xFFE0E0E0), // 10: Silver
        const Color(0xFF7C4DFF), // 11: Violet
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF2D1B4E), Color(0xFF4A1942), Color(0xFF1A0A2E)],
      ),
    ),

    // Forest Theme
    ThemePack(
      id: 'forest',
      name: 'Enchanted Forest',
      description: 'Nature\'s palette',
      price: 2500,
      primaryColor: const Color(0xFF0B1A0B),
      secondaryColor: const Color(0xFF1A3A1A),
      accentColor: const Color(0xFF7CB342),
      tubeColor: Colors.green.withValues(alpha: 0.2),
      liquidColors: [
        const Color(0xFF2E7D32), // 0: Dark green
        const Color(0xFF8BC34A), // 1: Light green
        const Color(0xFF795548), // 2: Brown
        const Color(0xFFFFEB3B), // 3: Yellow
        const Color(0xFFE91E63), // 4: Pink flower
        const Color(0xFF03A9F4), // 5: Sky blue
        const Color(0xFFFF5722), // 6: Orange
        const Color(0xFF9C27B0), // 7: Purple
        const Color(0xFF00BCD4), // 8: Cyan
        const Color(0xFFCDDC39), // 9: Lime
        const Color(0xFFD32F2F), // 10: Red
        const Color(0xFFE0E0E0), // 11: White
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF0B1A0B), Color(0xFF1A3A1A), Color(0xFF0A140A)],
      ),
    ),

    // Galaxy Theme
    ThemePack(
      id: 'galaxy',
      name: 'Cosmic Galaxy',
      description: 'Journey through space',
      price: 3500,
      primaryColor: const Color(0xFF0D0221),
      secondaryColor: const Color(0xFF1A0A3E),
      accentColor: const Color(0xFFE040FB),
      tubeColor: Colors.purple.withValues(alpha: 0.2),
      liquidColors: [
        const Color(0xFFAA00FF), // 0: Bright purple
        const Color(0xFF00E5FF), // 1: Cyan
        const Color(0xFFFF4081), // 2: Hot pink
        const Color(0xFFFFD740), // 3: Star yellow
        const Color(0xFF00E676), // 4: Neon green
        const Color(0xFFFF5722), // 5: Deep orange
        const Color(0xFF2196F3), // 6: Blue
        const Color(0xFFE040FB), // 7: Magenta
        const Color(0xFFFFAB00), // 8: Amber
        const Color(0xFF00BFA5), // 9: Teal
        const Color(0xFFFF1744), // 10: Red
        const Color(0xFFE0E0E0), // 11: White
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF0D0221), Color(0xFF1A0A3E), Color(0xFF0A0118)],
      ),
    ),

    // Candy Theme
    ThemePack(
      id: 'candy',
      name: 'Candy Shop',
      description: 'Sweet and colorful',
      price: 3000,
      primaryColor: const Color(0xFF2D1F3D),
      secondaryColor: const Color(0xFF462255),
      accentColor: const Color(0xFFFF69B4),
      tubeColor: Colors.pink.withValues(alpha: 0.2),
      liquidColors: [
        const Color(0xFFFF69B4), // 0: Hot pink
        const Color(0xFF00CED1), // 1: Turquoise
        const Color(0xFFFFD700), // 2: Gold
        const Color(0xFF7CB342), // 3: Green
        const Color(0xFF9C27B0), // 4: Purple
        const Color(0xFFFF5722), // 5: Orange
        const Color(0xFF2196F3), // 6: Blue
        const Color(0xFFE91E63), // 7: Deep pink
        const Color(0xFFFFEB3B), // 8: Yellow
        const Color(0xFF00E676), // 9: Neon green
        const Color(0xFFFF1744), // 10: Red
        const Color(0xFFE0E0E0), // 11: White
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF2D1F3D), Color(0xFF462255), Color(0xFF1F1428)],
      ),
    ),

    // Neon Theme
    ThemePack(
      id: 'neon',
      name: 'Neon Nights',
      description: 'Electric glow',
      price: 4000,
      primaryColor: const Color(0xFF0A0A0A),
      secondaryColor: const Color(0xFF1A1A1A),
      accentColor: const Color(0xFF39FF14),
      tubeColor: const Color(0xFF39FF14).withValues(alpha: 0.15),
      liquidColors: [
        const Color(0xFF39FF14), // 0: Neon Green
        const Color(0xFFFF1493), // 1: Deep Pink
        const Color(0xFF00FFFF), // 2: Cyan
        const Color(0xFFFF4500), // 3: Orange Red
        const Color(0xFFFFFF00), // 4: Yellow
        const Color(0xFFFF00FF), // 5: Magenta
        const Color(0xFF0080FF), // 6: Electric Blue
        const Color(0xFFFF0000), // 7: Red
        const Color(0xFF00FF80), // 8: Spring Green
        const Color(0xFFFF6600), // 9: Bright Orange
        const Color(0xFF8000FF), // 10: Purple
        const Color(0xFFE0E0E0), // 11: White
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF0A0A0A), Color(0xFF1A1A1A), Color(0xFF050505)],
      ),
    ),

    // Arctic Theme
    ThemePack(
      id: 'arctic',
      name: 'Arctic Frost',
      description: 'Cool ice colors',
      price: 3500,
      primaryColor: const Color(0xFF1A2A3A),
      secondaryColor: const Color(0xFF2A3A4A),
      accentColor: const Color(0xFFB0E0E6),
      tubeColor: Colors.lightBlue.withValues(alpha: 0.2),
      liquidColors: [
        const Color(0xFFE3F2FD), // 0: Ice white
        const Color(0xFF2196F3), // 1: Blue
        const Color(0xFF00BCD4), // 2: Teal
        const Color(0xFF9C27B0), // 3: Purple
        const Color(0xFFFFEB3B), // 4: Yellow
        const Color(0xFFFF5722), // 5: Orange contrast
        const Color(0xFF4CAF50), // 6: Green
        const Color(0xFFE91E63), // 7: Pink
        const Color(0xFF3F51B5), // 8: Indigo
        const Color(0xFFFF9800), // 9: Amber
        const Color(0xFFD32F2F), // 10: Red
        const Color(0xFF607D8B), // 11: Blue Gray
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF1A2A3A), Color(0xFF2A3A4A), Color(0xFF0F1F2F)],
      ),
    ),

    // Volcano Theme
    ThemePack(
      id: 'volcano',
      name: 'Volcanic Fire',
      description: 'Hot and intense',
      price: 4000,
      primaryColor: const Color(0xFF1A0A0A),
      secondaryColor: const Color(0xFF2A1010),
      accentColor: const Color(0xFFFF4500),
      tubeColor: Colors.deepOrange.withValues(alpha: 0.2),
      liquidColors: [
        const Color(0xFFFF3D00), // 0: Bright red
        const Color(0xFFFFAB00), // 1: Amber
        const Color(0xFFFFEB3B), // 2: Yellow
        const Color(0xFF795548), // 3: Brown
        const Color(0xFF9E9E9E), // 4: Gray ash
        const Color(0xFF263238), // 5: Dark lava
        const Color(0xFFFF6D00), // 6: Deep orange
        const Color(0xFFE91E63), // 7: Pink
        const Color(0xFF00BCD4), // 8: Teal
        const Color(0xFF4CAF50), // 9: Green
        const Color(0xFF9C27B0), // 10: Purple
        const Color(0xFFE0E0E0), // 11: White
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.bottomCenter,
        end: Alignment.topCenter,
        colors: [Color(0xFF1A0A0A), Color(0xFF2A1010), Color(0xFF0A0505)],
      ),
    ),

    // Royal Theme
    ThemePack(
      id: 'royal',
      name: 'Royal Purple',
      description: 'Majestic elegance',
      price: 4500,
      primaryColor: const Color(0xFF1A0A2E),
      secondaryColor: const Color(0xFF2A1A4E),
      accentColor: const Color(0xFFFFD700),
      tubeColor: Colors.deepPurple.withValues(alpha: 0.2),
      liquidColors: [
        const Color(0xFF9400D3), // 0: Dark violet
        const Color(0xFFFFD700), // 1: Gold
        const Color(0xFF00BCD4), // 2: Teal
        const Color(0xFFE91E63), // 3: Pink
        const Color(0xFF4CAF50), // 4: Green
        const Color(0xFFFF5722), // 5: Orange
        const Color(0xFF2196F3), // 6: Blue
        const Color(0xFFFF9800), // 7: Amber
        const Color(0xFFD32F2F), // 8: Red
        const Color(0xFF00E676), // 9: Neon green
        const Color(0xFF3F51B5), // 10: Indigo
        const Color(0xFFE0E0E0), // 11: Silver
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF1A0A2E), Color(0xFF2A1A4E), Color(0xFF0F051E)],
      ),
    ),

    // Retro Theme
    ThemePack(
      id: 'retro',
      name: 'Retro Wave',
      description: '80s vibes',
      price: 5000,
      primaryColor: const Color(0xFF2B0548),
      secondaryColor: const Color(0xFF470B6F),
      accentColor: const Color(0xFF00FFFF),
      tubeColor: const Color(0xFFFF00FF).withValues(alpha: 0.15),
      liquidColors: [
        const Color(0xFFFF00FF), // 0: Magenta
        const Color(0xFF00FFFF), // 1: Cyan
        const Color(0xFFFF1493), // 2: Deep Pink
        const Color(0xFF7B68EE), // 3: Medium Slate Blue
        const Color(0xFFFFD700), // 4: Gold
        const Color(0xFF00FF7F), // 5: Spring Green
        const Color(0xFFFF4500), // 6: Orange Red
        const Color(0xFF4169E1), // 7: Royal Blue
        const Color(0xFFFF6347), // 8: Tomato
        const Color(0xFF9400D3), // 9: Dark Violet
        const Color(0xFF32CD32), // 10: Lime Green
        const Color(0xFFE0E0E0), // 11: Silver
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF2B0548), Color(0xFF470B6F), Color(0xFF1A0230)],
      ),
    ),

    // Mint Theme
    ThemePack(
      id: 'mint',
      name: 'Fresh Mint',
      description: 'Cool and refreshing',
      price: 2500,
      primaryColor: const Color(0xFF0A1F1A),
      secondaryColor: const Color(0xFF1A3A30),
      accentColor: const Color(0xFF98FF98),
      tubeColor: Colors.teal.withValues(alpha: 0.2),
      liquidColors: [
        const Color(0xFF98FF98), // 0: Pale Green
        const Color(0xFF20B2AA), // 1: Light Sea Green
        const Color(0xFF66CDAA), // 2: Medium Aquamarine
        const Color(0xFF00FA9A), // 3: Medium Spring Green
        const Color(0xFF3CB371), // 4: Medium Sea Green
        const Color(0xFF2E8B57), // 5: Sea Green
        const Color(0xFFFF69B4), // 6: Hot Pink
        const Color(0xFFFFD700), // 7: Gold
        const Color(0xFF9C27B0), // 8: Purple
        const Color(0xFFFF5722), // 9: Deep Orange
        const Color(0xFF2196F3), // 10: Blue
        const Color(0xFFE0E0E0), // 11: White
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF0A1F1A), Color(0xFF1A3A30), Color(0xFF051510)],
      ),
    ),

    // ============ PREMIUM THEMES (10,000 coins) ============
    
    // Aurora Borealis - Premium Theme with Custom Tubes
    ThemePack(
      id: 'aurora',
      name: '✨ Aurora Borealis',
      description: 'Northern lights magic',
      price: 10000,
      hasPremiumTubeDesign: true,
      tubeGlowColor: const Color(0xFF00FF88),
      tubeRimColor: const Color(0xFFFFD700),
      primaryColor: const Color(0xFF0A0A1A),
      secondaryColor: const Color(0xFF1A1A3A),
      accentColor: const Color(0xFF00FF88),
      tubeColor: const Color(0xFF00FF88).withValues(alpha: 0.25),
      liquidColors: [
        const Color(0xFF00FF88), // 0: Aurora Green
        const Color(0xFF00BFFF), // 1: Deep Sky Blue
        const Color(0xFFFF69B4), // 2: Hot Pink
        const Color(0xFF9400D3), // 3: Dark Violet
        const Color(0xFF00CED1), // 4: Dark Turquoise
        const Color(0xFFFFD700), // 5: Gold
        const Color(0xFF00FFFF), // 6: Cyan
        const Color(0xFFFF00FF), // 7: Magenta
        const Color(0xFFFF4500), // 8: Orange Red
        const Color(0xFF7CFC00), // 9: Lawn Green
        const Color(0xFF4169E1), // 10: Royal Blue
        const Color(0xFFE0E0E0), // 11: White
      ],
      backgroundGradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Color(0xFF0A0A1A), 
          Color(0xFF0D1B2A), 
          Color(0xFF1A3A3A), 
          Color(0xFF0A1A2A),
        ],
        stops: [0.0, 0.3, 0.6, 1.0],
      ),
    ),

    // Dragon's Lair - Premium Theme with Custom Tubes
    // Dragon's Lair - Premium Theme with Custom Tubes

  ];

  /// Get theme by ID
  static ThemePack? getById(String id) {
    try {
      return allThemes.firstWhere((theme) => theme.id == id);
    } catch (_) {
      return allThemes.first; // Return default
    }
  }
}
