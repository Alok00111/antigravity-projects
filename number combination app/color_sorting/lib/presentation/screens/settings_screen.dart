import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/dimensions.dart';
import '../../state/settings_provider.dart';
import '../widgets/animated_background.dart';

/// Settings screen
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(AppDimensions.screenPadding),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.glassBase,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.glassBorder, width: 1),
                        ),
                        child: const Icon(
                          Icons.arrow_back_rounded,
                          color: AppColors.textPrimary,
                          size: 22,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      'Settings',
                      style: GoogleFonts.poppins(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Settings options
              Consumer<SettingsProvider>(
                builder: (context, settings, _) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppDimensions.screenPadding,
                    ),
                    child: Column(
                      children: [
                        // Sound toggle
                        _SettingsTile(
                          icon: settings.soundEnabled 
                              ? Icons.volume_up_rounded 
                              : Icons.volume_off_rounded,
                          title: 'Sound Effects',
                          subtitle: settings.soundEnabled ? 'On' : 'Off',
                          trailing: Switch(
                            value: settings.soundEnabled,
                            onChanged: (_) => settings.toggleSound(),
                            activeTrackColor: AppColors.accent,
                          ),
                        ),
                        
                        const SizedBox(height: 12),
                        
                        // Haptics toggle
                        _SettingsTile(
                          icon: settings.hapticsEnabled 
                              ? Icons.vibration 
                              : Icons.phone_android_rounded,
                          title: 'Haptic Feedback',
                          subtitle: settings.hapticsEnabled ? 'On' : 'Off',
                          trailing: Switch(
                            value: settings.hapticsEnabled,
                            onChanged: (_) => settings.toggleHaptics(),
                            activeTrackColor: AppColors.accent,
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Progress section
                        _SettingsTile(
                          icon: Icons.bar_chart_rounded,
                          title: 'Progress',
                          subtitle: '${settings.highestLevel} levels completed',
                          trailing: const Icon(
                            Icons.info_outline_rounded,
                            color: AppColors.textMuted,
                          ),
                        ),
                        
                        const SizedBox(height: 12),
                        
                        // Reset progress
                        _SettingsTile(
                          icon: Icons.restart_alt_rounded,
                          title: 'Reset Progress',
                          subtitle: 'Start from level 1',
                          iconColor: AppColors.error,
                          onTap: () => _showResetConfirmation(context, settings),
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Debug section (for testing)
                        _SettingsTile(
                          icon: Icons.monetization_on,
                          title: 'Add 500 Coins',
                          subtitle: 'Debug: Current coins: ${settings.coins}',
                          iconColor: Colors.amber,
                          onTap: () {
                            settings.addCoins(500);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  '+500 coins added!',
                                  style: GoogleFonts.poppins(),
                                ),
                                backgroundColor: AppColors.success,
                                duration: const Duration(seconds: 1),
                              ),
                            );
                          },
                        ),
                        
                        const SizedBox(height: 12),
                        
                        // Unlock All Themes (Debug)
                        _SettingsTile(
                          icon: Icons.lock_open_rounded,
                          title: 'Unlock All Themes',
                          subtitle: 'Debug: Unlock all ${Provider.of<SettingsProvider>(context).ownedThemes.length} items',
                          iconColor: Colors.purpleAccent,
                          onTap: () async {
                            await settings.unlockAllThemes();
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'All themes unlocked! 🎨',
                                    style: GoogleFonts.poppins(),
                                  ),
                                  backgroundColor: AppColors.success,
                                ),
                              );
                            }
                          },
                        ),
                        
                        const SizedBox(height: 40),
                        
                        // About section
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.glassBase,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.glassBorder, width: 1),
                          ),
                          child: Column(
                            children: [
                              Text(
                                'Liquid Sort Puzzle',
                                style: GoogleFonts.poppins(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Version 1.0.0',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'A colorful puzzle game',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _showResetConfirmation(BuildContext context, SettingsProvider settings) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.backgroundPrimary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          'Reset Progress?',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        content: Text(
          'This will reset all your progress. You will start from level 1.',
          style: GoogleFonts.poppins(
            color: AppColors.textSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(
                color: AppColors.textMuted,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              settings.resetProgress();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Progress reset successfully',
                    style: GoogleFonts.poppins(),
                  ),
                  backgroundColor: AppColors.accent,
                ),
              );
            },
            child: Text(
              'Reset',
              style: GoogleFonts.poppins(
                color: AppColors.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Settings tile widget
class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final Color? iconColor;
  final VoidCallback? onTap;
  
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.iconColor,
    this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.glassBase,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.glassBorder, width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: (iconColor ?? AppColors.accent).withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: iconColor ?? AppColors.accent,
                size: 22,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            if (trailing != null) trailing!,
            if (onTap != null && trailing == null)
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textMuted,
              ),
          ],
        ),
      ),
    );
  }
}
