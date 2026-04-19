import 'package:flutter/material.dart';
import '../../data/models/theme_pack.dart';
import '../../state/settings_provider.dart';

/// Service to get current theme colors based on active theme
class ThemeService {
  static ThemeService? _instance;
  static ThemeService get instance => _instance ??= ThemeService._();
  ThemeService._();

  /// Get the active theme pack from settings
  static ThemePack getActiveTheme(SettingsProvider settings) {
    return ThemePack.getById(settings.activeThemeId) ?? ThemePack.allThemes.first;
  }

  /// Get liquid color by index from active theme
  static Color getLiquidColor(SettingsProvider settings, int colorIndex) {
    final theme = getActiveTheme(settings);
    return theme.liquidColors[colorIndex % theme.liquidColors.length];
  }

  /// Get tube color from active theme
  static Color getTubeColor(SettingsProvider settings) {
    return getActiveTheme(settings).tubeColor;
  }

  /// Get background gradient from active theme
  static LinearGradient getBackgroundGradient(SettingsProvider settings) {
    return getActiveTheme(settings).backgroundGradient;
  }

  /// Get accent color from active theme
  static Color getAccentColor(SettingsProvider settings) {
    return getActiveTheme(settings).accentColor;
  }

  /// Get primary color from active theme
  static Color getPrimaryColor(SettingsProvider settings) {
    return getActiveTheme(settings).primaryColor;
  }

  /// Get secondary color from active theme
  static Color getSecondaryColor(SettingsProvider settings) {
    return getActiveTheme(settings).secondaryColor;
  }
}
