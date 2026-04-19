import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Tracks daily scan streaks and stats using local storage.
class StreakService {
  static const _storage = FlutterSecureStorage();
  static const _lastScanDateKey = 'last_scan_date';
  static const _streakKey = 'scan_streak';
  static const _totalScansKey = 'total_scans';
  static const _bestStreakKey = 'best_streak';

  /// Call this after each scan to update streak.
  static Future<void> recordScan() async {
    final now = DateTime.now();
    final todayStr = _dateToString(now);
    final lastDateStr = await _storage.read(key: _lastScanDateKey);

    int currentStreak = int.tryParse(
          await _storage.read(key: _streakKey) ?? '0',
        ) ??
        0;
    int totalScans = int.tryParse(
          await _storage.read(key: _totalScansKey) ?? '0',
        ) ??
        0;
    int bestStreak = int.tryParse(
          await _storage.read(key: _bestStreakKey) ?? '0',
        ) ??
        0;

    // Increment total scans
    totalScans++;

    if (lastDateStr == todayStr) {
      // Already scanned today — just increment total, streak stays
    } else if (lastDateStr != null) {
      final lastDate = _stringToDate(lastDateStr);
      final diff = now.difference(lastDate).inDays;

      if (diff == 1) {
        // Consecutive day — extend streak
        currentStreak++;
      } else if (diff > 1) {
        // Streak broken
        currentStreak = 1;
      }
    } else {
      // First ever scan
      currentStreak = 1;
    }

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    await _storage.write(key: _lastScanDateKey, value: todayStr);
    await _storage.write(key: _streakKey, value: '$currentStreak');
    await _storage.write(key: _totalScansKey, value: '$totalScans');
    await _storage.write(key: _bestStreakKey, value: '$bestStreak');
  }

  /// Get current streak info.
  static Future<StreakData> getStreakData() async {
    final streak = int.tryParse(
          await _storage.read(key: _streakKey) ?? '0',
        ) ??
        0;
    final totalScans = int.tryParse(
          await _storage.read(key: _totalScansKey) ?? '0',
        ) ??
        0;
    final bestStreak = int.tryParse(
          await _storage.read(key: _bestStreakKey) ?? '0',
        ) ??
        0;
    final lastDateStr = await _storage.read(key: _lastScanDateKey);

    // Check if scanned today
    bool scannedToday = false;
    if (lastDateStr != null) {
      scannedToday = lastDateStr == _dateToString(DateTime.now());
    }

    return StreakData(
      currentStreak: streak,
      totalScans: totalScans,
      bestStreak: bestStreak,
      scannedToday: scannedToday,
    );
  }

  static String _dateToString(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  static DateTime _stringToDate(String s) {
    final parts = s.split('-');
    return DateTime(
      int.parse(parts[0]),
      int.parse(parts[1]),
      int.parse(parts[2]),
    );
  }
}

class StreakData {
  final int currentStreak;
  final int totalScans;
  final int bestStreak;
  final bool scannedToday;

  const StreakData({
    required this.currentStreak,
    required this.totalScans,
    required this.bestStreak,
    required this.scannedToday,
  });
}
