import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/dimensions.dart';
import '../../core/constants/animations.dart';
import '../../state/game_provider.dart';
import '../../state/settings_provider.dart';
import '../widgets/animated_background.dart';
import '../widgets/tube_widget.dart';
import 'dart:math' as math;
import '../widgets/victory_overlay.dart';
import '../widgets/liquid_pour_stream.dart';
import '../../data/models/tube_model.dart';
import '../../core/utils/sound_manager.dart';
import '../../core/services/ad_manager.dart';
import '../../core/services/theme_service.dart';
import '../widgets/hint_dialog.dart';
import 'home_screen.dart';

/// Main game screen
class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with TickerProviderStateMixin {
  late AnimationController _pourController;

  bool _showWinDialog = false;
  bool _showLoseDialog = false; // Add Lose Dialog State
  final SoundManager _soundManager = SoundManager();
  
  @override
  void initState() {
    super.initState();
    
    _pourController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    // Trigger haptics during pour animation
    _pourController.addListener(() {
      if (_pourController.isAnimating) {
        final game = context.read<GameProvider>();
        final liquidCount = game.pouringFromIndex != null && game.pouringFromIndex! < game.tubes.length
            ? game.tubes[game.pouringFromIndex!].topSameColorCount
            : 1;
        _soundManager.triggerPourPhaseHaptic(_pourController.value, liquidCount: liquidCount);
      }
    });
    
    _pourController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        final gameProvider = context.read<GameProvider>();
        gameProvider.completePour();
        _pourController.reset();
      }
    });
  }
  
  @override
  void dispose() {
    _pourController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Consumer<GameProvider>(
            builder: (context, game, _) {
              // Check for win state
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (game.isWon && !_showWinDialog) {
                  setState(() => _showWinDialog = true);
                  _showWinDialogPopup(context);
                }
                
                // Check for lose state
                if (game.isLost && !_showLoseDialog) {
                  setState(() => _showLoseDialog = true);
                  _showLoseDialogPopup(context);
                }
              });
              
              // Start pour animation
              if (game.isPouring && !_pourController.isAnimating) {
                _soundManager.resetPourHaptics();
                _pourController.forward();
              }
              
              return Stack(
                children: [
                  Column(
                    children: [
                      // Header
                      Consumer<SettingsProvider>(
                        builder: (context, settings, _) => _GameHeader(
                          levelId: game.currentLevelId,
                          moves: game.moves,
                          coins: settings.coins,
                          hints: settings.hints,

                          timeRemaining: game.timeRemaining,
                          initialTime: game.initialTime,
                          onBack: () {
                            // Stop the timer before leaving
                            game.stopTimer();
                            // Always go back to HomeScreen
                            if (Navigator.canPop(context)) {
                              Navigator.pop(context);
                            } else {
                              Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(builder: (_) => const HomeScreen()),
                              );
                            }
                          },
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // Tubes area
                      Expanded(
                        child: Center(
                          child: AnimatedBuilder(
                            animation: _pourController,
                            builder: (context, child) {
                              return _TubeGrid(
                                tubes: game.tubes,
                                isMysteryMode: game.isMysteryMode,
                                selectedIndex: game.selectedTubeIndex,
                                pouringFromIndex: game.pouringFromIndex,
                                pouringToIndex: game.pouringToIndex,
                                pourProgress: _pourController.value,
                                onTubeTap: (index) => game.selectTube(index),
                              );
                            },
                          ),
                        ),
                      ),
                      
                      // Action buttons
                      _ActionButtons(
                        canUndo: game.canUndo,
                        onUndo: () => game.undoLastMove(),
                        onReset: () => game.resetLevel(),
                        onHint: () => _showHint(context, game),
                      ),
                      
                      const SizedBox(height: 20),
                    ],
                  ),
                  
                  // Victory overlay
                  VictoryOverlay(
                    isPlaying: game.isWon,
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
  
  void _showHint(BuildContext context, GameProvider game) {
    final settings = context.read<SettingsProvider>();
    final adManager = AdManager();
    
    showDialog(
      context: context,
      builder: (context) => HintDialog(
        hintsRemaining: settings.hints,
        coins: settings.coins,
        isAdReady: true, // Always allow click to trigger load if needed
        onUseHint: () {
          // Use hint and show the actual hint
          settings.useHint().then((success) {
            if (success) {
              final hint = game.getHint();
              if (hint != null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Try moving from tube ${hint.from + 1} to tube ${hint.to + 1}',
                      style: GoogleFonts.poppins(),
                    ),
                    backgroundColor: AppColors.accent,
                    duration: const Duration(seconds: 3),
                  ),
                );
              }
            }
          });
        },
        onWatchAd: () async {
          // Try to show ad
          final shown = await adManager.showRewardedAd(
            onRewarded: (amount) {
              settings.addHints(1); // +1 hint for watching ad
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    '+1 hint earned!',
                    style: GoogleFonts.poppins(),
                  ),
                  backgroundColor: AppColors.success,
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          );
          
          if (!shown) {
            // Ad wasn't ready, but showRewardedAd triggers a load
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Loading ad... please try again in a moment',
                    style: GoogleFonts.poppins(),
                  ),
                  backgroundColor: AppColors.textSecondary,
                  duration: const Duration(seconds: 2),
                ),
              );
            }
          }
        },
        onBuyHints: () {
          settings.buyHintsWithCoins(hintCount: 1, coinCost: 50).then((success) {
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    '+1 hint purchased!',
                    style: GoogleFonts.poppins(),
                  ),
                  backgroundColor: AppColors.success,
                  duration: const Duration(seconds: 2),
                ),
              );
            }
          });
        },
      ),
    );
  }
  
  void _showWinDialogPopup(BuildContext context) {
    try {
      final gameProvider = context.read<GameProvider>();
      final settingsProvider = context.read<SettingsProvider>();
      
      // Calculate stars based on performance
      final stars = gameProvider.calculateStars();
      
      // Store levelId and moves before async gap
      final levelId = gameProvider.currentLevelId;
      final moves = gameProvider.moves;
      
      // Mark level as complete with stars (Safely)
      try {
        settingsProvider.completeLevel(
          levelId,
          moves: moves,
          stars: stars,
        );
      } catch (e) {
        debugPrint('Error saving level complete: $e');
      }
      
      // Trigger interstitial ad (Safely)
      try {
        AdManager().onLevelComplete();
      } catch (e) {
        debugPrint('Error triggering ad: $e');
      }
      
      Future.delayed(const Duration(milliseconds: 300), () {
        if (!mounted) return;
        
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (dialogContext) => _WinDialog(
            levelId: levelId,
            moves: moves,
            stars: stars,
            onNextLevel: () {
              Navigator.pop(dialogContext); // Close dialog
              _showWinDialog = false;
              gameProvider.loadLevel(levelId + 1);
            },
            onReplay: () {
              Navigator.pop(dialogContext);
              _showWinDialog = false;
              gameProvider.resetLevel();
            },
            onHome: () {
              Navigator.pop(dialogContext);
              if (!mounted) return;
              Navigator.of(context).pop();
            },
          ),
        );
      });
    } catch (e) {
      debugPrint('Critical error in showWinDialog: $e');
      // Fallback: try to show dialog anyway if main logic failed
      if (mounted) {
           // Basic fallback dialog could go here, but usually above catches handle it
      }
    }
  }
  void _showLoseDialogPopup(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => _LoseDialog(
        onReplay: () {
          Navigator.pop(dialogContext);
          setState(() => _showLoseDialog = false);
          context.read<GameProvider>().resetLevel();
        },
        onHome: () {
          Navigator.pop(dialogContext);
          if (!mounted) return;
          Navigator.of(context).pop();
        },
        onWatchAd: () async {
          // Trigger Ad
          final adManager = AdManager();
          final startLoad = DateTime.now();
          
          final shown = await adManager.showRewardedAd(
            onRewarded: (amount) {
               // Add 60s
               if (mounted) {
                   Navigator.pop(dialogContext);
                   setState(() => _showLoseDialog = false);
                   context.read<GameProvider>().addTime(60);
                   
                   ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Time Extended! +60s', style: GoogleFonts.poppins()), backgroundColor: AppColors.success),
                   );
               }
            },
          );
          
          if (!shown) {
             if (mounted) {
                 ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Ad not ready. Try again.', style: GoogleFonts.poppins()), backgroundColor: AppColors.error),
                 );
             }
          }
        },
      ),
    );
  }
} // End of State class. Note: I need to be careful with brackets.
// The original code has `}` at line 302 closing the State class.
// My replacement will REPLACE `}` with the new method AND the `}`.

/// Game header with level, moves, timer, and back button
class _GameHeader extends StatefulWidget {
  final int levelId;
  final int moves;
  final int coins;
  final int hints;
  final int timeRemaining;
  final int initialTime;
  final VoidCallback onBack;
  
  const _GameHeader({
    required this.levelId,
    required this.moves,
    required this.coins,
    required this.hints,
    required this.timeRemaining,
    required this.initialTime,
    required this.onBack,
  });

  @override
  State<_GameHeader> createState() => _GameHeaderState();
}

class _GameHeaderState extends State<_GameHeader> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _scaleAnimation;
  
  // Track previous phase to detect transitions
  // 0: Green, 1: Yellow, 2: Red
  int _currentPhase = 0;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
       duration: const Duration(milliseconds: 500), 
       vsync: this
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut)
    );
    
    // Initialize phase
    _updatePhase(widget.timeRemaining, widget.initialTime, playAnim: false);
  }
  
  @override
  void didUpdateWidget(_GameHeader oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.timeRemaining != widget.timeRemaining) {
      _updatePhase(widget.timeRemaining, widget.initialTime, playAnim: true);
    }
  }
  
  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _updatePhase(int remaining, int total, {required bool playAnim}) {
    int newPhase = 0;
    
    if (remaining <= 30) {
      newPhase = 2; // Red
    } else if (remaining <= (total / 2)) {
      newPhase = 1; // Yellow
    } else {
      newPhase = 0; // Green
    }
    
    // Transition Logic
    if (newPhase != _currentPhase) {
      _currentPhase = newPhase;
      if (playAnim) {
         // Play attention grabber
         _pulseController.forward().then((_) => _pulseController.reverse());
         
         // If entering RED, start looping? 
         // User said "Animation happening IN the transition".
         // "As time slips out... changing color... make sure for EACH TRANSITION there is an animation".
         // So mostly on transition.
         // But commonly Red = Beat.
         if (newPhase == 2) {
             _pulseController.repeat(reverse: true);
         } else {
             _pulseController.stop(); // Stop loop if somehow went back (ad reward)
             _pulseController.forward().then((_) => _pulseController.reverse());
         }
      }
    } else if (newPhase == 2 && !_pulseController.isAnimating) {
        // Ensure beating continues in red phase
        _pulseController.repeat(reverse: true);
    } else if (newPhase != 2 && _pulseController.isAnimating) {
        // Stop beating if we added time and went back to Yellow/Green
        _pulseController.stop();
        _pulseController.reset();
    }
  }
  
  Color _getTimerColor() {
    switch (_currentPhase) {
      case 2: return AppColors.error;
      case 1: return Colors.amber;
      default: return AppColors.success;
    }
  }

  String _formatTime(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(1, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final color = _getTimerColor();
    
    return Padding(
      padding: const EdgeInsets.all(AppDimensions.screenPadding),
      child: Row(
        children: [
          // Back button
          GestureDetector(
            onTap: widget.onBack,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.glassBase,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.glassBorder, width: 1),
              ),
              child: const Icon(
                Icons.arrow_back_rounded,
                color: AppColors.textPrimary,
                size: 20,
              ),
            ),
          ),
          
          const SizedBox(width: 8),
          
          // Coins & Hints
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.glassBase,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.glassBorder, width: 1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.monetization_on, color: Colors.amber, size: 14),
                const SizedBox(width: 2),
                Text(
                  '${widget.coins}',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 6),
                const Icon(Icons.lightbulb, color: AppColors.accent, size: 14),
                const SizedBox(width: 2),
                Text(
                  '${widget.hints}',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          
          const Spacer(),
          
          // Level
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.glassBase,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.glassBorder, width: 1),
            ),
            child: Text(
              'Lv.${widget.levelId}',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          
          const SizedBox(width: 6),
          
          // Moves
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.glassBase,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.glassBorder, width: 1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.swap_horiz_rounded,
                  color: AppColors.accent,
                  size: 16,
                ),
                const SizedBox(width: 2),
                Text(
                  '${widget.moves}',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(width: 6),
          
          // ANIMATED TIMER
          ScaleTransition(
            scale: _scaleAnimation,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.glassBase,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: color.withValues(alpha: 0.5), width: 1), // Border matches phase
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.timer_rounded,
                    color: color,
                    size: 14,
                  ),
                  const SizedBox(width: 2),
                  Text(
                    _formatTime(widget.timeRemaining),
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: color,
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

/// Grid of tubes
class _TubeGrid extends StatelessWidget {
  final List tubes;
  final int? selectedIndex;
  final int? pouringFromIndex;
  final int? pouringToIndex;
  final double pourProgress;
  final Function(int) onTubeTap;
  
  final bool isMysteryMode;
  
  const _TubeGrid({
    required this.tubes,
    required this.onTubeTap,
    this.isMysteryMode = false,
    this.selectedIndex,
    this.pouringFromIndex,
    this.pouringToIndex,
    this.pourProgress = 0.0,
  });
  


  /// Calculate the center position of a tube in the grid (Global Pivot)
  Offset _calculateTubeCenter(int index, int tubesPerRow, double gridWidth) {
    if (tubes.isEmpty) return Offset.zero;

    final row = index ~/ tubesPerRow;
    final int itemsInThisRow;
    
    // Calculate items in the specific row
    final startOfRow = row * tubesPerRow;
    final endOfRow = math.min(startOfRow + tubesPerRow, tubes.length);
    itemsInThisRow = endOfRow - startOfRow;
    
    // Calculate col relative to the start of this row
    final col = index - startOfRow;
    
    final tubeSlotWidth = AppDimensions.tubeWidth + AppDimensions.tubeSpacing;
    final rowHeight = AppDimensions.tubeHeight + AppDimensions.tubeSpacing + 20;
    
    // Width of THIS row
    final totalRowWidth = itemsInThisRow * tubeSlotWidth - AppDimensions.tubeSpacing;
    final startX = (gridWidth - totalRowWidth) / 2;
    
    final x = startX + col * tubeSlotWidth + AppDimensions.tubeWidth / 2;
    final y = row * rowHeight + AppDimensions.tubeHeight;
    
    return Offset(x, y);
  }

  /// Calculate tilt angle based on progress and direction
  double _calculateTiltAngle(double progress, double tiltDirection) {
    // Phase 1: Tilt (Happens during move 0.0 to 0.40)
    // Phase 2: Hold (0.40 to 0.90)
    // Phase 3: Untilt (0.90 to 1.00)
    
    double tiltProgress = 0.0;
    
    if (progress < 0.40) {
      // Start tilting halfway through the move to ensure it looks natural
      if (progress < 0.10) {
        tiltProgress = 0.0;
      } else {
        tiltProgress = (progress - 0.10) / 0.30;
      }
    } else if (progress < 0.90) {
      tiltProgress = 1.0;
    } else {
      // Untilt fast
      tiltProgress = 1.0 - ((progress - 0.90) / 0.10);
    }
    
    tiltProgress = Curves.easeInOutCubic.transform(tiltProgress.clamp(0.0, 1.0));
    final maxTilt = math.pi / 4; // 45 degrees
    return maxTilt * tiltProgress * tiltDirection;
  }



  @override
  Widget build(BuildContext context) {
    int? pouringLiquidCount;
    String? pouringColorId;
    
    final screenWidth = MediaQuery.of(context).size.width - (AppDimensions.screenPadding * 2);
    final tubeSlotWidth = AppDimensions.tubeWidth + AppDimensions.tubeSpacing;
    final tubesPerRow = (screenWidth / tubeSlotWidth).floor().clamp(1, tubes.length);
    final gridWidth = screenWidth;
    
    if (pouringFromIndex != null && pouringToIndex != null) {
      if (pouringFromIndex! < tubes.length && pouringToIndex! < tubes.length) {
        final sourceCount = tubes[pouringFromIndex!].topSameColorCount;
        final destSpace = tubes[pouringToIndex!].availableSpace;
        pouringLiquidCount = math.min(sourceCount, destSpace);
        
        if (tubes[pouringFromIndex!].liquids.isNotEmpty) {
          final top = tubes[pouringFromIndex!].topLiquid;
          if (top != null) {
             pouringColorId = top.colorId;
          }
        }
      }
    }
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppDimensions.screenPadding),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Main tube grid
          Container(
            width: double.infinity,
            child: Wrap(
              alignment: WrapAlignment.center,
              spacing: AppDimensions.tubeSpacing,
              runSpacing: AppDimensions.tubeSpacing + 20,
              children: List.generate(tubes.length, (index) {
                return TubeWidget(
                  tube: tubes[index],
                  isSelected: selectedIndex == index,
                  isPouringFrom: pouringFromIndex == index, // Used for logical state
                  isPouringTo: pouringToIndex == index,
                  pourProgress: pouringFromIndex == index || pouringToIndex == index 
                      ? pourProgress 
                      : 0.0,
                  targetOffset: Offset.zero, // Disable internal Grid animation
                  pouringLiquidCount: pouringLiquidCount,
                  pouringColorId: pouringColorId,
                  isHidden: pouringFromIndex == index && pourProgress > 0, // Hide during animation
                  isMysteryMode: isMysteryMode && (pouringFromIndex != index) && (pouringToIndex != index), // Only mystery if NOT interacting? OR just always mystery?
                  // Better: Always mystery, let TubeWidget handle the logic. 
                  // But wait, if we are pouring FROM it, we might want to reveal? behavior is debatable.
                  // "Only top layer visible". When pouring, the top layer is moving. 
                  // TubeWidget logic already handles "isTop" check even during pour.
                  // So we just pass isMysteryMode.
                  onTap: () => onTubeTap(index),
                );
              }),
            ),
          ),
          
          // Moving Tube Overlay
          if (pouringFromIndex != null && pouringToIndex != null)
             _buildMovingTubeOverlay(
               context,
               tubes[pouringFromIndex!],
               _calculateTubeCenter(pouringFromIndex!, tubesPerRow, gridWidth),
               _calculateTubeCenter(pouringToIndex!, tubesPerRow, gridWidth),
               pourProgress,
               isMysteryMode // Pass the flag
             ),
        ],
      ),
    );
  }

  Widget _buildMovingTubeOverlay(BuildContext context, TubeModel tube, Offset startPos, Offset targetPos, double progress, bool isMysteryMode) {
    if (progress <= 0 || progress >= 1.0) return const SizedBox.shrink();

    // 1. Calculate Motion Progress
    // New Phasing for 600ms Duration:
    // 0.0 - 0.40: Lift, Move, Tilt (Arrive at target)
    // 0.40 - 0.90: Pour (Hold Position)
    // 0.90 - 1.00: Return
    
    double moveProgress = 0.0;
    if (progress < 0.40) {
      moveProgress = progress / 0.40;
    } else if (progress < 0.90) {
      moveProgress = 1.0;
    } else {
      moveProgress = 1.0 - ((progress - 0.90) / 0.10);
    }
    moveProgress = Curves.easeInOutCubic.transform(moveProgress.clamp(0.0, 1.0));
    
    // 2. Calculate Tilt (Needed for X offset calculation)
    final isTargetRight = targetPos.dx > startPos.dx;
    final tiltDirection = isTargetRight ? 1.0 : -1.0;
    final maxTilt = math.pi / 4; // 45 degrees
    
    // Calculate Swing Compensation
    // When rotated 45 degrees, the top tip swings horizontally by Height * sin(45).
    // Width also contributes.
    // We want the Rotated Tip to align with Target Center.
    // Formula: Dist = Swing + HalfWidth.
    final swingX = AppDimensions.tubeHeight * math.sin(maxTilt);
    final halfWidth = AppDimensions.tubeWidth / 2;
    
    // We want to land slightly off-center (toward the pouring side) so the stream falls IN the tube.
    // Let's aim for Target Center +/- 10px.
    final visualAdjustment = 10.0; 

    final xOffset = isTargetRight 
        ? -(swingX + halfWidth - visualAdjustment) 
        : (swingX + halfWidth - visualAdjustment);
        
    final yOffset = -50.0;
    
    final targetBasePos = targetPos + Offset(xOffset, yOffset);
    final currentLeft = startPos.dx + (targetBasePos.dx - startPos.dx) * moveProgress;
    final currentTop = startPos.dy + (targetBasePos.dy - startPos.dy) * moveProgress;
    
    // Convert Bottom-Center (currentLeft, currentTop) to Top-Left for Positioned
    final posLeft = currentLeft - (AppDimensions.tubeWidth / 2);
    final posTop = currentTop - AppDimensions.tubeHeight;
    
    final tiltAngle = _calculateTiltAngle(progress, tiltDirection);
    final pivotAlignment = isTargetRight ? Alignment.bottomRight : Alignment.bottomLeft;

    // Stream Calculation
    // Only show stream if we are in the pour phase (after move/tilt completes)
    Widget? streamWidget;
    if (tube.liquids.isNotEmpty && progress > 0.40 && progress < 0.90) {
      // Get themed liquid color
      final settings = context.read<SettingsProvider>();
      final theme = ThemeService.getActiveTheme(settings);
      final color = AppColors.getLiquidColorFromTheme(tube.topLiquid!.colorId, theme);
      
      // Calculate where the stream needs to go RELATIVE to the moving tube
      // We know:
      // 1. Pivot Point in Global Space
      final tubeW = AppDimensions.tubeWidth;
      final tubeH = AppDimensions.tubeHeight;
      final pivotGlobal = isTargetRight 
          ? Offset(posLeft + tubeW, posTop + tubeH)
          : Offset(posLeft, posTop + tubeH);
          
      // 2. Target Top Center in Global Space
      final targetTopCenterGlobal = targetPos + Offset(0, -tubeH);
      
      // 3. Vector from Pivot -> Target
      final pivotToTarget = targetTopCenterGlobal - pivotGlobal;
      
      // 4. Rotate vector into Local Space (counter-rotate by tiltAngle)
      final cosA = math.cos(-tiltAngle);
      final sinA = math.sin(-tiltAngle);
      
      final localX = pivotToTarget.dx * cosA - pivotToTarget.dy * sinA;
      final localY = pivotToTarget.dx * sinA + pivotToTarget.dy * cosA;
      
      // 5. Convert to Stream Widget Coordinates
      // Stream Widget is at Top-Right (Right Pour) or Top-Left (Left Pour) inside standard Stack scaling
      // If Right: Pivot in properties is (W, H). Stream Origin is (W, 0).
      // Stream Origin relative to Pivot is (0, -H).
      // Target Relative to Pivot = (localX, localY).
      // Target Relative to Stream Origin = (localX, localY) - (0, -H) = (localX, localY + H).
      
      // If Left: Pivot is (0, H). Stream Origin is (0, 0).
      // Stream Origin relative to Pivot is (0, -H).
      // Target Relative to Pivot = (localX, localY).
      // Target Relative to Stream Origin = (localX, localY + H).
      
      final p2 = Offset(localX, localY + tubeH);
      
      streamWidget = Positioned(
        top: 0,
        right: isTargetRight ? 0 : null,
        left: isTargetRight ? null : 0,
        // Give it size 0 so it doesn't affect layout, but CustomPaint paints outside
        child: SizedBox(
          width: 0, 
          height: 0,
          child: LiquidPourStream(
             liquidColor: color,
             sourceStartPoint: Offset.zero,
             targetTopPoint: p2,
             pourProgress: progress,
             tiltAngle: tiltAngle,
          ),
        ),
      );
    }

    return Positioned(
      left: posLeft,
      top: posTop,
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
              isMysteryMode: isMysteryMode, // Apply the flag to the moving tube 
            ),
            if (streamWidget != null) streamWidget,
          ],
        ),
      ),
    );
  }
}

/// Action buttons row
class _ActionButtons extends StatelessWidget {
  final bool canUndo;
  final VoidCallback onUndo;
  final VoidCallback onReset;
  final VoidCallback onHint;
  
  const _ActionButtons({
    required this.canUndo,
    required this.onUndo,
    required this.onReset,
    required this.onHint,
  });
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppDimensions.screenPadding),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _ActionButton(
            icon: Icons.undo_rounded,
            label: 'Undo',
            enabled: canUndo,
            onTap: onUndo,
          ),
          const SizedBox(width: 16),
          _ActionButton(
            icon: Icons.refresh_rounded,
            label: 'Reset',
            enabled: true,
            onTap: onReset,
          ),
          const SizedBox(width: 16),
          _ActionButton(
            icon: Icons.lightbulb_outline_rounded,
            label: 'Hint',
            enabled: true,
            onTap: onHint,
            isAccent: true,
          ),
        ],
      ),
    );
  }
}

/// Individual action button
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onTap;
  final bool isAccent;
  
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.enabled,
    required this.onTap,
    this.isAccent = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedOpacity(
        duration: AppAnimations.fast,
        opacity: enabled ? 1.0 : 0.4,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: isAccent 
                ? AppColors.accent.withValues(alpha: 0.2) 
                : AppColors.glassBase,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isAccent 
                  ? AppColors.accent.withValues(alpha: 0.5) 
                  : AppColors.glassBorder,
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: isAccent ? AppColors.accent : AppColors.textPrimary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isAccent ? AppColors.accent : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Win celebration dialog
class _WinDialog extends StatelessWidget {
  final int levelId;
  final int moves;
  final int stars;
  final VoidCallback onNextLevel;
  final VoidCallback onReplay;
  final VoidCallback onHome;
  
  const _WinDialog({
    required this.levelId,
    required this.moves,
    required this.stars,
    required this.onNextLevel,
    required this.onReplay,
    required this.onHome,
  });
  
  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.backgroundPrimary,
              AppColors.backgroundSecondary,
            ],
          ),
          borderRadius: BorderRadius.circular(AppDimensions.dialogRadius),
          border: Border.all(color: AppColors.glassBorder, width: 2),
          boxShadow: [
            BoxShadow(
              color: AppColors.success.withValues(alpha: 0.3),
              blurRadius: 30,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Trophy icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [AppColors.success, AppColors.accent],
                ),
              ),
              child: const Icon(
                Icons.emoji_events_rounded,
                size: 40,
                color: Colors.white,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Stars display
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(3, (index) {
                final isEarned = index < stars;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    isEarned ? Icons.star_rounded : Icons.star_border_rounded,
                    size: 40,
                    color: isEarned ? Colors.amber : AppColors.textMuted,
                  ),
                );
              }),
            ),
            
            const SizedBox(height: 16),
            
            Text(
              'Level Complete!',
              style: GoogleFonts.poppins(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            
            const SizedBox(height: 8),
            
            Text(
              'Level $levelId • $moves moves',
              style: GoogleFonts.poppins(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Buttons
            Row(
              children: [
                Expanded(
                  child: _DialogButton(
                    icon: Icons.home_rounded,
                    onTap: onHome,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _DialogButton(
                    icon: Icons.replay_rounded,
                    onTap: onReplay,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: _DialogButton(
                    icon: Icons.arrow_forward_rounded,
                    label: 'Next',
                    isPrimary: true,
                    onTap: onNextLevel,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Lose/Time Up Dialog
class _LoseDialog extends StatelessWidget {
  final VoidCallback onReplay;
  final VoidCallback onHome;
  final VoidCallback onWatchAd;
  
  const _LoseDialog({
    required this.onReplay,
    required this.onHome,
    required this.onWatchAd,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
       backgroundColor: Colors.transparent,
       child: Container(
         padding: const EdgeInsets.all(24),
         decoration: BoxDecoration(
           color: const Color(0xFF2A2A2A),
           borderRadius: BorderRadius.circular(24),
           border: Border.all(color: AppColors.error.withValues(alpha: 0.5), width: 2),
           boxShadow: [
             BoxShadow(
               color: AppColors.error.withValues(alpha: 0.2),
               blurRadius: 20,
               spreadRadius: 5,
             ),
           ],
         ),
         child: Column(
           mainAxisSize: MainAxisSize.min,
           children: [
             // Header
             const Text(
               'TIME\'S UP!',
               style: TextStyle(
                 color: AppColors.error,
                 fontSize: 28,
                 fontWeight: FontWeight.bold,
                 letterSpacing: 1.5,
               ),
             ),
             const SizedBox(height: 16),
             
             const Text(
               'You ran out of time!',
               style: TextStyle(color: Colors.white70, fontSize: 16),
             ),
             const SizedBox(height: 24),
             
             // Extra Time Option
             GestureDetector(
               onTap: onWatchAd,
               child: Container(
                 padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                 decoration: BoxDecoration(
                   gradient: const LinearGradient(
                     colors: [Color(0xFF6A11CB), Color(0xFF2575FC)],
                   ),
                   borderRadius: BorderRadius.circular(16),
                   boxShadow: [
                      BoxShadow(color: Colors.blue.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4)),
                   ],
                 ),
                 child: Row(
                   mainAxisAlignment: MainAxisAlignment.center,
                   children: [
                     const Icon(Icons.play_circle_fill, color: Colors.white),
                     const SizedBox(width: 8),
                     Column(
                       crossAxisAlignment: CrossAxisAlignment.start,
                       children: const [
                         Text('Get +60 Seconds', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                         Text('Watch Ad', style: TextStyle(color: Colors.white70, fontSize: 12)),
                       ],
                     ),
                   ],
                 ),
               ),
             ),
             
             const SizedBox(height: 20),
             
             Row(
               children: [
                 Expanded(
                   child: _DialogButton(
                     icon: Icons.home_rounded,
                     onTap: onHome,
                   ),
                 ),
                 const SizedBox(width: 12),
                 Expanded(
                   child: _DialogButton(
                     icon: Icons.replay_rounded,
                     label: 'Retry',
                     isPrimary: false, 
                     onTap: onReplay,
                   ),
                 ),
               ],
             ),
           ],
         ),
       ),
    );
  }
}

/// Dialog button
class _DialogButton extends StatelessWidget {
  final IconData icon;
  final String? label;
  final bool isPrimary;
  final VoidCallback onTap;
  
  const _DialogButton({
    required this.icon,
    this.label,
    this.isPrimary = false,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          gradient: isPrimary ? AppColors.buttonGradient : null,
          color: isPrimary ? null : AppColors.glassBase,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isPrimary ? Colors.transparent : AppColors.glassBorder,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: Colors.white,
              size: 22,
            ),
            if (label != null) ...[
              const SizedBox(width: 8),
              Text(
                label!,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
