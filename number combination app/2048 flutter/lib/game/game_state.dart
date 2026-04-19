/// Game state for Block Stack 2048.
/// Central state management using ChangeNotifier.
library;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vibration/vibration.dart';
import '../models/block.dart';
import '../models/position.dart';
import '../core/audio_service.dart';
import 'grid_manager.dart';
import 'block_spawner.dart';
import 'merge_engine.dart';

/// Game phases
enum GamePhase {
  spawning,
  playerInput,
  shooting,
  snapping,
  merging,
  paused,
  gameOver,
}

enum TutorialStep {
  welcome,       // "Welcome! Drag to aim"
  drag,          // "Release to shoot"
  merge,         // "Match blocks to merge!"
  completed      // "You're ready!"
}

/// Main game state
class GameState extends ChangeNotifier {
  /// Grid manager
  late final GridManager gridManager;
  
  /// Block spawner
  late final BlockSpawner blockSpawner;
  
  /// Merge engine
  late final MergeEngine mergeEngine;
  
  /// Current game phase
  GamePhase _phase = GamePhase.spawning;
  GamePhase get phase => _phase;
  
  /// Current score
  int _score = 0;
  int get score => _score;
  
  /// Best score
  int _bestScore = 0;
  int get bestScore => _bestScore;
  
  /// Highest block value achieved in current game (for difficulty scaling)
  int _highestBlockInGame = 2;
  int get highestBlockInGame => _highestBlockInGame;
  
  /// Active block being controlled by player
  Block? _activeBlock;
  Block? get activeBlock => _activeBlock;
  
  /// Current column the active block is aligned with (0 to columns-1)
  int _currentColumn = 2; // Start in middle
  int get currentColumn => _currentColumn;
  
  /// Target row for the active block (where it will land)
  int _targetRow = -1;
  int get targetRow => _targetRow;
  
  /// Animation progress (0.0 to 1.0)
  double _animationProgress = 0.0;
  double get animationProgress => _animationProgress;
  
  /// Whether the game is processing (no input allowed)
  bool get isProcessing => 
      _phase == GamePhase.shooting || 
      _phase == GamePhase.snapping || 
      _phase == GamePhase.merging;
  
  /// SharedPreferences instance
  SharedPreferences? _prefs;
  
  /// Callback to check if vibration is enabled
  bool Function()? _isVibrationEnabled;
  
  // Tutorial State
  bool _isTutorialMode = false;
  TutorialStep _tutorialStep = TutorialStep.welcome;
  
  bool get isTutorialMode => _isTutorialMode;
  TutorialStep get tutorialStep => _tutorialStep;

  GameState() {
    gridManager = GridManager();
    blockSpawner = BlockSpawner();
    mergeEngine = MergeEngine(gridManager);
    _loadGameState();
  }
  
  /// Set the vibration enabled checker
  void setVibrationEnabledChecker(bool Function() checker) {
    _isVibrationEnabled = checker;
  }
  
  /// Trigger haptic feedback if enabled
  Future<void> _triggerHapticFeedback() async {
    if (_isVibrationEnabled?.call() == true) {
      final hasVibrator = await Vibration.hasVibrator();
      if (hasVibrator == true) {
        Vibration.vibrate(duration: 50);
      }
    }
  }
  
  /// Start the interactive tutorial
  void startTutorial() {
    _isTutorialMode = true;
    _tutorialStep = TutorialStep.welcome;
    
    // Force simple sequence for tutorial: 2, 2, 2, 2...
    blockSpawner.setForcedSequence([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
    
    startGame();
  }

  /// Initialize and start a new game
  void startGame() {
    if (!_isTutorialMode) {
        // Clear forced sequence if normal game
        blockSpawner.setForcedSequence([]);
    }
    
    gridManager.clear();
    _score = 0;
    _highestBlockInGame = 2;  // Reset difficulty tracking
    _phase = GamePhase.spawning;
    resetBlockIdCounter();
    _clearSavedGame(); 
    _spawnNextBlock();
    notifyListeners();
  }
  
  /// Save best score to storage
  Future<void> _saveBestScore() async {
    await _prefs?.setInt('bestScore', _bestScore);
  }
  
  /// Save current game state to storage
  Future<void> _saveGameState() async {
    if (_prefs == null) return;
    
    await _prefs!.setInt('savedScore', _score);
    
    // Save grid state as JSON-like string list
    final gridData = <String>[];
    for (int row = 0; row < gridManager.rows; row++) {
      for (int col = 0; col < gridManager.columns; col++) {
        final block = gridManager.getBlockAt(GridPosition(row, col));
        if (block != null) {
          gridData.add('$row,$col,${block.value}');
        }
      }
    }
    await _prefs!.setStringList('savedGrid', gridData);
  }
  
  /// Load saved game state from storage
  Future<void> _loadGameState() async {
    _prefs = await SharedPreferences.getInstance();
    _bestScore = _prefs?.getInt('bestScore') ?? 0;
    
    // Try to load saved game
    final savedScore = _prefs?.getInt('savedScore');
    final savedGrid = _prefs?.getStringList('savedGrid');
    
    if (savedScore != null && savedGrid != null && savedGrid.isNotEmpty) {
      // Restore saved game
      _score = savedScore;
      gridManager.clear();
      
      // Restore grid blocks
      for (final blockData in savedGrid) {
        final parts = blockData.split(',');
        if (parts.length == 3) {
          final row = int.parse(parts[0]);
          final col = int.parse(parts[1]);
          final value = int.parse(parts[2]);
          final block = blockSpawner.spawnBlockWithValue(value);
          gridManager.placeBlockAt(block, GridPosition(row, col));
        }
      }
      
      // Start with player input phase
      _phase = GamePhase.spawning;
      _spawnNextBlock();
    }
    
    notifyListeners();
  }
  
  /// Clear saved game state (called when game ends or restarts)
  Future<void> _clearSavedGame() async {
    await _prefs?.remove('savedScore');
    await _prefs?.remove('savedPhase');
    await _prefs?.remove('savedGrid');
  }
  
 /// Spawn the next block with difficulty based on highest block achieved
  void _spawnNextBlock() {
    _activeBlock = blockSpawner.spawnBlock(score: _score, highestBlock: _highestBlockInGame);
    _currentColumn = gridManager.columns ~/ 2; // Start in middle
    _phase = GamePhase.playerInput;
    notifyListeners();
  }
  
  /// Move active block to a column
  void moveToColumn(int column) {
    if (_phase != GamePhase.playerInput) return;
    if (column < 0 || column >= gridManager.columns) return;
    
    _currentColumn = column;
    notifyListeners();
  }
  
  /// Update horizontal position during drag
  void updateDragPosition(double deltaX, double gridWidth) {
    if (_phase != GamePhase.playerInput) return;
    
    // Tutorial: Advance from welcome to drag
    if (_isTutorialMode && _tutorialStep == TutorialStep.welcome) {
       _tutorialStep = TutorialStep.drag;
    }
    
    // Calculate column based on drag position
    final cellWidth = gridWidth / gridManager.columns;
    final newColumn = (_currentColumn + deltaX / cellWidth).round();
    
    if (newColumn >= 0 && newColumn < gridManager.columns) {
      _currentColumn = newColumn;
      notifyListeners();
    }
  }
  
  /// Set the exact column from drag position
  void setColumnFromPosition(double x, double gridWidth) {
    if (_phase != GamePhase.playerInput) return;
    
    final cellWidth = gridWidth / gridManager.columns;
    final column = (x / cellWidth).floor().clamp(0, gridManager.columns - 1);
    _currentColumn = column;
    notifyListeners();
  }
  
  /// Release the block to shoot upward
  void releaseBlock() {
    if (_phase != GamePhase.playerInput || _activeBlock == null) return;
    
    // Check if column is full
    final targetRow = gridManager.getTopEmptyRow(_currentColumn);
    if (targetRow == -1) {
      // Column is full, can't place block
      return;
    }
    
    _targetRow = targetRow;
    _phase = GamePhase.shooting;
    _animationProgress = 0.0;
    
    // Play shoot sound
    AudioService().playShoot();
    
    notifyListeners();
  }
  
  /// Update shooting animation progress
  void updateShootAnimation(double progress) {
    _animationProgress = progress;
    notifyListeners();
  }
  
  /// Complete the shooting animation and snap block into grid
  void completeShoot() {
    if (_activeBlock == null || _targetRow == -1) return;
    
    _phase = GamePhase.snapping;
    
    // Place the block in the grid
    final position = GridPosition(_targetRow, _currentColumn);
    gridManager.placeBlockAt(_activeBlock!, position);
    
    // Play place sound
    AudioService().playPlace();
    
    _phase = GamePhase.merging;
    
    // Tutorial: Step progression
    if (_isTutorialMode && _tutorialStep == TutorialStep.drag) {
        // After first shot, now we want them to merge
        _tutorialStep = TutorialStep.merge;
    }
    
    notifyListeners();
    
    // Check for merges (will be called by animation controller)
  }
  
  /// Process merges after block placement
  MergeResult? processMerge() {
    if (_phase != GamePhase.merging) return null;
    
    final placedPosition = GridPosition(_targetRow, _currentColumn);
    final result = mergeEngine.tryMerge(placedPosition);
    
    if (result != null) {
      // Update score
      _score += result.scoreEarned;
      
      // Track highest block for difficulty
      if (result.newBlock.value > _highestBlockInGame) {
        _highestBlockInGame = result.newBlock.value;
      }
      
      // Sound is now played by game_canvas when animation starts
      
      // Trigger haptic feedback on merge
      _triggerHapticFeedback();
      
      // Check for new best score
      if (_score > _bestScore) {
        _bestScore = _score;
        _saveBestScore();
      }
      
      // Tutorial: Completion
      if (_isTutorialMode && _tutorialStep == TutorialStep.merge) {
         _tutorialStep = TutorialStep.completed;
      }
      
      notifyListeners();
    }
    
    return result;
  }
  
  /// Complete merge animation and check for chain reactions
  MergeResult? completeMerge() {
    // Apply gravity - blocks rise UP
    mergeEngine.applyGravity();
    
    // Check for ONE chain merge (we'll animate it before looking for more)
    final nextMerge = mergeEngine.processNextMerge();
    
    if (nextMerge != null) {
      // Process this chain merge
      _score += nextMerge.scoreEarned;
      
      // Track highest block for difficulty (chain merges too)
      if (nextMerge.newBlock.value > _highestBlockInGame) {
        _highestBlockInGame = nextMerge.newBlock.value;
      }
      
      // Trigger haptic feedback on chain merge too
      _triggerHapticFeedback();
      
      if (_score > _bestScore) {
        _bestScore = _score;
        _saveBestScore();
      }
      
      notifyListeners();
      return nextMerge; // Return for animation
    }
    
    // No more merges - finalize turn
    notifyListeners();
    
    // Check for game over
    if (gridManager.isGridFull()) {
      _phase = GamePhase.gameOver;
      _clearSavedGame(); // Clear saved game on game over
      
      // Play game over sound
      AudioService().playGameOver();
      
      notifyListeners();
      return null;
    }
    
    // Spawn next block
    _activeBlock = null;
    _phase = GamePhase.spawning;
    _spawnNextBlock();
    _saveGameState(); // Save progress after each turn
    return null;
  }
  
  /// Finalize turn after all animations complete
  void finalizeTurn() {
    if (_phase == GamePhase.gameOver) return;
    
    // Check for game over
    if (gridManager.isGridFull()) {
      _phase = GamePhase.gameOver;
      _clearSavedGame(); // Clear saved game on game over
      notifyListeners();
      return;
    }
    
    // Spawn next block
    _activeBlock = null;
    _targetRow = -1;
    _phase = GamePhase.spawning;
    _spawnNextBlock();
    _saveGameState(); // Save progress after each turn
  }
  
  /// Pause the game
  void pause() {
    if (_phase != GamePhase.playerInput) return;
    _phase = GamePhase.paused;
    notifyListeners();
  }
  
  /// Resume the game
  void resume() {
    if (_phase != GamePhase.paused) return;
    _phase = GamePhase.playerInput;
    notifyListeners();
  }
  
  /// Reset best score (called from settings reset)
  void resetBestScore() {
    _bestScore = 0;
    _prefs?.remove('bestScore');
    notifyListeners();
  }
  
  /// Restart the game
  void restart() {
    startGame();
  }
  
  /// Get the number of columns
  int get columns => gridManager.columns;
  
  /// Get the number of rows
  int get rows => gridManager.rows;
  
  /// Get all blocks in the grid for rendering
  List<Block> get gridBlocks => gridManager.getAllBlocks();
}
