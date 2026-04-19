import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Wrapper around flutter_secure_storage for managing sensitive data.
/// Uses Keychain on iOS and EncryptedSharedPreferences on Android.
class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Read a value from secure storage.
  static Future<String?> read(String key) async {
    return await _storage.read(key: key);
  }

  /// Write a value to secure storage.
  static Future<void> write(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  /// Delete a value from secure storage.
  static Future<void> delete(String key) async {
    await _storage.delete(key: key);
  }

  /// Clear all secure storage (used on sign out).
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  // Common keys
  static const String keyLastScanTimestamp = 'last_scan_timestamp';
  static const String keyUserPreferences = 'user_preferences';
}
