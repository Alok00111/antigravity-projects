/// Game screen for Block Stack 2048.
/// Main game interface composing all UI elements.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/colors.dart';
import '../game/game_state.dart';
import '../rendering/game_canvas.dart';
import '../input/gesture_controller.dart';
import 'score_widget.dart';
import 'top_bar.dart';

/// Main game screen
class GameScreen extends StatefulWidget {
  const GameScreen({super.key});
  
  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  @override
  void initState() {
    super.initState();
    // Start the game after the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GameState>().startGame();
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackgroundColor,
      body: SafeArea(
        child: Consumer<GameState>(
          builder: (context, gameState, child) {
            return Column(
              children: [
                // Top bar with title and controls
                const TopBar(),
                
                const SizedBox(height: 16),
                
                // Score display
                const ScoreWidget(),
                
                const SizedBox(height: 24),
                
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
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    _getInstructionText(gameState.phase),
                    style: const TextStyle(
                      color: kTextPrimaryTransparent,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
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
            color: kBackgroundColor,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Game Over!',
                style: TextStyle(
                  color: kTextPrimaryColor,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Score: $score',
                style: const TextStyle(
                  color: kTextPrimaryColor,
                  fontSize: 24,
                ),
              ),
              if (score >= bestScore)
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
                  backgroundColor: kScoreBackgroundColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
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
