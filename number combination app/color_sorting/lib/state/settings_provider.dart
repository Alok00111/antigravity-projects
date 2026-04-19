import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/utils/sound_manager.dart';
import '../core/services/ad_manager.dart';
import '../data/models/theme_pack.dart';

/// Settings provider for app preferences
class SettingsProvider extends ChangeNotifier {
  static const String _soundKey = 'sound_enabled';
  static const String _hapticsKey = 'haptics_enabled';
  static const String _unlockedLevelsKey = 'unlocked_levels';
  static const String _highestLevelKey = 'highest_level';
  static const String _tutorialCompletedKey = 'tutorial_completed';
  static const String _coinsKey = 'coins';
  static const String _hintsKey = 'hints';
  static const String _adFreeKey = 'ad_free';
  static const String _ownedThemesKey = 'owned_themes';
  static const String _activeThemeKey = 'active_theme';
  static const String _levelStarsPrefix = 'level_stars_'; // Prefix for per-level stars
  static const String _ownedEffectsKey = 'owned_effects';
  static const String _activeEffectKey = 'active_effect';
  
  SharedPreferences? _prefs;
  final SoundManager _soundManager = SoundManager();
  final AdManager _adManager = AdManager();
  
  bool _soundEnabled = true;
  bool _hapticsEnabled = true;
  int _unlockedLevels = 1;
  int _highestLevel = 0;
  bool _isTutorialCompleted = false;
  bool _isInitialized = false;
  
  // Economy State
  int _coins = 0;
  int _hints = 3; // Start with 3 free hints
  bool _isAdFree = false;
  
  // Theme State
  List<String> _ownedThemes = ['default']; // Default theme always owned
  String _activeThemeId = 'default';
  
  // Victory Effects State
  List<String> _ownedEffects = ['effect_confetti'];
  String _activeEffectId = 'effect_confetti';
  
  // Star Ratings (per level)
  final Map<int, int> _levelStars = {}; // levelId -> stars (0-3)
  
  // Getters
  bool get soundEnabled => _soundEnabled;
  bool get hapticsEnabled => _hapticsEnabled;
  int get unlockedLevels => _unlockedLevels;
  int get highestLevel => _highestLevel;
  bool get isTutorialCompleted => _isTutorialCompleted;
  bool get isInitialized => _isInitialized;
  
  // Economy Getters
  int get coins => _coins;
  int get hints => _hints;
  bool get isAdFree => _isAdFree;
  
  // Theme Getters
  List<String> get ownedThemes => _ownedThemes;
  String get activeThemeId => _activeThemeId;
  
  // Effect Getters
  List<String> get ownedEffects => _ownedEffects;
  String get activeEffectId => _activeEffectId;
  
  // Star Rating Getters
  /// Get stars earned for a specific level (0-3)
  int getLevelStars(int levelId) => _levelStars[levelId] ?? 0;
  
  /// Get total stars earned across all levels
  int getTotalStars() => _levelStars.values.fold(0, (sum, stars) => sum + stars);
  
  /// Initialize settings from shared preferences
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    
    _soundEnabled = _prefs?.getBool(_soundKey) ?? true;
    _hapticsEnabled = _prefs?.getBool(_hapticsKey) ?? true;
    _unlockedLevels = _prefs?.getInt(_unlockedLevelsKey) ?? 1;
    _highestLevel = _prefs?.getInt(_highestLevelKey) ?? 0;
    _isTutorialCompleted = _prefs?.getBool(_tutorialCompletedKey) ?? false;
    
    // Economy
    _coins = _prefs?.getInt(_coinsKey) ?? 0;
    _hints = _prefs?.getInt(_hintsKey) ?? 3;
    _isAdFree = _prefs?.getBool(_adFreeKey) ?? false;
    
    // Themes
    _ownedThemes = _prefs?.getStringList(_ownedThemesKey) ?? ['default'];
    _activeThemeId = _prefs?.getString(_activeThemeKey) ?? 'default';
    
    // Effects
    _ownedEffects = _prefs?.getStringList(_ownedEffectsKey) ?? ['effect_confetti'];
    _activeEffectId = _prefs?.getString(_activeEffectKey) ?? 'effect_confetti';
    
    // Load star ratings for completed levels
    _levelStars.clear();
    for (int i = 1; i <= _highestLevel; i++) {
      final stars = _prefs?.getInt('$_levelStarsPrefix$i') ?? 0;
      if (stars > 0) _levelStars[i] = stars;
    }
    
    // Sync with sound manager
    _soundManager.setSoundEnabled(_soundEnabled);
    _soundManager.setHapticsEnabled(_hapticsEnabled);
    
    // Sync ad-free status with ad manager
    _adManager.setAdFree(_isAdFree);
    
    _isInitialized = true;
    notifyListeners();
  }
  
  /// Toggle sound on/off
  Future<void> toggleSound() async {
    _soundEnabled = !_soundEnabled;
    await _prefs?.setBool(_soundKey, _soundEnabled);
    _soundManager.setSoundEnabled(_soundEnabled);
    notifyListeners();
  }
  
  /// Toggle haptics on/off
  Future<void> toggleHaptics() async {
    _hapticsEnabled = !_hapticsEnabled;
    await _prefs?.setBool(_hapticsKey, _hapticsEnabled);
    _soundManager.setHapticsEnabled(_hapticsEnabled);
    notifyListeners();
  }
  
  /// Unlock a level
  Future<void> unlockLevel(int levelId) async {
    if (levelId > _unlockedLevels) {
      _unlockedLevels = levelId;
      await _prefs?.setInt(_unlockedLevelsKey, _unlockedLevels);
      notifyListeners();
    }
  }
  
  /// Update highest completed level, save stars, and award coins
  Future<void> completeLevel(int levelId, {int moves = 0, int optimalMoves = 0, int stars = 1}) async {
    if (levelId > _highestLevel) {
      _highestLevel = levelId;
      await _prefs?.setInt(_highestLevelKey, _highestLevel);
    }
    
    // Save star rating (only if better than existing)
    final existingStars = _levelStars[levelId] ?? 0;
    if (stars > existingStars) {
      _levelStars[levelId] = stars;
      await _prefs?.setInt('$_levelStarsPrefix$levelId', stars);
    }
    
    // Award coins based on level difficulty
    int coinReward = 10;
    if (levelId > 50) coinReward = 15;
    if (levelId > 100) coinReward = 20;
    
    // Bonus for optimal moves
    if (optimalMoves > 0 && moves <= optimalMoves) {
      coinReward += 5;
    }
    
    // Bonus for 3-star completion
    if (stars == 3) {
      coinReward += 5;
    }
    
    await addCoins(coinReward);
    
    // Unlock next level
    await unlockLevel(levelId + 1);
  }

  /// Mark tutorial as completed
  Future<void> completeTutorial() async {
    _isTutorialCompleted = true;
    await _prefs?.setBool(_tutorialCompletedKey, true);
    notifyListeners();
  }
  
  /// Check if a level is unlocked
  bool isLevelUnlocked(int levelId) {
    // 1. Must be reached linearly
    if (levelId > _unlockedLevels) return false;
    
    // 2. Must verify Chapter Requirements (Gate)
    if (isLevelLockedByChapter(levelId)) return false;
    
    return true;
  }
  
  // ============ CHAPTER SYSTEM ============
  
  static const int _chapterSize = 100;
  static const int _requiredThreeStars = 95; // 95% of 100 levels
  
  /// Check if level is locked by Chapter Gate
  /// Returns true if locked (user hasn't completed enough 3-stars in previous chapter)
  bool isLevelLockedByChapter(int levelId) {
    if (levelId <= _chapterSize) return false; // Chapter 1 always open
    
    // Calculate which chapter this level belongs to (0-indexed)
    // Level 1-100 = Ch 0. Level 101-200 = Ch 1.
    final int currentChapterIdx = (levelId - 1) ~/ _chapterSize;
    
    // Check previous chapter credentials
    final int prevChapterIdx = currentChapterIdx - 1;
    final progress = getChapterProgress(prevChapterIdx);
    
    return progress.current < progress.required;
  }
  
  /// Get progress for a specific chapter gate
  /// Returns (current 3-star count, required count)
  ({int current, int required}) getChapterProgress(int chapterIndex) {
    final startLevel = (chapterIndex * _chapterSize) + 1;
    final endLevel = (chapterIndex + 1) * _chapterSize;
    
    int threeStarCount = 0;
    
    for (int i = startLevel; i <= endLevel; i++) {
        if (getLevelStars(i) == 3) {
            threeStarCount++;
        }
    }
    
    return (current: threeStarCount, required: _requiredThreeStars);
  }
  
  /// Reset all progress
  Future<void> resetProgress() async {
    _unlockedLevels = 1;
    _highestLevel = 0;
    await _prefs?.setInt(_unlockedLevelsKey, _unlockedLevels);
    await _prefs?.setInt(_highestLevelKey, _highestLevel);
    notifyListeners();
  }
  
  // ============ ECONOMY METHODS ============
  
  /// Add coins
  Future<void> addCoins(int amount) async {
    _coins += amount;
    await _prefs?.setInt(_coinsKey, _coins);
    notifyListeners();
  }
  
  /// Spend coins (returns true if successful)
  Future<bool> spendCoins(int amount) async {
    if (_coins < amount) return false;
    _coins -= amount;
    await _prefs?.setInt(_coinsKey, _coins);
    notifyListeners();
    return true;
  }
  
  /// Add hints
  Future<void> addHints(int amount) async {
    _hints += amount;
    await _prefs?.setInt(_hintsKey, _hints);
    notifyListeners();
  }
  
  /// Use a hint (returns true if successful)
  Future<bool> useHint() async {
    if (_hints <= 0) return false;
    _hints--;
    await _prefs?.setInt(_hintsKey, _hints);
    notifyListeners();
    return true;
  }
  
  /// Set ad-free status (from IAP purchase)
  Future<void> setAdFree(bool value) async {
    _isAdFree = value;
    await _prefs?.setBool(_adFreeKey, value);
    _adManager.setAdFree(value);
    notifyListeners();
  }
  
  /// Buy hints with coins (10 hints for 150 coins)
  Future<bool> buyHintsWithCoins({int hintCount = 10, int coinCost = 150}) async {
    if (await spendCoins(coinCost)) {
      await addHints(hintCount);
      return true;
    }
    return false;
  }
  
  // ============ THEME METHODS ============
  
  /// Check if a theme is owned
  bool isThemeOwned(String themeId) {
    return _ownedThemes.contains(themeId);
  }
  
  /// Purchase a theme (returns true if successful)
  Future<bool> purchaseTheme(String themeId, int price) async {
    if (isThemeOwned(themeId)) return true; // Already owned
    
    if (await spendCoins(price)) {
      _ownedThemes.add(themeId);
      await _prefs?.setStringList(_ownedThemesKey, _ownedThemes);
      
      // Auto-activate purchased theme
      await setActiveTheme(themeId);
      
      return true;
    }
    return false;
  }
  
  /// Set active theme
  Future<void> setActiveTheme(String themeId) async {
    if (!isThemeOwned(themeId)) return;
    
    _activeThemeId = themeId;
    await _prefs?.setString(_activeThemeKey, themeId);
    notifyListeners();
  }

  /// Debug: Unlock all themes
  Future<void> unlockAllThemes() async {
    for (final theme in ThemePack.allThemes) {
      if (!_ownedThemes.contains(theme.id)) {
        _ownedThemes.add(theme.id);
      }
    }
    await _prefs?.setStringList(_ownedThemesKey, _ownedThemes);
    notifyListeners();
  }
  // ============ EFFECT METHODS ============
  
  /// Check if effect is owned
  bool isEffectOwned(String effectId) {
    return _ownedEffects.contains(effectId);
  }
  
  /// Purchase an effect
  Future<bool> purchaseEffect(String effectId, int price) async {
    if (isEffectOwned(effectId)) return true;
    
    if (await spendCoins(price)) {
      _ownedEffects.add(effectId);
      await _prefs?.setStringList(_ownedEffectsKey, _ownedEffects);
      await setActiveEffect(effectId);
      return true;
    }
    return false;
  }
  
  /// Set active effect
  Future<void> setActiveEffect(String effectId) async {
    if (!isEffectOwned(effectId)) return;
    
    _activeEffectId = effectId;
    await _prefs?.setString(_activeEffectKey, effectId);
    notifyListeners();
  }
}
