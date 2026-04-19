/// Gesture controller for Block Stack 2048.
/// Handles touch input for dragging and releasing blocks.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../game/game_state.dart';

/// Widget that wraps the game canvas and handles gestures
class GestureController extends StatefulWidget {
  final Widget child;
  
  const GestureController({
    super.key,
    required this.child,
  });
  
  @override
  State<GestureController> createState() => _GestureControllerState();
}

class _GestureControllerState extends State<GestureController> {
  double _dragStartX = 0.0;
  int _startColumn = 0;
  
  @override
  Widget build(BuildContext context) {
    // Watch GameState to rebuild on changes
    context.watch<GameState>();
    
    return GestureDetector(
      onHorizontalDragStart: _onDragStart,
      onHorizontalDragUpdate: _onDragUpdate,
      onHorizontalDragEnd: _onDragEnd,
      onTapUp: _onTapUp,
      behavior: HitTestBehavior.opaque,
      child: widget.child,
    );
  }
  
  void _onDragStart(DragStartDetails details) {
    final gameState = context.read<GameState>();
    if (gameState.isProcessing) return;
    
    _dragStartX = details.localPosition.dx;
    _startColumn = gameState.currentColumn;
  }
  
  void _onDragUpdate(DragUpdateDetails details) {
    final gameState = context.read<GameState>();
    if (gameState.isProcessing) return;
    
    // Calculate the new column based on drag distance
    final deltaX = details.localPosition.dx - _dragStartX;
    final cellWidth = kGridWidth / gameState.columns;
    final columnDelta = (deltaX / cellWidth).round();
    
    final newColumn = (_startColumn + columnDelta).clamp(0, gameState.columns - 1);
    gameState.moveToColumn(newColumn);
  }
  
  void _onDragEnd(DragEndDetails details) {
    final gameState = context.read<GameState>();
    if (gameState.isProcessing) return;
    
    // Release the block to shoot upward
    gameState.releaseBlock();
  }
  
  void _onTapUp(TapUpDetails details) {
    final gameState = context.read<GameState>();
    if (gameState.isProcessing) return;
    
    // Tap to select column and shoot
    final cellWidth = kGridWidth / gameState.columns;
    final column = (details.localPosition.dx / cellWidth).floor().clamp(0, gameState.columns - 1);
    
    gameState.moveToColumn(column);
    gameState.releaseBlock();
  }
}
