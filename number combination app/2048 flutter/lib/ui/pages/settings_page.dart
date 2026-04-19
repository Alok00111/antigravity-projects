/// Settings page for Block Stack 2048.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/colors.dart';
import '../../core/audio_service.dart';
import '../../game/app_state.dart';
import '../../game/game_state.dart';

/// Settings page with app preferences
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});
  
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Consumer<AppState>(
        builder: (context, appState, child) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header
              Text(
                'Settings',
                style: TextStyle(
                  color: getTextPrimaryColor(context),
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Sound & Vibration section
              _SectionHeader(title: 'Sound & Haptics'),
              const SizedBox(height: 12),
              _SettingsTile(
                icon: Icons.music_note_rounded,
                title: 'Background Music',
                subtitle: 'Play music during gameplay',
                trailing: Switch.adaptive(
                  value: appState.musicEnabled,
                  onChanged: (value) {
                    appState.setMusicEnabled(value);
                    final audio = AudioService();
                    audio.setMusicEnabled(value);
                    if (value) {
                      // Resume or restart music when enabled
                      audio.playMusic('sounds/music.mp3');
                    } else {
                      audio.stopMusic();
                    }
                  },
                  activeTrackColor: getScoreBackgroundColor(context),
                ),
              ),
              _SettingsTile(
                icon: Icons.volume_up_rounded,
                title: 'Sound Effects',
                subtitle: 'Play sounds for actions',
                trailing: Switch.adaptive(
                  value: appState.sfxEnabled,
                  onChanged: (value) {
                    appState.setSfxEnabled(value);
                    AudioService().setSfxEnabled(value);
                  },
                  activeTrackColor: getScoreBackgroundColor(context),
                ),
              ),
              _SettingsTile(
                icon: Icons.vibration_rounded,
                title: 'Vibration',
                subtitle: 'Haptic feedback on actions',
                trailing: Switch.adaptive(
                  value: appState.vibrationEnabled,
                  onChanged: appState.setVibrationEnabled,
                  activeTrackColor: getScoreBackgroundColor(context),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Appearance section
              _SectionHeader(title: 'Appearance'),
              const SizedBox(height: 12),
              _SettingsTile(
                icon: Icons.dark_mode_rounded,
                title: 'Theme',
                subtitle: _getThemeName(appState.themeMode),
                trailing: Icon(
                  Icons.chevron_right_rounded,
                  color: getTextPrimaryColor(context),
                ),
                onTap: () => _showThemeDialog(context, appState),
              ),
              
              const SizedBox(height: 24),
              
              // About section
              _SectionHeader(title: 'About'),
              const SizedBox(height: 12),
              const _SettingsTile(
                icon: Icons.info_outline_rounded,
                title: '2048 Block Stack',
                subtitle: 'Version 1.0.0',
              ),
              
              const SizedBox(height: 100),
            ],
          );
        },
      ),
    );
  }
  
  String _getThemeName(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.system:
        return 'System default';
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
    }
  }
  
  void _showThemeDialog(BuildContext context, AppState appState) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: getBackgroundColor(context),
        title: Text(
          'Choose Theme',
          style: TextStyle(color: getTextPrimaryColor(context)),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _ThemeOption(
              title: 'System default',
              isSelected: appState.themeMode == ThemeMode.system,
              onTap: () {
                appState.setThemeMode(ThemeMode.system);
                Navigator.pop(context);
              },
            ),
            _ThemeOption(
              title: 'Light',
              isSelected: appState.themeMode == ThemeMode.light,
              onTap: () {
                appState.setThemeMode(ThemeMode.light);
                Navigator.pop(context);
              },
            ),
            _ThemeOption(
              title: 'Dark',
              isSelected: appState.themeMode == ThemeMode.dark,
              onTap: () {
                appState.setThemeMode(ThemeMode.dark);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _showResetDialog(BuildContext context, AppState appState) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: getBackgroundColor(context),
        title: Text(
          'Reset Progress?',
          style: TextStyle(color: getTextPrimaryColor(context)),
        ),
        content: Text(
          'This will permanently delete all your scores, stats, and coins. This action cannot be undone.',
          style: TextStyle(color: getTextPrimaryColor(context)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              appState.resetProgress();
              // Also reset the game state best score
              context.read<GameState>().resetBestScore();
              context.read<GameState>().restart();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Progress reset successfully'),
                  backgroundColor: getScoreBackgroundColor(context),
                ),
              );
            },
            child: const Text(
              'Reset',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  
  const _SectionHeader({required this.title});
  
  @override
  Widget build(BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: TextStyle(
        color: getTextPrimaryTransparent(context),
        fontSize: 12,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool isDestructive;
  
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
    this.isDestructive = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: getEmptyCellColor(context),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isDestructive ? Colors.red.shade100 : getGridBackgroundColor(context),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            icon,
            color: isDestructive ? Colors.red : getTextPrimaryColor(context),
            size: 22,
          ),
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isDestructive ? Colors.red : getTextPrimaryColor(context),
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            color: getTextPrimaryTransparent(context),
            fontSize: 13,
          ),
        ),
        trailing: trailing,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final String title;
  final bool isSelected;
  final VoidCallback onTap;
  
  const _ThemeOption({
    required this.title,
    required this.isSelected,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      title: Text(
        title,
        style: TextStyle(color: getTextPrimaryColor(context)),
      ),
      trailing: isSelected
          ? Icon(Icons.check_circle, color: getScoreBackgroundColor(context))
          : null,
    );
  }
}
