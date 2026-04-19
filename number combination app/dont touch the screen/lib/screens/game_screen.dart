import 'package:flutter/material.dart';
import 'package:vibration/vibration.dart';
import 'dart:async';
import '../services/distraction_service.dart';
import '../services/sound_service.dart';
import '../widgets/distraction_widget.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with TickerProviderStateMixin {
  static const int totalSeconds = 60;
  late Timer _timer;
  double _remainingTime = totalSeconds.toDouble();
  bool _gameStarted = false;
  bool _gameEnded = false;

  // Distraction system
  final DistractionService _distractionService = DistractionService();
  final SoundService _soundService = SoundService();
  Distraction? _currentDistraction;
  Timer? _distractionTimer;

  // Subtle visual elements
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    
    // Subtle pulse animation for visual feedback
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 0.3, end: 0.6).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    
    _startGame();
    _setupDistractions();
  }

  void _setupDistractions() {
    _distractionService.onDistraction = (distraction) {
      if (!mounted || _gameEnded) return;
      
      // Play appropriate sound
      _playDistractionSound(distraction);
      
      setState(() {
        _currentDistraction = distraction;
      });

      // Auto-dismiss distraction after its duration
      _distractionTimer?.cancel();
      _distractionTimer = Timer(distraction.displayDuration, () {
        if (mounted && !_gameEnded) {
          // Stop call sound if it was a call
          if (_currentDistraction?.type == DistractionType.call) {
            _soundService.stopCallSound();
          }
          setState(() {
            _currentDistraction = null;
          });
        }
      });
    };
    _distractionService.start();
  }

  void _playDistractionSound(Distraction distraction) {
    if (!distraction.hasSound) return;
    
    switch (distraction.type) {
      case DistractionType.call:
        _soundService.playCallSound();
        // Also vibrate for calls
        Vibration.hasVibrator().then((has) {
          if (has == true) {
            Vibration.vibrate(pattern: [0, 500, 200, 500, 200, 500]);
          }
        });
        break;
      case DistractionType.message:
        _soundService.playMessageSound();
        break;
      case DistractionType.alarm:
        _soundService.playCallSound();
        break;
      default:
        _soundService.playNotificationSound();
    }
  }

  void _startGame() {
    _gameStarted = true;
    _timer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _remainingTime -= 0.1;
        if (_remainingTime <= 0) {
          _remainingTime = 0;
          _winGame();
        }
      });
    });
  }

  void _winGame() {
    if (_gameEnded) return;
    _gameEnded = true;
    _timer.cancel();
    _distractionService.stop();
    _soundService.stopCallSound();
    _distractionTimer?.cancel();
    Navigator.pushReplacementNamed(context, '/win');
  }

  void _failGame() {
    if (_gameEnded) return;
    _gameEnded = true;
    _timer.cancel();
    _distractionService.stop();
    _soundService.stopCallSound();
    _distractionTimer?.cancel();
    
    // Vibrate on fail
    Vibration.hasVibrator().then((hasVibrator) {
      if (hasVibrator == true) {
        Vibration.vibrate(duration: 300);
      }
    });

    final timeSurvived = totalSeconds - _remainingTime;
    Navigator.pushReplacementNamed(
      context,
      '/fail',
      arguments: timeSurvived,
    );
  }

  @override
  void dispose() {
    if (_gameStarted) {
      _timer.cancel();
    }
    _pulseController.dispose();
    _distractionService.stop();
    _soundService.stopCallSound();
    _distractionTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GestureDetector(
        onTapDown: (_) => _failGame(),
        onPanStart: (_) => _failGame(),
        behavior: HitTestBehavior.opaque,
        child: Stack(
          children: [
            // Main game area - mostly empty, no timer visible
            Container(
              width: double.infinity,
              height: double.infinity,
              color: Colors.black,
              child: Center(
                child: AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, child) {
                    return Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withOpacity(_pulseAnimation.value),
                          width: 1,
                        ),
                      ),
                      child: Center(
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(_pulseAnimation.value + 0.2),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            // Distractions overlay
            if (_currentDistraction != null)
              DistractionWidget(
                distraction: _currentDistraction!,
                onDismiss: () {
                  if (_currentDistraction?.type == DistractionType.call) {
                    _soundService.stopCallSound();
                  }
                  setState(() {
                    _currentDistraction = null;
                  });
                },
              ),
          ],
        ),
      ),
    );
  }
}
