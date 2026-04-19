import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  static const String _highScoreKey = 'high_score';
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  Future<double> getHighScore() async {
    if (_prefs == null) await init();
    return _prefs?.getDouble(_highScoreKey) ?? 0.0;
  }

  Future<void> setHighScore(double score) async {
    if (_prefs == null) await init();
    await _prefs?.setDouble(_highScoreKey, score);
  }

  Future<bool> checkAndUpdateHighScore(double score) async {
    final currentHigh = await getHighScore();
    if (score > currentHigh) {
      await setHighScore(score);
      return true;
    }
    return false;
  }
}
