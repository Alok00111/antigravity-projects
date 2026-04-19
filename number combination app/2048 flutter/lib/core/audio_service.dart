/// Audio service for Block Stack 2048.
/// Uses just_audio for gapless music looping and audioplayers for SFX.
library;

import 'dart:async';
import 'package:just_audio/just_audio.dart' as just_audio;
import 'package:audioplayers/audioplayers.dart';

class AudioService {
  static final AudioService _instance = AudioService._();
  factory AudioService() => _instance;
  AudioService._();

  // Music player using just_audio for gapless looping
  final just_audio.AudioPlayer _musicPlayer = just_audio.AudioPlayer();
  
  // Pool of SFX players using audioplayers (works well for short sounds)
  final List<AudioPlayer> _sfxPool = [];
  static const int _sfxPoolSize = 6;
  int _nextSfxPlayer = 0;
  bool _isInitialized = false;

  // Volume/enabled controls
  bool _musicEnabled = true;
  bool _sfxEnabled = true;
  double _musicVolume = 0.3;
  double _sfxVolume = 1.0;

  // Idle timer for resuming music
  Timer? _idleTimer;
  static const Duration _idleTimeout = Duration(seconds: 20);
  bool _isMusicPausedForGameplay = false;
  String? _currentMusicPath;

  // Getters
  bool get musicEnabled => _musicEnabled;
  bool get sfxEnabled => _sfxEnabled;
  double get musicVolume => _musicVolume;
  double get sfxVolume => _sfxVolume;

  /// Initialize audio service
  Future<void> init() async {
    if (_isInitialized) return;
    _isInitialized = true;
    
    // Setup music player volume
    await _musicPlayer.setVolume(_musicVolume);
    
    // Initialize SFX player pool
    for (int i = 0; i < _sfxPoolSize; i++) {
      final player = AudioPlayer();
      await player.setVolume(_sfxVolume);
      _sfxPool.add(player);
    }
  }

  /// Toggle music on/off
  void setMusicEnabled(bool enabled) {
    _musicEnabled = enabled;
    if (!enabled) {
      _musicPlayer.pause();
      _cancelIdleTimer();
    }
  }

  /// Toggle SFX on/off
  void setSfxEnabled(bool enabled) {
    _sfxEnabled = enabled;
    // If SFX was just disabled and music was paused for gameplay, resume it
    if (!enabled && _isMusicPausedForGameplay && _musicEnabled) {
      _musicPlayer.play();
      _isMusicPausedForGameplay = false;
      _cancelIdleTimer();
    }
  }

  /// Set music volume (0.0 to 1.0)
  Future<void> setMusicVolume(double volume) async {
    _musicVolume = volume.clamp(0.0, 1.0);
    await _musicPlayer.setVolume(_musicVolume);
  }

  /// Set SFX volume (0.0 to 1.0)
  Future<void> setSfxVolume(double volume) async {
    _sfxVolume = volume.clamp(0.0, 1.0);
    for (final player in _sfxPool) {
      await player.setVolume(_sfxVolume);
    }
  }

  /// Play background music with gapless looping
  Future<void> playMusic(String assetPath) async {
    if (!_musicEnabled) return;
    _currentMusicPath = assetPath;
    try {
      // Set loop mode BEFORE loading for true gapless looping
      await _musicPlayer.setLoopMode(just_audio.LoopMode.one);
      await _musicPlayer.setAsset('assets/$assetPath');
      await _musicPlayer.play();
      _isMusicPausedForGameplay = false;
    } catch (e) {
      // Silently fail if audio file not found
    }
  }

  /// Stop background music
  Future<void> stopMusic() async {
    _cancelIdleTimer();
    await _musicPlayer.stop();
    _isMusicPausedForGameplay = false;
  }

  /// Pause background music
  Future<void> pauseMusic() async {
    _cancelIdleTimer();
    await _musicPlayer.pause();
  }

  /// Resume background music
  Future<void> resumeMusic() async {
    if (_musicEnabled) {
      await _musicPlayer.play();
      _isMusicPausedForGameplay = false;
    }
  }

  /// Called when user starts gameplay action (shooting)
  /// Pauses music and starts idle timer (only if SFX is enabled)
  void onGameplayAction() {
    if (!_musicEnabled) return;
    
    // Only pause music if SFX is enabled
    // When SFX is disabled, music plays continuously
    if (!_sfxEnabled) return;
    
    // Pause music when user is actively playing
    if (!_isMusicPausedForGameplay) {
      _musicPlayer.pause();
      _isMusicPausedForGameplay = true;
    }
    
    // Reset idle timer - music will resume after 20 seconds of inactivity
    _resetIdleTimer();
  }
  
  /// Called when user switches away from game tab
  /// Immediately resumes music
  void onLeaveGameTab() {
    _cancelIdleTimer();
    if (_musicEnabled && _isMusicPausedForGameplay) {
      _musicPlayer.play();
      _isMusicPausedForGameplay = false;
    }
  }
  
  /// Called when user returns to game tab
  void onEnterGameTab() {
    if (_isMusicPausedForGameplay) {
      _resetIdleTimer();
    }
  }
  
  void _resetIdleTimer() {
    _cancelIdleTimer();
    _idleTimer = Timer(_idleTimeout, () {
      if (_musicEnabled && _isMusicPausedForGameplay) {
        _musicPlayer.play();
        _isMusicPausedForGameplay = false;
      }
    });
  }
  
  void _cancelIdleTimer() {
    _idleTimer?.cancel();
    _idleTimer = null;
  }

  /// Play a sound effect using rotating player pool
  Future<void> playSfx(String assetPath) async {
    if (!_sfxEnabled) return;
    
    // Lazy initialization if needed
    if (_sfxPool.isEmpty) {
      for (int i = 0; i < _sfxPoolSize; i++) {
        final player = AudioPlayer();
        await player.setVolume(_sfxVolume);
        _sfxPool.add(player);
      }
    }
    
    try {
      final player = _sfxPool[_nextSfxPlayer];
      _nextSfxPlayer = (_nextSfxPlayer + 1) % _sfxPool.length;
      await player.play(AssetSource(assetPath));
    } catch (e) {
      // Silently fail if audio file not found
    }
  }

  /// Play merge sound effect
  Future<void> playMerge() async {
    await playSfx('sounds/merge.mp3');
  }

  /// Play block shoot sound effect
  Future<void> playShoot() async {
    await playSfx('sounds/shoot.mp3');
  }

  /// Play block land/place sound effect
  Future<void> playPlace() async {
    await playSfx('sounds/place.mp3');
  }

  /// Play game over sound
  Future<void> playGameOver() async {
    await playSfx('sounds/gameover.mp3');
  }

  /// Dispose resources
  Future<void> dispose() async {
    _cancelIdleTimer();
    await _musicPlayer.dispose();
    for (final player in _sfxPool) {
      await player.dispose();
    }
    _sfxPool.clear();
  }
}
