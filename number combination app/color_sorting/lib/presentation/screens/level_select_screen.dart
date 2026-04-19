import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/dimensions.dart';
import '../../core/constants/animations.dart';
import '../../core/utils/level_generator.dart';
import '../../state/settings_provider.dart';
import '../../state/game_provider.dart';
import '../widgets/animated_background.dart';
import 'game_screen.dart';

/// Level selection screen with grid of levels
class LevelSelectScreen extends StatefulWidget {
  const LevelSelectScreen({super.key});

  @override
  State<LevelSelectScreen> createState() => _LevelSelectScreenState();
}

class _LevelSelectScreenState extends State<LevelSelectScreen> {
  int _totalLevels = 0;
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadLevelCount();
  }
  
  Future<void> _loadLevelCount() async {
    final count = await LevelGenerator.getTotalLevels();
    if (mounted) {
      setState(() {
        _totalLevels = count;
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(AppDimensions.screenPadding),
                child: Row(
                  children: [
                    _BackButton(onTap: () => Navigator.pop(context)),
                    const SizedBox(width: 16),
                    Text(
                      'Select Level',
                      style: GoogleFonts.poppins(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    // Total stars display
                    Consumer<SettingsProvider>(
                      builder: (context, settings, _) {
                        final totalStars = settings.getTotalStars();
                        final maxStars = _totalLevels * 3;
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.glassBase,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.glassBorder, width: 1),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star_rounded, color: Colors.amber, size: 18),
                              const SizedBox(width: 4),
                              Text(
                                '$totalStars/$maxStars',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 8),
                    // Debug Button
                    IconButton(
                      icon: const Icon(Icons.bug_report, color: AppColors.accent),
                      onPressed: () => _showDebugDialog(context),
                    ),
                  ],
                ),
              ),
              
              // Progress indicator
              Consumer<SettingsProvider>(
                builder: (context, settings, _) {
                  final progress = _totalLevels > 0 
                      ? (settings.highestLevel / _totalLevels * 100).clamp(0, 100)
                      : 0;
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppDimensions.screenPadding,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Progress',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            Text(
                              '${settings.highestLevel}/$_totalLevels',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: progress / 100,
                            minHeight: 8,
                            backgroundColor: AppColors.glassBase,
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppColors.accent,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              
              const SizedBox(height: 24),
              
              // Level grid
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.accent,
                        ),
                      )
                    : _LevelGrid(
                        totalLevels: _totalLevels,
                        onLevelTap: (levelId) => _navigateToGame(context, levelId),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _navigateToGame(BuildContext context, int levelId) {
    final gameProvider = context.read<GameProvider>();
    gameProvider.loadLevel(levelId);
    
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => 
            const GameScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: AppAnimations.normal,
      ),
    );
  }

  void _showDebugDialog(BuildContext context) {
    final controller = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.backgroundSecondary,
        title: const Text('Debug Menu', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Jump to Level ID',
                labelStyle: TextStyle(color: Colors.grey),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accent)),
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
                  onPressed: () {
                    final levelId = int.tryParse(controller.text);
                    if (levelId != null) {
                      Navigator.pop(context);
                      _navigateToGame(context, levelId);
                    }
                  }, 
                  child: const Text('Go', style: TextStyle(color: Colors.black)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                  onPressed: () {
                    final settings = context.read<SettingsProvider>();
                    // Unlock levels 1 to 100 for testing
                    for(int i=1; i<=100; i++) settings.unlockLevel(i);
                    Navigator.pop(context);
                  }, 
                  child: const Text('Unlock 100', style: TextStyle(color: Colors.black)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                  onPressed: () async {
                    final settings = context.read<SettingsProvider>();
                    await settings.resetProgress();
                    if (context.mounted) Navigator.pop(context);
                  }, 
                  child: const Text('Reset All', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Back button
class _BackButton extends StatelessWidget {
  final VoidCallback onTap;
  
  const _BackButton({required this.onTap});
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
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
    );
  }
}

/// Animated level grid
class _LevelGrid extends StatelessWidget {
  final int totalLevels;
  final Function(int) onLevelTap;
  
  const _LevelGrid({
    required this.totalLevels,
    required this.onLevelTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settings, _) {
        return GridView.builder(
          padding: const EdgeInsets.all(AppDimensions.screenPadding),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: AppDimensions.levelGridColumns,
            mainAxisSpacing: AppDimensions.levelTileSpacing,
            crossAxisSpacing: AppDimensions.levelTileSpacing,
          ),
          itemCount: totalLevels,
          itemBuilder: (context, index) {
            final levelId = index + 1;
            final isUnlocked = settings.isLevelUnlocked(levelId);
            final isCompleted = levelId <= settings.highestLevel;
            final stars = settings.getLevelStars(levelId);
            
            return _LevelTile(
              levelId: levelId,
              isUnlocked: isUnlocked,
              isCompleted: isCompleted,
              stars: stars,
              animationDelay: index * 30,
              onTap: () => _handleLevelTap(context, settings, levelId),
            );
          },
        );
      },
    );
  }

  void _handleLevelTap(BuildContext context, SettingsProvider settings, int levelId) {
    if (settings.isLevelUnlocked(levelId)) {
        onLevelTap(levelId);
        return;
    }
    
    // Check if it's a Chapter Lock
    if (settings.isLevelLockedByChapter(levelId)) {
        final currentChapter = (levelId - 1) ~/ 100;
        final prevChapter = currentChapter - 1;
        final progress = settings.getChapterProgress(prevChapter);
        
        showDialog(
            context: context,
            builder: (context) => AlertDialog(
                backgroundColor: AppColors.backgroundSecondary,
                title: Row(
                    children: [
                        const Icon(Icons.lock_rounded, color: AppColors.error),
                        const SizedBox(width: 8),
                        const Text('Chapter Locked', style: TextStyle(color: Colors.white)),
                    ],
                ),
                content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                        Text(
                            'To unlock levels ${currentChapter * 100 + 1}+, you need to prove your mastery!',
                            style: GoogleFonts.poppins(color: Colors.white70),
                        ),
                        const SizedBox(height: 16),
                        Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                                color: AppColors.glassBase,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.glassBorder),
                            ),
                            child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                    Text('Rank 3 Stars:', style: GoogleFonts.poppins(color: Colors.white)),
                                    Text(
                                        '${progress.current}/${progress.required}',
                                        style: GoogleFonts.poppins(
                                            color: progress.current >= progress.required 
                                                ? AppColors.success 
                                                : AppColors.error,
                                            fontWeight: FontWeight.bold,
                                        ),
                                    ),
                                ],
                            ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                            'Complete 95 levels with 3 stars in previous chapter.',
                            style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey),
                        ),
                    ],
                ),
                actions: [
                    TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('OK', style: TextStyle(color: AppColors.accent)),
                    ),
                ],
            ),
        );
    } else {
        // Linearly locked
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Complete previous levels to unlock!'),
                duration: Duration(seconds: 1),
                backgroundColor: AppColors.error,
            ),
        );
    }
  }
}

/// Individual level tile with animation
class _LevelTile extends StatefulWidget {
  final int levelId;
  final bool isUnlocked;
  final bool isCompleted;
  final int stars;
  final int animationDelay;
  final VoidCallback? onTap;
  
  const _LevelTile({
    required this.levelId,
    required this.isUnlocked,
    required this.isCompleted,
    required this.stars,
    required this.animationDelay,
    this.onTap,
  });
  
  @override
  State<_LevelTile> createState() => _LevelTileState();
}

class _LevelTileState extends State<_LevelTile> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  
  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: AppAnimations.levelTileScale,
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: AppAnimations.bounceCurve),
    );
    
    // Stagger animation
    Future.delayed(Duration(milliseconds: widget.animationDelay), () {
      if (mounted) _controller.forward();
    });
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: GestureDetector(
        onTap: widget.onTap,
        child: Container(
          decoration: BoxDecoration(
            color: widget.isUnlocked 
                ? (widget.isCompleted ? AppColors.success.withValues(alpha: 0.2) : AppColors.glassBase)
                : AppColors.backgroundSecondary.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(AppDimensions.levelTileRadius),
            border: Border.all(
              color: widget.isCompleted 
                  ? AppColors.success.withValues(alpha: 0.5)
                  : (widget.isUnlocked ? AppColors.glassBorder : Colors.transparent),
              width: 1.5,
            ),
            boxShadow: widget.isUnlocked ? [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ] : null,
          ),
          child: Center(
            child: widget.isUnlocked
                ? Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${widget.levelId}',
                        style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: widget.isCompleted 
                              ? AppColors.success 
                              : AppColors.textPrimary,
                        ),
                      ),
                      if (widget.isCompleted)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: List.generate(3, (index) {
                            final isEarned = index < widget.stars;
                            return Icon(
                              isEarned ? Icons.star_rounded : Icons.star_border_rounded,
                              size: 12,
                              color: isEarned ? Colors.amber : AppColors.textMuted,
                            );
                          }),
                        ),
                    ],
                  )
                : const Icon(
                    Icons.lock_rounded,
                    size: 20,
                    color: AppColors.textMuted,
                  ),
          ),
        ),
      ),
    );
  }
}
