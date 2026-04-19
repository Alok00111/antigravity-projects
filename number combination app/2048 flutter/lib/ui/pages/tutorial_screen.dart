/// Tutorial screen for Block Stack 2048.
/// Interactive onboarding with real gameplay demo.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/colors.dart';
import '../../game/app_state.dart';
import '../../game/game_state.dart';
import '../../rendering/game_canvas.dart';
import '../../input/gesture_controller.dart';
import '../main_screen.dart';

enum TutorialPhase {
  welcome,           // Welcome page
  shootInstruction,  // "Shoot a block into the grid"
  complete,          // "You're ready!"
}

class TutorialScreen extends StatefulWidget {
  const TutorialScreen({super.key});

  @override
  State<TutorialScreen> createState() => _TutorialScreenState();
}

class _TutorialScreenState extends State<TutorialScreen> with TickerProviderStateMixin {
  TutorialPhase _phase = TutorialPhase.welcome;
  bool _hasMerged = false;
  bool _isDragging = false;
  
  // Hand animation
  late AnimationController _handController;
  late Animation<Offset> _handAnimation;

  @override
  void initState() {
    super.initState();
    
    // Setup hand animation (swipe left-right)
    _handController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    
    _handAnimation = Tween<Offset>(
      begin: const Offset(-0.3, 0),
      end: const Offset(0.3, 0),
    ).animate(CurvedAnimation(
      parent: _handController,
      curve: Curves.easeInOut,
    ));
  }

  void _startGameplay() {
    setState(() {
      _phase = TutorialPhase.shootInstruction;
    });
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final gameState = context.read<GameState>();
      
      // Start tutorial mode with forced 2s
      gameState.startTutorial();
      
      // Listen for game state changes
      gameState.addListener(_onGameStateChanged);
    });
  }

  void _onGameStateChanged() {
    if (!mounted) return;
    final gameState = context.read<GameState>();
    
    // Check for merge (score increased means merge happened)
    if (gameState.score > 0 && !_hasMerged) {
      _hasMerged = true;
      _handController.stop(); // Stop hand animation
      setState(() {
        _phase = TutorialPhase.complete;
      });
    }
  }

  @override
  void dispose() {
    _handController.dispose();
    try {
      context.read<GameState>().removeListener(_onGameStateChanged);
    } catch (_) {}
    super.dispose();
  }

  void _completeTutorial() {
    // Mark tutorial as complete
    context.read<AppState>().completeTutorial();
    
    // Start fresh game
    context.read<GameState>().startGame();
    
    // Navigate to main screen
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const MainScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_phase == TutorialPhase.welcome) {
      return _buildWelcomePage();
    }
    
    return _buildGameplayPage();
  }

  Widget _buildWelcomePage() {
    return Scaffold(
      backgroundColor: getBackgroundColor(context),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              
              // Welcome icon
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: kValidationColor,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Center(
                  child: Text(
                    '2048',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 40),
              
              Text(
                'Welcome to Block Stack!',
                style: TextStyle(
                  color: getTextPrimaryColor(context),
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 16),
              
              Text(
                'Learn how to play in a quick tutorial.',
                style: TextStyle(
                  color: getTextPrimaryColor(context).withOpacity(0.7),
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
              
              const Spacer(),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _startGameplay,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kValidationColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Next',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGameplayPage() {
    return Scaffold(
      backgroundColor: getBackgroundColor(context),
      body: SafeArea(
        child: Stack(
          children: [
            // Real game board
            Column(
              children: [
                const SizedBox(height: 100),
                
                // Interactive game canvas wrapped in Listener for touch detection
                Expanded(
                  child: Center(
                    child: Listener(
                      onPointerDown: (_) {
                        setState(() => _isDragging = true);
                      },
                      onPointerUp: (_) {
                        setState(() => _isDragging = false);
                      },
                      onPointerCancel: (_) {
                        setState(() => _isDragging = false);
                      },
                      child: GestureController(
                        child: const GameCanvas(),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 120),
              ],
            ),
            
            // Instruction overlay at top
            _buildInstructionOverlay(),
            
            // Animated hand (only during shooting phase)
            if (_phase == TutorialPhase.shootInstruction && !_hasMerged)
              _buildAnimatedHand(),
            
            // Complete button at bottom
            if (_phase == TutorialPhase.complete)
              _buildCompleteButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionOverlay() {
    String instruction;
    
    switch (_phase) {
      case TutorialPhase.welcome:
        instruction = '';
        break;
      case TutorialPhase.shootInstruction:
        instruction = _hasMerged 
            ? 'Great! You merged blocks!' 
            : 'Drag to aim, shoot 2 blocks to merge them!';
        break;
      case TutorialPhase.complete:
        instruction = 'You\'re ready to play!';
        break;
    }
    
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.transparent,
            ],
          ),
        ),
        child: Column(
          children: [
            Text(
              'Tutorial',
              style: TextStyle(
                color: kValidationColor,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              instruction,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnimatedHand() {
    // Show different content based on drag state
    if (_isDragging) {
      // User is holding - show release instruction
      return Positioned(
        bottom: 80,  // Just below block spawn area
        left: 0,
        right: 0,
        child: IgnorePointer(
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: kValidationColor,
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.touch_app, color: Colors.white, size: 24),
                  SizedBox(width: 8),
                  Text(
                    'Release to shoot!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
    
    // User is not holding - show drag animation
    return Positioned(
      bottom: 80,  // Just below block spawn area
      left: 0,
      right: 0,
      child: IgnorePointer(
        child: SlideTransition(
          position: _handAnimation,
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.touch_app,
                  size: 50,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Drag left/right',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompleteButton() {
    return Positioned(
      bottom: 32,
      left: 32,
      right: 32,
      child: ElevatedButton(
        onPressed: _completeTutorial,
        style: ElevatedButton.styleFrom(
          backgroundColor: kValidationColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          'Continue to Game',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
