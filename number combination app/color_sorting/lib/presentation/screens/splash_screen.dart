import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/constants/animations.dart';
import '../../state/settings_provider.dart';
import 'home_screen.dart';
import 'tutorial_screen.dart';
import '../widgets/ionleaf_logo.dart';

/// Splash screen with animated Ionleaf Studio logo
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _textFadeAnimation;
  
  @override
  void initState() {
    super.initState();
    
    // Total intro duration: 3.0 seconds
    _controller = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    
    // Logo Fade In
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.3, curve: Curves.easeOut),
      ),
    );
    
    // Scale Effect
    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
      ),
    );
    
    // Text Fade In (Appear after logo forms)
    _textFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.6, 0.9, curve: Curves.easeIn),
      ),
    );
    
    _controller.forward();
    
    // Navigate to home after animation completes
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
         _navigateToHome();
      }
    });
  }
  
  void _navigateToHome() {
    if (mounted) {
      final settings = context.read<SettingsProvider>();
      final Widget nextScreen = settings.isTutorialCompleted 
          ? const HomeScreen() 
          : const TutorialScreen();
          
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => nextScreen,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: AppAnimations.slow, // Smoother transition
        ),
      );
    }
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF101015), // Deep dark background for aesthetics
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animated Logo
            AnimatedBuilder(
              animation: _scaleAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _scaleAnimation.value,
                  child: Opacity(
                    opacity: _fadeAnimation.value,
                    child: IonleafLogo(
                      size: 150,
                      controller: _controller,
                    ),
                  ),
                );
              },
            ),
            
            const SizedBox(height: 48),
            
            // Studio Name
            FadeTransition(
              opacity: _textFadeAnimation,
              child: Column(
                children: [
                   Text(
                    'IONLEAF',
                    style: GoogleFonts.orbitron( // Sci-fi/Tech font if available, else standard
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF00E676),
                      letterSpacing: 4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'STUDIO',
                    style: GoogleFonts.montserrat(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      color: Colors.white.withValues(alpha: 0.7),
                      letterSpacing: 8,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
