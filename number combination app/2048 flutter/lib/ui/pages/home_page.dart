/// Home page containing the game for Block Stack 2048.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/colors.dart';
import '../../core/audio_service.dart';
import '../../core/ad_service.dart';
import '../../game/game_state.dart';
import '../../game/app_state.dart';
import '../../rendering/game_canvas.dart';
import '../../input/gesture_controller.dart';
import '../score_widget.dart';
import '../top_bar.dart';

/// Home page with the main game
class HomePage extends StatefulWidget {
  const HomePage({super.key});
  
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
  bool _hasShownAdForCurrentGame = false;

  @override
  void initState() {
    super.initState();
    
    // Listen to app lifecycle changes
    WidgetsBinding.instance.addObserver(this);
    
    // Initialize Ads
    AdService().init();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final gameState = context.read<GameState>();
      final appState = context.read<AppState>();
      
      // Listen for Game Over to show ads
      gameState.addListener(_onGameStateChange);
      
      // Connect vibration setting to game state
      gameState.setVibrationEnabledChecker(() => appState.vibrationEnabled);
      
      // Start background music if enabled
      final audioService = AudioService();
      audioService.init(); // Initialize audio service (SFX pool, audio contexts)
      audioService.setMusicEnabled(appState.musicEnabled);
      audioService.setSfxEnabled(appState.sfxEnabled);
      if (appState.musicEnabled) {
        audioService.playMusic('sounds/music.mp3');
      }
      
      // Start game normally (tutorial is handled by splash screen now)
      if (gameState.phase == GamePhase.spawning && gameState.activeBlock == null) {
        gameState.startGame();
      }
    });
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    context.read<GameState>().removeListener(_onGameStateChange);
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final audioService = AudioService();
    
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      // App is minimized or going to background - pause music
      audioService.pauseMusic();
    } else if (state == AppLifecycleState.resumed) {
      // App is back in foreground - resume music if enabled
      final appState = context.read<AppState>();
      if (appState.musicEnabled) {
        audioService.resumeMusic();
      }
    }
  }
  
  void _onGameStateChange() {
    final gameState = context.read<GameState>();
    
    // Show ad on Game Over (once per game)
    if (gameState.phase == GamePhase.gameOver && !_hasShownAdForCurrentGame) {
      _hasShownAdForCurrentGame = true;
      AdService().showInterstitialAd();
    } else if (gameState.phase != GamePhase.gameOver) {
      // Reset flag when game restarts
      _hasShownAdForCurrentGame = false;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Consumer<GameState>(
        builder: (context, gameState, child) {
          return Stack(
            children: [
              Column(
                children: [
                  // Top bar with title and controls
                  const TopBar(),
                  
                  const SizedBox(height: 12),
                  
                  // Score display
                  const ScoreWidget(),
                  
                  const SizedBox(height: 20),
                  
                  // Game canvas with gesture handling
                  Expanded(
                    child: Center(
                      child: GestureController(
                        child: const GameCanvas(),
                      ),
                    ),
                  ),
                  
                  // Instructions
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      _getInstructionText(gameState.phase),
                      style: TextStyle(
                        color: getTextPrimaryTransparent(context),
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                ],
              ),
              
              // Game over overlay
              if (gameState.phase == GamePhase.gameOver)
                _GameOverOverlay(
                  score: gameState.score,
                  bestScore: gameState.bestScore,
                  onRestart: gameState.restart,
                ),
            ],
          );
        },
      ),
    );
  }
  
  String _getInstructionText(GamePhase phase) {
    switch (phase) {
      case GamePhase.playerInput:
        return 'Drag left/right to aim, release to shoot';
      case GamePhase.shooting:
      case GamePhase.snapping:
      case GamePhase.merging:
        return 'Placing block...';
      case GamePhase.gameOver:
        return 'Game Over!';
      default:
        return 'Get ready...';
    }
  }
}

/// Game over overlay
class _GameOverOverlay extends StatelessWidget {
  final int score;
  final int bestScore;
  final VoidCallback onRestart;
  
  const _GameOverOverlay({
    required this.score,
    required this.bestScore,
    required this.onRestart,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      color: kBlackTransparent,
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(32),
          margin: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: getBackgroundColor(context),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: getBlackShadow(context),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Game Over!',
                style: TextStyle(
                  color: getTextPrimaryColor(context),
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Score: $score',
                style: TextStyle(
                  color: getTextPrimaryColor(context),
                  fontSize: 24,
                ),
              ),
              if (score >= bestScore && score > 0)
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    '🎉 New Best! 🎉',
                    style: TextStyle(
                      color: Color(0xFFF67C5F),
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onRestart,
                style: ElevatedButton.styleFrom(
                  backgroundColor: getScoreBackgroundColor(context),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 4,
                ),
                child: const Text(
                  'Play Again',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
