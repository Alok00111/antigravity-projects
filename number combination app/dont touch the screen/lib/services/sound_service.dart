import 'package:audioplayers/audioplayers.dart';
import 'package:vibration/vibration.dart';

class SoundService {
  static final SoundService _instance = SoundService._internal();
  factory SoundService() => _instance;
  SoundService._internal();

  final AudioPlayer _notificationPlayer = AudioPlayer();
  final AudioPlayer _callPlayer = AudioPlayer();
  
  bool _isCallPlaying = false;

  // iPhone notification sound from bundled asset
  Future<void> playNotificationSound() async {
    try {
      await _notificationPlayer.stop();
      await _notificationPlayer.play(
        AssetSource('sounds/iphone_notification.mp3'),
        volume: 1.0,
      );
    } catch (e) {
      print('Notification sound error: $e');
    }
  }

  // iPhone ringtone from bundled asset
  Future<void> playCallSound() async {
    if (_isCallPlaying) return;
    
    try {
      _isCallPlaying = true;
      await _callPlayer.stop();
      await _callPlayer.setReleaseMode(ReleaseMode.loop);
      await _callPlayer.play(
        AssetSource('sounds/iphone_ringtone.mp3'),
        volume: 1.0,
      );
      
      // Also vibrate in phone call pattern
      Vibration.hasVibrator().then((has) {
        if (has == true) {
          Vibration.vibrate(pattern: [0, 1000, 500, 1000, 500, 1000], repeat: 0);
        }
      });
    } catch (e) {
      print('Call sound error: $e');
      _isCallPlaying = false;
    }
  }

  Future<void> stopCallSound() async {
    _isCallPlaying = false;
    try {
      await _callPlayer.stop();
      Vibration.cancel();
    } catch (e) {
      print('Stop call sound error: $e');
    }
  }

  // Message notification sound
  Future<void> playMessageSound() async {
    try {
      await _notificationPlayer.stop();
      await _notificationPlayer.play(
        AssetSource('sounds/iphone_notification.mp3'),
        volume: 1.0,
      );
    } catch (e) {
      print('Message sound error: $e');
    }
  }

  void dispose() {
    _notificationPlayer.dispose();
    _callPlayer.dispose();
  }
}
