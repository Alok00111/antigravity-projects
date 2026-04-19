/// Score widget for Block Stack 2048.
/// Displays current and best scores.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/colors.dart';
import '../game/game_state.dart';

/// Score display widget
class ScoreWidget extends StatelessWidget {
  const ScoreWidget({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Consumer<GameState>(
      builder: (context, gameState, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _ScoreBox(
              label: 'SCORE',
              value: gameState.score,
            ),
            const SizedBox(width: 12),
            _ScoreBox(
              label: 'BEST',
              value: gameState.bestScore,
            ),
          ],
        );
      },
    );
  }
}

/// Individual score box
class _ScoreBox extends StatelessWidget {
  final String label;
  final int value;
  
  const _ScoreBox({
    required this.label,
    required this.value,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: getScoreBackgroundColor(context),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: kTextLightColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 4),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 150),
            transitionBuilder: (child, animation) {
              return ScaleTransition(
                scale: animation,
                child: child,
              );
            },
            child: Text(
              value.toString(),
              key: ValueKey(value),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
