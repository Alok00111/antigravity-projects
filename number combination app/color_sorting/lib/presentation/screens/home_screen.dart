import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/dimensions.dart';
import '../../core/constants/animations.dart';
import '../../state/settings_provider.dart';
import '../widgets/animated_background.dart';
import 'level_select_screen.dart';
import 'settings_screen.dart';
import 'shop_screen.dart';

/// Home screen with main menu
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  
  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: AppAnimations.buttonPulse,
      vsync: this,
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: AppAnimations.pulseCurve),
    );
  }
  
  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppDimensions.screenPadding),
            child: Column(
              children: [
                const SizedBox(height: 40),
                // Title
                Text(
                  'Liquid Sort',
                  style: GoogleFonts.poppins(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    letterSpacing: 2,
                  ),
                ),
                Text(
                  'PUZZLE',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w300,
                    color: AppColors.textSecondary,
                    letterSpacing: 10,
                  ),
                ),
                
                const Spacer(),
                
                // Play button
                AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _pulseAnimation.value,
                      child: _PlayButton(
                        onTap: () => _navigateToLevelSelect(context),
                      ),
                    );
                  },
                ),
                
                const SizedBox(height: 60),
                
                // Menu buttons row
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _MenuButton(
                      icon: Icons.grid_view_rounded,
                      label: 'Levels',
                      onTap: () => _navigateToLevelSelect(context),
                    ),
                    const SizedBox(width: 20),
                    _MenuButton(
                      icon: Icons.storefront_rounded,
                      label: 'Shop',
                      onTap: () => _navigateToShop(context),
                    ),
                    const SizedBox(width: 20),
                    _MenuButton(
                      icon: Icons.settings_rounded,
                      label: 'Settings',
                      onTap: () => _navigateToSettings(context),
                    ),
                    const SizedBox(width: 20),
                    Consumer<SettingsProvider>(
                      builder: (context, settings, _) {
                        return _MenuButton(
                          icon: settings.soundEnabled 
                              ? Icons.volume_up_rounded 
                              : Icons.volume_off_rounded,
                          label: 'Sound',
                          onTap: () => settings.toggleSound(),
                        );
                      },
                    ),
                  ],
                ),
                
                const Spacer(),
                
                // Version text
                Text(
                  'v1.0.0',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  void _navigateToLevelSelect(BuildContext context) {
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => 
            const LevelSelectScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(1, 0),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: animation,
              curve: AppAnimations.smoothCurve,
            )),
            child: child,
          );
        },
        transitionDuration: AppAnimations.normal,
      ),
    );
  }
  
  void _navigateToSettings(BuildContext context) {
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => 
            const SettingsScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 1),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: animation,
              curve: AppAnimations.smoothCurve,
            )),
            child: child,
          );
        },
        transitionDuration: AppAnimations.normal,
      ),
    );
  }
  
  void _navigateToShop(BuildContext context) {
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => 
            const ShopScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 1),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: animation,
              curve: AppAnimations.smoothCurve,
            )),
            child: child,
          );
        },
        transitionDuration: AppAnimations.normal,
      ),
    );
  }
}

/// Large pulsing play button
class _PlayButton extends StatelessWidget {
  final VoidCallback onTap;
  
  const _PlayButton({required this.onTap});
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: AppDimensions.playButtonSize,
        height: AppDimensions.playButtonSize,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.buttonGradient,
          boxShadow: [
            BoxShadow(
              color: AppColors.accent.withValues(alpha: 0.5),
              blurRadius: 30,
              spreadRadius: 5,
            ),
            BoxShadow(
              color: AppColors.accentSecondary.withValues(alpha: 0.3),
              blurRadius: 40,
              spreadRadius: 10,
            ),
          ],
        ),
        child: const Icon(
          Icons.play_arrow_rounded,
          size: 64,
          color: Colors.white,
        ),
      ),
    );
  }
}

/// Menu button with icon and label
class _MenuButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  
  const _MenuButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.glassBase,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.glassBorder, width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(
              icon,
              size: 28,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
