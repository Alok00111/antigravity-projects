import 'package:audioplayers/audioplayers.dart';
import 'package:vibration/vibration.dart';
import 'package:flutter/services.dart';

/// Sound and haptic feedback manager
/// Sound and haptic feedback manager
class SoundManager {
  static final SoundManager _instance = SoundManager._internal();
  factory SoundManager() => _instance;
  SoundManager._internal();
  
  final AudioPlayer _effectPlayer = AudioPlayer();
  final AudioPlayer _musicPlayer = AudioPlayer();
  
  bool _soundEnabled = true;
  bool _hapticsEnabled = true;
  bool _musicEnabled = true;
  
  // Haptic state tracking for pour animation
  int _lastDripIndex = -1;
  bool _hasTriggeredLift = false;
  bool _hasTriggeredImpact = false;
  
  /// Initialize the sound manager
  Future<void> init() async {
    // Preload sounds for low latency
    await _effectPlayer.setReleaseMode(ReleaseMode.stop);
    
    // Configure music player for looping
    await _musicPlayer.setReleaseMode(ReleaseMode.loop);
    
    // Start music if enabled
    if (_musicEnabled) {
      playBackgroundMusic();
    }
  }
  
  /// Set sound enabled state
  void setSoundEnabled(bool enabled) {
    _soundEnabled = enabled;
  }
  
  /// Set haptics enabled state
  void setHapticsEnabled(bool enabled) {
    _hapticsEnabled = enabled;
  }
  
  /// Set music enabled state
  void setMusicEnabled(bool enabled) {
    _musicEnabled = enabled;
    if (enabled) {
      playBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }
  
  /// Getters
  bool get soundEnabled => _soundEnabled;
  bool get hapticsEnabled => _hapticsEnabled;
  bool get musicEnabled => _musicEnabled;
  
  /// Play background music
  Future<void> playBackgroundMusic() async {
    if (!_musicEnabled) return;
    if (_musicPlayer.state == PlayerState.playing) return;
    
    try {
      await _musicPlayer.setVolume(0.3); // Lower volume for background
      await _musicPlayer.play(AssetSource('sounds/bg_music.mp3'));
    } catch (e) {
      print('Error playing music: $e');
    }
  }
  
  /// Stop background music
  Future<void> stopBackgroundMusic() async {
    await _musicPlayer.stop();
  }
  
  /// Play select sound
  Future<void> playSelect() async {
    if (!_soundEnabled) return;
    try {
      if (_effectPlayer.state == PlayerState.playing) await _effectPlayer.stop();
      await _effectPlayer.play(AssetSource('sounds/select.mp3'), volume: 0.5);
    } catch (e) { print('Error playing select: $e'); }
  }
  
  /// Play pour sound
  Future<void> playPour() async {
    if (!_soundEnabled) return;
    try {
      await _effectPlayer.stop();
      await _effectPlayer.play(AssetSource('sounds/pour.mp3'));
    } catch (e) { print('Error playing pour: $e'); }
  }
  
  /// Play win sound
  Future<void> playWin() async {
    if (!_soundEnabled) return;
    try {
      await _effectPlayer.stop();
      await _effectPlayer.play(AssetSource('sounds/win.mp3'));
    } catch (e) { print('Error playing win: $e'); }
  }
  
  /// Play click sound
  Future<void> playClick() async {
    if (!_soundEnabled) return;
    // Reuse select or use a specific click
    await playSelect(); 
  }
  
  /// Play error sound
  Future<void> playError() async {
    if (!_soundEnabled) return;
    try {
      await _effectPlayer.stop();
      await _effectPlayer.play(AssetSource('sounds/error.mp3'), volume: 0.6);
    } catch (e) { print('Error playing error: $e'); }
  }
  
  // HAPTIC METHODS (Unchanged logic, just simplified helper)
  
  /// Reset pour haptic state (call when pour starts)
  void resetPourHaptics() {
    _lastDripIndex = -1;
    _hasTriggeredLift = false;
    _hasTriggeredImpact = false;
  }
  
  /// Trigger phase-based haptic during pour animation
  Future<void> triggerPourPhaseHaptic(double progress, {int liquidCount = 1}) async {
    if (!_hapticsEnabled) return;
    
    // Phase 1: Lift (0.0 - 0.1)
    if (progress >= 0.0 && progress < 0.1 && !_hasTriggeredLift) {
      _hasTriggeredLift = true;
      await _triggerLiftHaptic();
      return;
    }
    
    // Phase 2: Move (0.1 - 0.4)
    if (progress >= 0.1 && progress < 0.4) {
      if (progress < 0.15 && _lastDripIndex < 0) {
        _lastDripIndex = 0;
        await _triggerMoveHaptic();
      }
      return;
    }
    
    // Phase 3: Pour (0.4 - 0.9)
    if (progress >= 0.4 && progress < 0.9) {
      final pourProgress = (progress - 0.4) / 0.5;
      final dripCount = (liquidCount * 3).clamp(3, 8);
      final currentDripIndex = (pourProgress * dripCount).floor();
      
      if (currentDripIndex > _lastDripIndex && currentDripIndex < dripCount) {
        _lastDripIndex = currentDripIndex;
        await _triggerDripHaptic(currentDripIndex, dripCount);
      }
      return;
    }
    
    // Phase 4: Impact (0.9 - 1.0)
    if (progress >= 0.9 && !_hasTriggeredImpact) {
      _hasTriggeredImpact = true;
      await _triggerImpactHaptic();
      return;
    }
  }
  
  Future<void> _triggerLiftHaptic() async { await HapticFeedback.mediumImpact(); }
  Future<void> _triggerMoveHaptic() async { await HapticFeedback.selectionClick(); }
  
  Future<void> _triggerDripHaptic(int dripIndex, int totalDrips) async {
    final normalizedPos = dripIndex / totalDrips;
    int intensity;
    if (normalizedPos < 0.3) intensity = 15 + (normalizedPos * 50).round();
    else if (normalizedPos < 0.7) intensity = 30;
    else intensity = 30 - ((normalizedPos - 0.7) * 60).round();
    
    intensity = intensity.clamp(10, 40);
    
    final hasAmplitude = await Vibration.hasAmplitudeControl();
    if (hasAmplitude == true) {
      await Vibration.vibrate(duration: 20, amplitude: (intensity * 6.4).round().clamp(1, 255));
    } else {
      await Vibration.vibrate(duration: intensity);
    }
  }
  
  Future<void> _triggerImpactHaptic() async {
    await HapticFeedback.heavyImpact();
    await Future.delayed(const Duration(milliseconds: 50));
    await HapticFeedback.lightImpact();
  }
  
  /// Trigger haptic feedback
  Future<void> triggerHaptic(HapticType type) async {
    if (!_hapticsEnabled) return;
    final hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator != true) return;
    
    switch (type) {
      case HapticType.light: await HapticFeedback.lightImpact(); break;
      case HapticType.medium: await HapticFeedback.mediumImpact(); break;
      case HapticType.heavy: await HapticFeedback.heavyImpact(); break;
      case HapticType.success:
        await HapticFeedback.lightImpact();
        await Future.delayed(const Duration(milliseconds: 80));
        await HapticFeedback.lightImpact();
        await Future.delayed(const Duration(milliseconds: 80));
        await HapticFeedback.heavyImpact();
        break;
      case HapticType.error: await Vibration.vibrate(pattern: [0, 80, 40, 80]); break;
      case HapticType.selection: await HapticFeedback.selectionClick(); break;
    }
  }
  
  void dispose() {
    _effectPlayer.dispose();
    _musicPlayer.dispose();
  }
}

/// Types of haptic feedback
enum HapticType {
  light,
  medium,
  heavy,
  success,
  error,
  selection,
}

