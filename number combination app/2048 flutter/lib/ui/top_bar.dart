/// Top bar for Block Stack 2048.
/// Contains title and action buttons.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/colors.dart';
import '../game/game_state.dart';

/// Top bar with game title and controls
class TopBar extends StatelessWidget {
  const TopBar({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Consumer<GameState>(
      builder: (context, gameState, child) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Game title
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '2048',
                    style: TextStyle(
                      color: getTextPrimaryColor(context),
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Block Stack',
                    style: TextStyle(
                      color: getTextPrimaryColor(context),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              
              // Action buttons
              Row(
                children: [
                  _ActionButton(
                    icon: Icons.refresh,
                    onPressed: gameState.restart,
                    tooltip: 'New Game',
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Action button with icon
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final String tooltip;
  final Color? color;
  
  const _ActionButton({
    required this.icon,
    required this.onPressed,
    required this.tooltip,
    this.color,
  });
  
  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: color ?? getScoreBackgroundColor(context),
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.all(12),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }
}
