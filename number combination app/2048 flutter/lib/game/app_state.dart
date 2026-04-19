/// App state for Block Stack 2048.
/// Manages settings, player stats, and currency.
library;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// App-wide state for settings and player data
class AppState extends ChangeNotifier {
  SharedPreferences? _prefs;
  
  // Settings
  bool _soundEnabled = true;
  bool _musicEnabled = true;
  bool _sfxEnabled = true;
  bool _vibrationEnabled = true;
  ThemeMode _themeMode = ThemeMode.light;
  
  // Tutorial
  bool _hasCompletedTutorial = false;
  
  // Player stats
  int _gamesPlayed = 0;
  int _totalMerges = 0;
  int _highestBlock = 2;
  int _totalScore = 0;
  
  // Currency
  int _coins = 0;
  
  // Themes
  String _activeThemeId = 'classic';
  Set<String> _purchasedThemes = {'classic'}; // Classic is always owned
  
  // High scores list
  List<int> _highScores = [];
  
  // Getters
  bool get soundEnabled => _soundEnabled;
  bool get musicEnabled => _musicEnabled;
  bool get sfxEnabled => _sfxEnabled;
  bool get vibrationEnabled => _vibrationEnabled;
  ThemeMode get themeMode => _themeMode;
  bool get hasCompletedTutorial => _hasCompletedTutorial;
  
  int get gamesPlayed => _gamesPlayed;
  int get totalMerges => _totalMerges;
  int get highestBlock => _highestBlock;
  int get totalScore => _totalScore;
  int get coins => _coins;
  String get activeThemeId => _activeThemeId;
  Set<String> get purchasedThemes => Set.unmodifiable(_purchasedThemes);
  List<int> get highScores => List.unmodifiable(_highScores);
  
  AppState() {
    _loadData();
  }
  
  Future<void> _loadData() async {
    _prefs = await SharedPreferences.getInstance();
    
    // Load settings
    _soundEnabled = _prefs?.getBool('soundEnabled') ?? true;
    _musicEnabled = _prefs?.getBool('musicEnabled') ?? true;
    _sfxEnabled = _prefs?.getBool('sfxEnabled') ?? true;
    _vibrationEnabled = _prefs?.getBool('vibrationEnabled') ?? true;
    final themeModeIndex = _prefs?.getInt('themeMode') ?? 0;
    _themeMode = ThemeMode.values[themeModeIndex];
    
    // Load tutorial status
    _hasCompletedTutorial = _prefs?.getBool('tutorialCompleted') ?? false;
    
    // Load stats
    _gamesPlayed = _prefs?.getInt('gamesPlayed') ?? 0;
    _totalMerges = _prefs?.getInt('totalMerges') ?? 0;
    _highestBlock = _prefs?.getInt('highestBlock') ?? 2;
    _totalScore = _prefs?.getInt('totalScore') ?? 0;
    _coins = _prefs?.getInt('coins') ?? 0;
    
    // Load themes
    _activeThemeId = _prefs?.getString('activeThemeId') ?? 'classic';
    final purchasedList = _prefs?.getStringList('purchasedThemes') ?? ['classic'];
    _purchasedThemes = purchasedList.toSet();
    // Ensure classic is always owned
    _purchasedThemes.add('classic');
    
    // Load high scores
    final scoresJson = _prefs?.getStringList('highScores') ?? [];
    _highScores = scoresJson.map((s) => int.parse(s)).toList();
    
    notifyListeners();
  }
  
  // Settings setters
  void setSoundEnabled(bool value) {
    _soundEnabled = value;
    _prefs?.setBool('soundEnabled', value);
    notifyListeners();
  }
  
  void setMusicEnabled(bool value) {
    _musicEnabled = value;
    _prefs?.setBool('musicEnabled', value);
    notifyListeners();
  }
  
  void setSfxEnabled(bool value) {
    _sfxEnabled = value;
    _prefs?.setBool('sfxEnabled', value);
    notifyListeners();
  }
  
  void setVibrationEnabled(bool value) {
    _vibrationEnabled = value;
    _prefs?.setBool('vibrationEnabled', value);
    notifyListeners();
  }
  
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    _prefs?.setInt('themeMode', mode.index);
    notifyListeners();
  }
  
  void completeTutorial() {
    _hasCompletedTutorial = true;
    _prefs?.setBool('tutorialCompleted', true);
    notifyListeners();
  }
  
  // Stat tracking
  void recordGamePlayed() {
    _gamesPlayed++;
    _prefs?.setInt('gamesPlayed', _gamesPlayed);
    notifyListeners();
  }
  
  void recordMerge(int blockValue, int scoreEarned) {
    _totalMerges++;
    _totalScore += scoreEarned;
    
    if (blockValue > _highestBlock) {
      _highestBlock = blockValue;
      _prefs?.setInt('highestBlock', _highestBlock);
    }
    
    // Award coins for merges
    final coinsEarned = (scoreEarned / 10).floor();
    _coins += coinsEarned;
    
    _prefs?.setInt('totalMerges', _totalMerges);
    _prefs?.setInt('totalScore', _totalScore);
    _prefs?.setInt('coins', _coins);
    
    notifyListeners();
  }
  
  void recordHighScore(int score) {
    _highScores.add(score);
    _highScores.sort((a, b) => b.compareTo(a)); // Descending
    if (_highScores.length > 10) {
      _highScores = _highScores.sublist(0, 10);
    }
    _prefs?.setStringList('highScores', _highScores.map((s) => s.toString()).toList());
    notifyListeners();
  }
  
  // Currency management
  void addCoins(int amount) {
    _coins += amount;
    _prefs?.setInt('coins', _coins);
    notifyListeners();
  }
  
  bool spendCoins(int amount) {
    if (_coins >= amount) {
      _coins -= amount;
      _prefs?.setInt('coins', _coins);
      notifyListeners();
      return true;
    }
    return false;
  }
  
  // Theme management
  bool isThemeOwned(String themeId) {
    return _purchasedThemes.contains(themeId);
  }
  
  bool purchaseTheme(String themeId, int price) {
    if (_purchasedThemes.contains(themeId)) {
      return true; // Already owned
    }
    
    if (spendCoins(price)) {
      _purchasedThemes.add(themeId);
      _prefs?.setStringList('purchasedThemes', _purchasedThemes.toList());
      notifyListeners();
      return true;
    }
    return false; // Not enough coins
  }
  
  void setActiveTheme(String themeId) {
    if (_purchasedThemes.contains(themeId)) {
      _activeThemeId = themeId;
      _prefs?.setString('activeThemeId', themeId);
      notifyListeners();
    }
  }
  
  // Reset all progress
  Future<void> resetProgress() async {
    _gamesPlayed = 0;
    _totalMerges = 0;
    _highestBlock = 2;
    _totalScore = 0;
    _coins = 0;
    _highScores = [];
    // Reset themes to default but keep classic
    _activeThemeId = 'classic';
    _purchasedThemes = {'classic'};
    
    // We DON'T reset tutorial status on general reset
    
    await _prefs?.remove('gamesPlayed');
    await _prefs?.remove('totalMerges');
    await _prefs?.remove('highestBlock');
    await _prefs?.remove('totalScore');
    await _prefs?.remove('coins');
    await _prefs?.remove('highScores');
    await _prefs?.remove('bestScore');
    await _prefs?.remove('activeThemeId');
    await _prefs?.remove('purchasedThemes');
    
    notifyListeners();
  }
}
