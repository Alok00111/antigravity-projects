import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import '../data/models/tube_model.dart';
import '../core/utils/liquid_logic.dart';
import '../core/utils/level_generator.dart';
import '../core/utils/sound_manager.dart';
import '../core/utils/level_solver.dart';

/// Game state for storing previous states (undo functionality)
class GameState {
  final List<TubeModel> tubes;
  final int moves;
  
  const GameState({required this.tubes, required this.moves});
}

/// Game provider for managing game state
class GameProvider extends ChangeNotifier {
  final SoundManager _soundManager = SoundManager();
  
  // Current game state
  List<TubeModel> _tubes = [];
  int? _selectedTubeIndex;
  int _moves = 0;
  int _currentLevelId = 1;
  bool _isWon = false;
  bool _isPouring = false;
  bool _isMysteryMode = false;
  bool _isLost = false; // "Time Up" State
  
  // Timer state
  Timer? _timer;
  int _timeRemaining = 0; // Seconds remaining
  int _initialTime = 0; // Time limit for current level
  bool _timerPaused = false;
  
  // Move history for undo
  final List<GameState> _moveHistory = [];
  static const int _maxHistorySize = 50;
  
  // Pre-computed solution path (mostly for generated levels)
  List<({int from, int to})>? _cachedSolutionPath;
  List<TubeModel>? _cachedSolutionStartTubes;
  
  // Pour animation state
  int? _pouringFromIndex;
  int? _pouringToIndex;
  
  // Getters
  List<TubeModel> get tubes => _tubes;
  int? get selectedTubeIndex => _selectedTubeIndex;
  int get moves => _moves;
  int get currentLevelId => _currentLevelId;
  bool get isWon => _isWon;
  bool get isLost => _isLost;
  bool get canUndo => _moveHistory.isNotEmpty;
  bool get isPouring => _isPouring;
  bool get isMysteryMode => _isMysteryMode;
  int? get pouringFromIndex => _pouringFromIndex;
  int? get pouringToIndex => _pouringToIndex;
  
  // Timer Getters
  int get timeRemaining => _timeRemaining;
  int get initialTime => _initialTime;
  String get formattedTime {
    final minutes = _timeRemaining ~/ 60;
    final seconds = _timeRemaining % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
  bool get timerPaused => _timerPaused;
  int get elapsedTime => _initialTime - _timeRemaining; // Seconds elapsed
  
  /// Get time limit in seconds (max time before level fails or 1 star)
  static int getTimeLimit(int levelId) {
    return 120; // Fixed 2 minutes for all levels
  }
  
  /// Calculate star thresholds based on optimal moves
  /// Returns (threeStarTime, twoStarTime) in seconds
  static ({int threeStar, int twoStar}) getStarThresholds(int optimalMoves) {
    // Base: 10 moves = 25s for 3 star, 60s for 2 star
    // Every 10 moves: double 3-star time, increase 2-star by 50%
    
    final moveGroups = (optimalMoves / 10).ceil().clamp(1, 20);
    
    // 3-star: 25s base, doubles every 10 moves
    // moveGroups=1 (1-10 moves): 25s
    // moveGroups=2 (11-20 moves): 50s
    // moveGroups=3 (21-30 moves): 100s
    int threeStarTime = 25;
    for (int i = 1; i < moveGroups; i++) {
      threeStarTime = (threeStarTime * 2).clamp(0, 120);
    }
    
    // 2-star: 60s base, increases 50% every 10 moves
    // moveGroups=1: 60s, moveGroups=2: 90s, moveGroups=3: 135s (capped at 120)
    double twoStarTime = 60.0;
    for (int i = 1; i < moveGroups; i++) {
      twoStarTime = (twoStarTime * 1.5).clamp(0, 120);
    }
    
    return (threeStar: threeStarTime, twoStar: twoStarTime.toInt());
  }
  
  /// Calculate stars based on completion time and optimal moves
  /// Calculate stars based on completion time and optimal moves
  int calculateStars() {
    if (!_isWon) return 0;
    
    // Get optimal moves. If unknown, assume user played optimally (don't punish).
    int optimalMoves = _cachedSolutionPath?.length ?? math.max(_moves, 10);
    
    // Time metrics
    double timePercent = _timeRemaining / _initialTime;
    
    // Move metrics
    double moveRatio = _moves / optimalMoves; // 1.0 = perfect, >1.0 = worse
    
    debugPrint('⭐ Calc: Time=${(timePercent*100).toInt()}% ($_timeRemaining/$_initialTime), Moves=$moveRatio ($_moves/$optimalMoves)');
    
    // 3 Stars: Good Time (>40%) AND Efficient Moves (within 1.5x)
    if (timePercent >= 0.40 && moveRatio <= 1.5) {
      return 3;
    }
    
    // 2 Stars: Decent Time (>15%) OR Decent Moves (within 2.2x)
    // Allows slower players to get 2 stars if efficient, 
    // or sloppy players if fast.
    if (timePercent >= 0.15 || moveRatio <= 2.2) {
      return 2;
    }
    
    return 1; // Completed
  }
  
  /// Load a specific level
  Future<void> loadLevel(int levelId) async {
    // Stop any existing timer
    stopTimer();
    
    _currentLevelId = levelId;
    _selectedTubeIndex = null;
    _moves = 0;
    _isWon = false;
    _isPouring = false;
    _isMysteryMode = false;
    _pouringFromIndex = null;
    _pouringToIndex = null;
    _moveHistory.clear();
    
    // Initialize timer
    _initialTime = getTimeLimit(levelId);
    _timeRemaining = _initialTime;
    _timerPaused = false;
    
    final levelData = await LevelGenerator.loadLevel(levelId);
    if (levelData != null) {
      _tubes = levelData.tubes.map((t) => t.copyWith()).toList();
      _isMysteryMode = levelData.isMystery;
      // Store initial state for solution path validation
      _cachedSolutionStartTubes = levelData.tubes.map((t) => t.copyWith()).toList();
      _cachedSolutionPath = levelData.solution;
    } else {
      // Fallback to first level
      final levels = await LevelGenerator.loadAllLevels();
      if (levels.isNotEmpty) {
        _tubes = levels.first.tubes.map((t) => t.copyWith()).toList();
      }
    }
    
    // Start timer
    debugPrint('🎮 loadLevel complete, starting timer with $_timeRemaining seconds');
    _startTimer();
    
    notifyListeners();
  }

  /// Load a custom level object (e.g. for Tutorial)
  void loadCustomLevel(LevelData level) {
    // Stop any existing timer first
    stopTimer();
    
    _currentLevelId = level.id;
    _selectedTubeIndex = null;
    _moves = 0;
    _isWon = false;
    _isLost = false; // Reset lost state
    _isPouring = false;
    _isMysteryMode = level.isMystery;
    _pouringFromIndex = null;
    _pouringToIndex = null;
    
    _tubes = level.tubes.map((t) => t.copyWith()).toList();
    _cachedSolutionPath = level.solution;
    _cachedSolutionStartTubes = level.tubes.map((t) => t.copyWith()).toList();
    
    _moveHistory.clear();
    
    // Initialize and start timer (skip for tutorial level 0)
    if (level.id > 0) {
      _initialTime = getTimeLimit(level.id);
      _timeRemaining = _initialTime;
      _timerPaused = false;
      debugPrint('🎮 loadCustomLevel complete, starting timer with $_timeRemaining seconds');
      _startTimer();
    }
    
    notifyListeners();
  }
  
  /// Select or deselect a tube
  void selectTube(int index) {
    if (_isPouring || _isWon) return;
    
    if (_selectedTubeIndex == null) {
      // No tube selected, select this one if it has liquid
      if (_tubes[index].isEmpty) return;
      
      _selectedTubeIndex = index;
      _soundManager.playSelect();
      _soundManager.triggerHaptic(HapticType.light);
    } else if (_selectedTubeIndex == index) {
      // Same tube tapped, deselect
      _selectedTubeIndex = null;
    } else {
      // Different tube tapped, try to pour
      _attemptPour(index);
    }
    
    notifyListeners();
  }
  
  /// Attempt to pour from selected tube to target tube
  void _attemptPour(int toIndex) {
    final fromIndex = _selectedTubeIndex!;
    
    if (!LiquidLogic.canPour(_tubes[fromIndex], _tubes[toIndex])) {
      // Invalid pour - deselect and play error
      _selectedTubeIndex = null;
      _soundManager.playError();
      _soundManager.triggerHaptic(HapticType.error);
      notifyListeners();
      return;
    }
    
    // Save current state for undo
    _saveState();
    
    // Set pouring animation state
    _isPouring = true;
    _pouringFromIndex = fromIndex;
    _pouringToIndex = toIndex;
    _selectedTubeIndex = null;
    
    notifyListeners();
  }
  
  /// Complete the pour operation (called after animation)
  void completePour() {
    if (_pouringFromIndex == null || _pouringToIndex == null) return;
    
    final result = LiquidLogic.pourLiquid(_tubes, _pouringFromIndex!, _pouringToIndex!);
    
    if (result.success) {
      _tubes = result.newTubes;
      _moves++;
      
      _soundManager.playPour();
      _soundManager.triggerHaptic(HapticType.medium);
      
      // Check for win
      if (LiquidLogic.checkWinCondition(_tubes)) {
        _isWon = true;
        stopTimer(); // Stop timer on win
        _soundManager.playWin();
        _soundManager.triggerHaptic(HapticType.success);
      }
    }
    
    // Clear pouring state
    _isPouring = false;
    _pouringFromIndex = null;
    _pouringToIndex = null;
    
    notifyListeners();
  }
  
  /// Cancel pour animation without completing
  void cancelPour() {
    _isPouring = false;
    _pouringFromIndex = null;
    _pouringToIndex = null;
    notifyListeners();
  }
  
  /// Undo the last move
  void undoLastMove() {
    if (_moveHistory.isEmpty || _isPouring || _isWon) return;
    
    final previousState = _moveHistory.removeLast();
    _tubes = previousState.tubes;
    _moves = previousState.moves;
    _selectedTubeIndex = null;
    
    _soundManager.playClick();
    _soundManager.triggerHaptic(HapticType.light);
    
    notifyListeners();
  }
  
  /// Reset the current level
  Future<void> resetLevel() async {
    _soundManager.playClick();
    await loadLevel(_currentLevelId);
  }
  
  /// Get a hint for the next move
  ({int from, int to})? getHint() {
    if (_isWon || _isPouring) return null;
    
    // 1. Try Pre-computed Solution
    if (_cachedSolutionPath != null && _cachedSolutionPath!.isNotEmpty && _cachedSolutionStartTubes != null) {
      // Logic:
      // The user might have made arbitrary moves, deviating from the 'start'.
      // But we can check if the current state can reach the solution path?
      // OR simpler: assume user is following path if they haven't deviated.
      // But they likely deviated.
      
      // Best Approach:
      // If we have a cached path, let's see if we can perform the NEXT valid move from it?
      // No, that assumes we are at step X.
      
      // Better: Use LevelSolver to search, but giving it the "Target State" (Solved) is standard.
      // What if we give LevelSolver the _cachedSolutionPath as a specific "Guide"?
      // Actually, LevelSolver BFS finds shortest path. The 'Construction Path' is A path.
      
      // Let's stick to LevelSolver for robustness. But use longer timeout?
      // Or: check if we are *exactly* on the construction path?
      // To do that, we replay the moves from start and see if we match current tubes.
      // If we match the state after N moves, then hint is move N+1.
      
      int matchIndex = -1;
      var simulTubes = _cachedSolutionStartTubes!.map((t) => t.copyWith()).toList();
      
      // Check if we are at start
      if (_areTubesEqual(_tubes, simulTubes)) {
         matchIndex = 0;
      } else {
        // Replay history
        for (int i = 0; i < _cachedSolutionPath!.length; i++) {
           final move = _cachedSolutionPath![i];
           // Apply move to simulation
           final result = LiquidLogic.pourLiquid(simulTubes, move.from, move.to);
           if (result.success) {
              simulTubes = result.newTubes;
              if (_areTubesEqual(_tubes, simulTubes)) {
                 matchIndex = i + 1;
                 break;
              }
           } else {
             break; // Path invalid?
           }
        }
      }
      
      if (matchIndex != -1 && matchIndex < _cachedSolutionPath!.length) {
         // Found direct continuation!
         return _cachedSolutionPath![matchIndex];
      }
    }

    // 2. Fallback to Dynamic BFS Solver
    final solution = LevelSolver.getSolution(_tubes, maxIterations: 5000);
    if (solution != null && solution.isNotEmpty) {
      return solution.first;
    }
    
    // Fallback if solver times out (return potentially suboptimal move)
    return LiquidLogic.getHint(_tubes);
  }
  
  /// Save current state for undo
  void _saveState() {
    if (_moveHistory.length >= _maxHistorySize) {
      _moveHistory.removeAt(0);
    }
    
    _moveHistory.add(GameState(
      tubes: _tubes.map((t) => t.copyWith()).toList(),
      moves: _moves,
    ));
  }
  
  /// Check if stuck (no valid moves)

  /// Helper to check tube equality
  bool _areTubesEqual(List<TubeModel> a, List<TubeModel> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
  
  // ============ TIMER METHODS ============
  
  /// Calculate dynamic time limit
  int _calculateTimeLimit(LevelData level) {
      if (level.id < 10) return 300; // 5 mins for tutorial/easy
      
      // procedural levels:
      // Base calculation on difficulty (colors/moves)
      // Estimate: 3s per optimal move + 60s buffer
      // We don't have optimal moves count easily available before solving? 
      // Actually we do for procedural levels (we generated it with shuffleMoves).
      // Or we can just use "moves" if we tracked it in generation.
      // Simple formula based on level ID:
      
      // Level 10: ~30 moves -> 150s (2:30)
      // Level 50: ~50 moves -> 210s (3:30)
      
      int baseTime = 120; // 2 min min
      int additional = (level.id * 2); // +2s per level
      
      return (baseTime + additional).clamp(120, 600); // Max 10 mins
  }

  /// Start the countdown timer
  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timerPaused || _isWon || _isLost) {
        return;
      }
      
      if (_timeRemaining > 0) {
        _timeRemaining--;
        notifyListeners();
      } else {
        _handleTimeUp();
      }
    });
  }
  
  void _handleTimeUp() {
      _stopTimer();
      _isLost = true;
      notifyListeners();
  }
  
  /// Add extra time (e.g. Ad Reward)
  void addTime(int seconds) {
      _timeRemaining += seconds;
      _isLost = false; // Revive if lost
      _timerPaused = false;
      _startTimer(); // Resume
      notifyListeners();
  }
  
  void _stopTimer() {
     _timer?.cancel();
  }
  
  /// Stop the timer (public method for when leaving game screen)
  void stopTimer() {
    _timer?.cancel();
    _timer = null;
    debugPrint('🕐 Timer stopped');
  }
  
  /// Pause the timer (e.g., when app goes to background)
  void pauseTimer() {
    _timerPaused = true;
    notifyListeners();
  }
  
  /// Resume the timer
  void resumeTimer() {
    _timerPaused = false;
    notifyListeners();
  }
  
  /// Dispose timer when provider is disposed
  @override
  void dispose() {
    stopTimer();
    super.dispose();
  }
}
