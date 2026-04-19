/// Game canvas for Block Stack 2048.
/// Combines grid and block painters with animation controllers.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/audio_service.dart';
import '../models/block.dart';
import '../game/game_state.dart';
import '../game/app_state.dart';
import '../utils/animation_utils.dart';
import 'grid_painter.dart';
import 'block_painter.dart';

/// Main game canvas widget
class GameCanvas extends StatefulWidget {
  const GameCanvas({super.key});
  
  @override
  State<GameCanvas> createState() => _GameCanvasState();
}

class _GameCanvasState extends State<GameCanvas> with TickerProviderStateMixin {
  late AnimationController _shootController;
  late AnimationController _mergeController;
  late Animation<double> _shootAnimation;
  late Animation<double> _mergeAnimation;
  
  // Track merging blocks for animation
  List<Block> _mergingBlocks = [];
  String? _newMergedBlockId;
  
  @override
  void initState() {
    super.initState();
    
    _shootController = AnimationController(
      // Slower animation for better visibility
      duration: const Duration(milliseconds: 400), 
      vsync: this,
    );
    
    _mergeController = AnimationController(
      // Slower animation for better visibility
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    
    _shootAnimation = CurvedAnimation(
      parent: _shootController,
      curve: AnimationCurves.shoot,
    );
    
    _mergeAnimation = CurvedAnimation(
      parent: _mergeController,
      curve: Curves.easeOutQuart,
    );
    
    _shootController.addStatusListener(_onShootAnimationStatus);
    _mergeController.addStatusListener(_onMergeAnimationStatus);
  }
  
  void _onShootAnimationStatus(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      final gameState = context.read<GameState>();
      gameState.completeShoot();
      
      // Check for merge and animate if needed
      final mergeResult = gameState.processMerge();
      if (mergeResult != null) {
        setState(() {
          _mergingBlocks = mergeResult.removedBlocks;
          _newMergedBlockId = mergeResult.newBlock.id;
        });
        _mergeController.forward(from: 0.0);
        // Play merge sound when animation starts
        AudioService().playMerge();
      } else {
        gameState.finalizeTurn();
      }
    }
  }
  
  void _onMergeAnimationStatus(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      final gameState = context.read<GameState>();
      
      // completeMerge now returns a MergeResult if there's a chain merge
      final chainMerge = gameState.completeMerge();
      
      if (chainMerge != null) {
        // There's another merge! Animate it
        setState(() {
          _mergingBlocks = chainMerge.removedBlocks;
          _newMergedBlockId = chainMerge.newBlock.id;
        });
        _mergeController.forward(from: 0.0);
        // Play merge sound for chain merge
        AudioService().playMerge();
      } else {
        // No more merges, clear animation state
        setState(() {
          _mergingBlocks = [];
          _newMergedBlockId = null;
        });
      }
    }
  }
  
  @override
  void dispose() {
    _shootController.dispose();
    _mergeController.dispose();
    super.dispose();
  }
  
  /// Start shooting animation
  void _startShootAnimation() {
    _shootController.forward(from: 0.0);
    // Notify audio service that user is actively playing
    AudioService().onGameplayAction();
  }
  
  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    
    return Consumer<GameState>(
      builder: (context, gameState, child) {
        // Listen for phase changes to trigger animations
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (gameState.phase == GamePhase.shooting && !_shootController.isAnimating) {
            _startShootAnimation();
          }
        });
        
        return AnimatedBuilder(
          animation: Listenable.merge([_shootController, _mergeController]),
          builder: (context, child) {
            // Hide active block during merging to prevent glitch
            final showActiveBlock = gameState.phase != GamePhase.merging && 
                                     _mergingBlocks.isEmpty;
            
            return CustomPaint(
              size: const Size(kGridWidth, kGridHeight + kSpawnAreaHeight),
              painter: _CombinedPainter(
                gridPainter: GridPainter(),
                blockPainter: BlockPainter(
                  blocks: gameState.gridBlocks,
                  activeBlock: showActiveBlock ? gameState.activeBlock : null,
                  activeColumn: gameState.currentColumn,
                  shootProgress: _shootAnimation.value,
                  targetRow: gameState.targetRow,
                  isShooting: gameState.phase == GamePhase.shooting,
                  mergeProgress: _mergeAnimation.value,
                  mergingBlocks: _mergingBlocks,
                  newMergedBlockId: _newMergedBlockId,
                  themeId: appState.activeThemeId,
                ),
              ),
            );
          },
        );
      },
    );
  }
}

/// Combined painter that draws grid then blocks
class _CombinedPainter extends CustomPainter {
  final GridPainter gridPainter;
  final BlockPainter blockPainter;
  
  _CombinedPainter({
    required this.gridPainter,
    required this.blockPainter,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    // First draw the grid background
    gridPainter.paint(canvas, Size(kGridWidth, kGridHeight));
    
    // Then draw all blocks
    blockPainter.paint(canvas, size);
  }
  
  @override
  bool shouldRepaint(covariant _CombinedPainter oldDelegate) {
    return gridPainter.shouldRepaint(oldDelegate.gridPainter) ||
           blockPainter.shouldRepaint(oldDelegate.blockPainter);
  }
}
