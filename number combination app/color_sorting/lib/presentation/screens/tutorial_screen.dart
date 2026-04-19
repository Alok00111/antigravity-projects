import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math' as math; // Add Math
import '../../core/constants/colors.dart';
import '../../core/constants/dimensions.dart';
import '../../core/utils/level_generator.dart'; 
import '../../core/utils/liquid_logic.dart'; // Add LiquidLogic logic
import '../../data/models/liquid_model.dart';
import '../../data/models/tube_model.dart';
import '../../state/game_provider.dart';
import '../../state/settings_provider.dart';
import '../widgets/tube_widget.dart';
import '../widgets/liquid_pour_stream.dart'; // Add Pour Stream
import '../widgets/confetti_overlay.dart'; // Add Confetti
import '../../core/utils/sound_manager.dart';
import '../../core/services/theme_service.dart';
import 'game_screen.dart';

class TutorialScreen extends StatefulWidget {
  const TutorialScreen({super.key});

  @override
  State<TutorialScreen> createState() => _TutorialScreenState();
}

class _TutorialScreenState extends State<TutorialScreen> with TickerProviderStateMixin {
  // Animation State
  late AnimationController _pourController;
  late AnimationController _handController;
  late AnimationController _ghostController; // Ghost Animation
  late Animation<Offset> _handAnimation;
  final List<GlobalKey> _tubeKeys = [];
  final SoundManager _soundManager = SoundManager();
  
  // Tutorial State
  late LevelData _tutorialLevel;
  int _currentStep = 0;
  final GlobalKey _stackKey = GlobalKey(); // Add Stack Key
  
  // Confetti
  bool _showConfetti = false;
  bool _isSkipping = false;
  
  // Track previous guidance to reset animation
  int? _lastSource;
  int? _lastTarget;
  int? _lastSelected;

  @override
  void initState() {
    super.initState();
    _setupTutorialLevel();
    
    // Hand Animation (kept for fallback or remove if fully replacing)
    _handController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    
    _handAnimation = Tween<Offset>(
      begin: const Offset(0, 0),
      end: const Offset(0, 20),
    ).animate(CurvedAnimation(parent: _handController, curve: Curves.easeInOut));
    
    // Ghost Animation Loop
    _ghostController = AnimationController(
       duration: const Duration(milliseconds: 2200), // Slightly faster (was 3s)
       vsync: this,
    )..repeat();
    
    // Pour Animation (600ms matches GameScreen)
    _pourController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _pourController.addListener(() {
      if (mounted) {
        setState(() {}); // Rebuild for overlay
        
        // Trigger haptics during pour
        if (_pourController.isAnimating) {
          final game = context.read<GameProvider>();
          final liquidCount = game.pouringFromIndex != null && game.pouringFromIndex! < game.tubes.length
              ? game.tubes[game.pouringFromIndex!].topSameColorCount
              : 1;
          _soundManager.triggerPourPhaseHaptic(_pourController.value, liquidCount: liquidCount);
        }
      }
    });
    
    _pourController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
         if (mounted) {
           context.read<GameProvider>().completePour();
           _pourController.reset();
         }
      }
    });
  }
  
  void _setupTutorialLevel() {
    // Initialize keys based on expected tube count (3)
    for (int i=0; i<3; i++) _tubeKeys.add(GlobalKey());
    
    _tutorialLevel = LevelData(
      id: 0,
      difficulty: 'Tutorial',
      tubes: [
        TubeModel(id: 't1', capacity: 2, liquids: [
          LiquidModel(colorId: 'blue'),
        ]),
        TubeModel(id: 't2', capacity: 3, liquids: [
          LiquidModel(colorId: 'red'),
          LiquidModel(colorId: 'blue'),
          LiquidModel(colorId: 'red'),
        ]),
        TubeModel(id: 't3', capacity: 2, liquids: []),
      ],
    );
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<GameProvider>().loadCustomLevel(_tutorialLevel);
      }
    });
  }

  @override
  void dispose() {
    _handController.dispose();
    _ghostController.dispose();
    _pourController.dispose();
    super.dispose();
  }
  
  Offset _getTubePosition(int index) {
    if (index < 0 || index >= _tubeKeys.length) return Offset.zero;
    final GlobalKey key = _tubeKeys[index];
    final BuildContext? ctx = key.currentContext;
    if (ctx == null) return Offset.zero;
    final RenderBox? box = ctx.findRenderObject() as RenderBox?;
    if (box == null) return Offset.zero;
    return box.localToGlobal(Offset.zero); // Global position
  }
  
  // Copied Tilt Calculation from GameScreen
  double _calculateTiltAngle(double progress, double direction) {
    // TILT LOGIC:
    // 0.0 - 0.4: Tilt from 0 to 45 deg
    // 0.4 - 0.9: Hold 45 deg
    // 0.9 - 1.0: Tilt back to 0
    final maxTilt = math.pi / 4; // 45 degrees
    
    if (progress < 0.40) {
      // Tilting in
      return (progress / 0.40) * maxTilt * direction;
    } else if (progress < 0.90) {
      // Holding
      return maxTilt * direction;
    } else {
      // Tilting back
      return ((1.0 - progress) / 0.10) * maxTilt * direction;
    }
  }

  ({int source, int target})? _getTutorialGuidance(GameProvider game) {
    if (game.tubes.length < 3) return null;
    final t1 = game.tubes[1]; // Middle
    
    if (!t1.isEmpty) {
      final topColor = t1.topColorId;
      if (topColor == 'red') {
        // Red goes to Right (T2)
        if (LiquidLogic.canPour(t1, game.tubes[2])) {
           return (source: 1, target: 2);
        }
      } else if (topColor == 'blue') {
        // Blue goes to Left (T0)
        if (LiquidLogic.canPour(t1, game.tubes[0])) {
           return (source: 1, target: 0);
        }
      }
    }
    return null;
  }

  Future<void> _onTutorialComplete() async {
    await _skipTutorial();
  }

  Future<void> _old_onTutorialComplete() async {
    setState(() {
      _currentStep = 3;
      _showConfetti = true; 
    });
    
    // Reduced from 4s to 3s for snappier feel
    await Future.delayed(const Duration(seconds: 3)); 
    
    if (mounted) {
      final settings = context.read<SettingsProvider>();
      final game = context.read<GameProvider>();
      
      // Update state BEFORE navigation
      settings.completeTutorial();
      await game.loadLevel(1);
      
      // Stop all animations before transitioning to prevent conflicts
      _ghostController.stop();
      _handController.stop();
      _pourController.stop();
      
      // Use fade transition for smoother visual
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const GameScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 300),
        ),
      );
    }
  }


  Future<void> _skipTutorial() async {
    if (_isSkipping) return;
    
    setState(() {
      _isSkipping = true;
    });
    
    // Wait for fade out animation (500ms)
    await Future.delayed(const Duration(milliseconds: 500));
    
    if (mounted) {
       final settings = context.read<SettingsProvider>();
       final game = context.read<GameProvider>();
       
       settings.completeTutorial();
       
       // Use loadLevel (async) to properly initialize Level 1 with timer
       await game.loadLevel(1);
       
       // Stop animations
       _ghostController.stop();
       _handController.stop();
       _pourController.stop();
       
       // Navigate seamlessly (Fade)
       Navigator.of(context).pushReplacement(
         PageRouteBuilder(
           pageBuilder: (context, animation, secondaryAnimation) => const GameScreen(),
           transitionsBuilder: (context, animation, secondaryAnimation, child) {
             return FadeTransition(opacity: animation, child: child);
           },
           transitionDuration: const Duration(milliseconds: 300),
         ),
       );
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.backgroundGradient,
        ),
        child: SafeArea(
          child: Stack( // Outer stack for Overlay
            key: _stackKey,
            children: [
              AnimatedOpacity(
                opacity: _isSkipping ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeInOut,
                child: Column(
                  children: [
                   // ... Header ...
                   Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Text(
                      'HOW TO PLAY',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                  
                  const Spacer(),
                  
                  Consumer<GameProvider>(
                    builder: (context, game, child) {
                      if (game.isWon && _currentStep < 3) {
                         WidgetsBinding.instance.addPostFrameCallback((_) => _onTutorialComplete());
                      }
                      
                      // Trigger Animation if Provider says "Pouring" but Controller isn't running
                      if (game.isPouring && !_pourController.isAnimating && _pourController.status != AnimationStatus.completed) {
                         WidgetsBinding.instance.addPostFrameCallback((_) {
                           if (mounted) {
                             _soundManager.resetPourHaptics();
                             _pourController.forward(from: 0.0);
                           }
                         });
                      }
                      
                      String instruction = "Sort the colors!";
                      if (game.selectedTubeIndex == null) instruction = "Tap a tube to pick up liquid";
                      else instruction = "Tap another tube to pour";
                      
                      return Column(
                        children: [
                           // Tube Row
                           SizedBox(
                             height: 300,
                             child: Row(
                               mainAxisAlignment: MainAxisAlignment.center,
                               children: List.generate(game.tubes.length, (index) {
                                 final tube = game.tubes[index];
                                 // HIDE SOURCE TUBE IF ANIMATING (Overlay takes over)
                                 final isHidden = game.isPouring && game.pouringFromIndex == index;
                                 
                                 return Padding(
                                   padding: const EdgeInsets.symmetric(horizontal: 8.0),
                                   child: TubeWidget(
                                      key: _tubeKeys[index], // Assign Key
                                      tube: tube,
                                      isSelected: game.selectedTubeIndex == index,
                                      onTap: () => game.selectTube(index), 
                                      isHidden: isHidden, // Hide static tube during pour
                                      isMysteryMode: false,
                                   ),
                                 );
                               }),
                             ),
                           ),
                           
                           const SizedBox(height: 30),
                           
                           // Instructions
                           Container(
                             // ... (Instruction Box) ...
                             padding: const EdgeInsets.all(16),
                             decoration: BoxDecoration(
                               color: AppColors.glassBase,
                               borderRadius: BorderRadius.circular(30),
                               border: Border.all(color: AppColors.glassBorder),
                             ),
                             child: Text(instruction, style: const TextStyle(color: Colors.white, fontSize: 18)),
                           ),
                        ],
                      );
                    },
                  ),
                  
                  const Spacer(),
                  
                  // Skip Button
                  Padding(
                    padding: const EdgeInsets.only(bottom: 30),
                    child: TextButton(
                      onPressed: () => _skipTutorial(),
                      child: const Text('Skip Tutorial', style: TextStyle(color: AppColors.textMuted)),
                    ),
                  ),
                ],
              ),
              ),
              
              // OVERLAYS
              
              // 1. Moving Tube Overlay
              Consumer<GameProvider>(
                builder: (context, game, child) {
                  if (!game.isPouring || game.pouringFromIndex == null || game.pouringToIndex == null) {
                    return const SizedBox.shrink();
                  }
                  
                  final fromIndex = game.pouringFromIndex!;
                  final toIndex = game.pouringToIndex!;
                  final tube = game.tubes[fromIndex];
                  
                  // Calculate Positions using Keys
                  // 1. Get Global Bottom-Center Positions
                  final startGlobal = _getTubePosition(fromIndex) + Offset((AppDimensions.tubeWidth/2), AppDimensions.tubeHeight); 
                  final targetGlobal = _getTubePosition(toIndex) + Offset((AppDimensions.tubeWidth/2), AppDimensions.tubeHeight); 
                  
                  if (_getTubePosition(fromIndex) == Offset.zero || _getTubePosition(toIndex) == Offset.zero) return const SizedBox.shrink();

                  // 2. Convert to Stack Local Coordinates
                  final RenderBox? stackBox = _stackKey.currentContext?.findRenderObject() as RenderBox?;
                  if (stackBox == null) return const SizedBox.shrink();

                  final startPos = stackBox.globalToLocal(startGlobal);
                  final targetPos = stackBox.globalToLocal(targetGlobal);
                  
                  return _buildMovingTubeOverlay(tube, startPos, targetPos, _pourController.value, false);
                },
              ),
              
              // 2. Ghost Tube Overlay (Teach Mechanics)
              Consumer<GameProvider>(
                builder: (context, game, child) {
                   if (game.isWon || game.isPouring) return const SizedBox.shrink();

                   final guidance = _getTutorialGuidance(game);
                   if (guidance == null) return const SizedBox.shrink();
                   
                   // Get Source Tube for Ghost Visual
                   final sourceTube = game.tubes[guidance.source];
                   
                   // Check for step/selection change to reset animation
                   if (_lastSource != guidance.source || 
                       _lastTarget != guidance.target || 
                       _lastSelected != game.selectedTubeIndex) {
                       
                       _lastSource = guidance.source;
                       _lastTarget = guidance.target;
                       _lastSelected = game.selectedTubeIndex;
                       
                       WidgetsBinding.instance.addPostFrameCallback((_) {
                           if (mounted) {
                               _ghostController.reset();
                               _ghostController.repeat();
                           }
                       });
                   }
                   
                   // CRITICAL FIX: Only show Ghost Pour if Source is Selected
                   // AND match the source index
                   if (game.selectedTubeIndex != guidance.source) return const SizedBox.shrink();
                   
                   // Determine positions
                   final sourceGlobal = _getTubePosition(guidance.source);
                   final targetGlobal = _getTubePosition(guidance.target);
                   
                   if (sourceGlobal == Offset.zero || targetGlobal == Offset.zero) return const SizedBox.shrink();
                   
                   // Convert to Stack Local Coordinates
                   final RenderBox? stackBox = _stackKey.currentContext?.findRenderObject() as RenderBox?;
                   if (stackBox == null) return const SizedBox.shrink();
                   
                   final startPos = stackBox.globalToLocal(sourceGlobal) + Offset((AppDimensions.tubeWidth/2), AppDimensions.tubeHeight);
                   final endPos = stackBox.globalToLocal(targetGlobal) + Offset((AppDimensions.tubeWidth/2), AppDimensions.tubeHeight);

                   return AnimatedBuilder(
                     animation: _ghostController,
                     builder: (context, child) {
                       return _buildMovingTubeOverlay(
                         sourceTube, 
                         startPos, 
                         endPos, 
                         _ghostController.value, 
                         false,
                         opacity: 0.6,
                         isGhost: true,
                       );
                     },
                   );
                },
              ),

              // 3. Hand Animation Below Source Tube
              Consumer<GameProvider>(
                builder: (context, game, child) {
                   if (game.isWon || game.isPouring) return const SizedBox.shrink();

                   final guidance = _getTutorialGuidance(game);
                   if (guidance == null) return const SizedBox.shrink();
                   
                   // Point to the source tube (where user should tap)
                   final targetIndex = guidance.source;

                   return AnimatedBuilder(
                     animation: _handAnimation,
                     builder: (context, child) {
                       final tubePos = _getTubePosition(targetIndex);
                       if (tubePos == Offset.zero) return const SizedBox.shrink();
                       
                       final RenderBox? stackBox = _stackKey.currentContext?.findRenderObject() as RenderBox?;
                       if (stackBox == null) return const SizedBox.shrink();
                       
                       final localTubePos = stackBox.globalToLocal(tubePos);
                       
                       final handPos = localTubePos + Offset(
                         (AppDimensions.tubeWidth / 2) - 30, // Center horizontally
                         AppDimensions.tubeHeight + 10, // Below tube
                       );
                         
                       return Positioned(
                         left: handPos.dx,
                         top: handPos.dy + _handAnimation.value.dy,
                         child: const IgnorePointer(
                           child: Icon(Icons.touch_app, size: 60, color: Colors.white),
                         ),
                       );
                     },
                   );
                },
              ),

              // 4. Confetti Overlay
              ConfettiOverlay(isPlaying: _showConfetti),
            ],
          ),
        ),
      ),
    );
  }

  // COPIED OVERLAY LOGIC (Strict)
  Widget _buildMovingTubeOverlay(
      TubeModel tube, 
      Offset startPos, 
      Offset targetPos, 
      double progress, 
      bool isMysteryMode,
      {double opacity = 1.0, bool isGhost = false}
  ) {
    if (progress <= 0 || progress >= 1.0) return const SizedBox.shrink();

    // 1. Calculate Motion Progress (0-0.4 move, 0.4-0.9 pour, 0.9-1.0 return)
    double moveProgress = 0.0;
    if (progress < 0.40) {
      moveProgress = progress / 0.40;
    } else if (progress < 0.90) {
      moveProgress = 1.0;
    } else {
      moveProgress = 1.0 - ((progress - 0.90) / 0.10);
    }
    moveProgress = Curves.easeInOutCubic.transform(moveProgress.clamp(0.0, 1.0));
    
    // 2. Calculate Tilt
    final isTargetRight = targetPos.dx > startPos.dx;
    final tiltDirection = isTargetRight ? 1.0 : -1.0;
    final maxTilt = math.pi / 4; 
    
    // Swing Compensation
    final swingX = AppDimensions.tubeHeight * math.sin(maxTilt);
    final halfWidth = AppDimensions.tubeWidth / 2;
    final visualAdjustment = 10.0; 

    final xOffset = isTargetRight 
        ? -(swingX + halfWidth - visualAdjustment) 
        : (swingX + halfWidth - visualAdjustment);
    final yOffset = -50.0;
    
    final targetBasePos = targetPos + Offset(xOffset, yOffset);
    final currentLeft = startPos.dx + (targetBasePos.dx - startPos.dx) * moveProgress;
    final currentTop = startPos.dy + (targetBasePos.dy - startPos.dy) * moveProgress;
    
    final posLeft = currentLeft - (AppDimensions.tubeWidth / 2);
    final posTop = currentTop - AppDimensions.tubeHeight;
    
    final tiltAngle = _calculateTiltAngle(progress, tiltDirection);
    final pivotAlignment = isTargetRight ? Alignment.bottomRight : Alignment.bottomLeft;

    // Stream Calculation
    Widget? streamWidget;
    if (tube.liquids.isNotEmpty && progress > 0.40 && progress < 0.90) {
      // Get themed liquid color
      final settings = context.read<SettingsProvider>();
      final theme = ThemeService.getActiveTheme(settings);
      final color = AppColors.getLiquidColorFromTheme(tube.topLiquid!.colorId, theme);
      final tubeW = AppDimensions.tubeWidth;
      final tubeH = AppDimensions.tubeHeight;
      
      final pivotGlobal = isTargetRight 
          ? Offset(posLeft + tubeW, posTop + tubeH)
          : Offset(posLeft, posTop + tubeH);
          
      final targetTopCenterGlobal = targetPos + Offset(0, -tubeH);
      final pivotToTarget = targetTopCenterGlobal - pivotGlobal;
      
      final cosA = math.cos(-tiltAngle);
      final sinA = math.sin(-tiltAngle);
      
      final localX = pivotToTarget.dx * cosA - pivotToTarget.dy * sinA;
      final localY = pivotToTarget.dx * sinA + pivotToTarget.dy * cosA;
      
      final p2 = Offset(localX, localY + tubeH);
      
      streamWidget = Positioned(
        top: 0,
        right: isTargetRight ? 0 : null,
        left: isTargetRight ? null : 0,
        child: Opacity(
          opacity: opacity, // Apply opacity to stream too
          child: SizedBox(
            width: 0, height: 0,
            child: LiquidPourStream(
               liquidColor: color,
               sourceStartPoint: Offset.zero,
               targetTopPoint: p2,
               pourProgress: progress,
               tiltAngle: tiltAngle,
            ),
          ),
        ),
      );
    }

    return Positioned(
      left: posLeft,
      top: posTop,
      child: IgnorePointer(
        ignoring: isGhost,
        child: Opacity(
          opacity: opacity,
          child: Transform.rotate(
            angle: tiltAngle,
            alignment: pivotAlignment,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                TubeWidget(
                  tube: tube,
                  onTap: () {},
                  isSelected: true,
                  isHidden: false,
                  pourProgress: progress,
                  isPouringFrom: true,
                  pouringLiquidCount: tube.topSameColorCount,
                  pouringColorId: tube.liquids.isNotEmpty ? tube.topLiquid!.colorId : null,
                  targetOffset: Offset.zero,
                  isMysteryMode: isMysteryMode, 
                ),
                if (streamWidget != null) streamWidget,
              ],
            ),
          ),
        ),
      ),
    );
  }
}
