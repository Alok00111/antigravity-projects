/// Leaderboard page for Block Stack 2048.
library;

import 'package:flutter/material.dart';
import '../../core/colors.dart';

/// Leaderboard page - Coming Soon
class LeaderboardPage extends StatelessWidget {
  const LeaderboardPage({super.key});
  
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Leaderboard',
                style: TextStyle(
                  color: getTextPrimaryColor(context),
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          
          // Coming Soon content
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.emoji_events_outlined,
                    size: 80,
                    color: getTextPrimaryTransparent(context),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Coming Soon',
                    style: TextStyle(
                      color: getTextPrimaryColor(context),
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Leaderboard feature is under development.\nStay tuned for updates!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: getTextPrimaryTransparent(context),
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
