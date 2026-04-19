import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/dimensions.dart';
import '../../core/constants/animations.dart';
import '../../core/services/theme_service.dart';
import '../../data/models/tube_model.dart';
import '../../data/models/liquid_model.dart';
import '../../state/settings_provider.dart';
import 'liquid_layer.dart';

/// Widget representing a test tube with liquid layers and pour animations
class TubeWidget extends StatefulWidget {
  final TubeModel tube;
  final bool isSelected;
  final bool isPouringFrom;
  final bool isPouringTo;
  final double pourProgress;
  final Offset targetOffset;
  final int? pouringLiquidCount; // Number of liquids being poured
  final String? pouringColorId; // Color ID of the liquid being poured
  final VoidCallback onTap;
  final bool isHidden; // New flag to hide the tube (for overlay animation)

  const TubeWidget({
    super.key,
    required this.tube,
    required this.onTap,
    this.isSelected = false,
    this.isPouringFrom = false,
    this.isPouringTo = false,
    this.pourProgress = 0.0,
    this.targetOffset = Offset.zero,
    this.pouringLiquidCount,
    this.pouringColorId,
    this.isHidden = false,
    this.isMysteryMode = false,
  });

  final bool isMysteryMode;

  @override
  State<TubeWidget> createState() => _TubeWidgetState();
}

class _TubeWidgetState extends State<TubeWidget> with SingleTickerProviderStateMixin {
  late AnimationController _glowController;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    
    _glowAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isHidden) {
      // Keep space but be invisible
      return Opacity(
        opacity: 0.0,
        child: Container(
          width: AppDimensions.tubeWidth,
          height: AppDimensions.tubeHeight,
        ),
      );
    }

    final tubeHeight = AppDimensions.tubeHeight;
    final tubeWidth = AppDimensions.tubeWidth;
    
    // Calculate transform based on state
    final transform = _calculateTransform();
    
    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _glowAnimation,
        builder: (context, child) {
          return AnimatedContainer(
            duration: widget.isPouringFrom 
                ? const Duration(milliseconds: 50) // Fast updates during pour
                : AppAnimations.tubeSelect,
            curve: AppAnimations.selectCurve,
            transform: transform,
            transformAlignment: Alignment.bottomCenter,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Tube opening indicator when selected or pouring
                AnimatedContainer(
                  duration: AppAnimations.tubeSelect,
                  height: widget.isSelected || widget.isPouringFrom ? 4 : 0,
                  width: tubeWidth * 0.4,
                  margin: const EdgeInsets.only(bottom: 2),
                  decoration: BoxDecoration(
                    color: widget.isPouringFrom 
                        ? AppColors.accent.withValues(alpha: 0.9)
                        : AppColors.selectionGlow.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(2),
                    boxShadow: [
                      BoxShadow(
                        color: widget.isPouringFrom 
                            ? AppColors.accent.withValues(alpha: 0.6)
                            : AppColors.selectionGlow.withValues(alpha: 0.6),
                        blurRadius: 8,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
                // Main tube container
                Consumer<SettingsProvider>(
                  builder: (context, settings, _) {
                    final theme = ThemeService.getActiveTheme(settings);
                    final isPremium = theme.hasPremiumTubeDesign;
                    
                    return Container(
                      width: tubeWidth,
                      height: tubeHeight,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(AppDimensions.tubeTopOpeningRadius),
                          topRight: const Radius.circular(AppDimensions.tubeTopOpeningRadius),
                          bottomLeft: const Radius.circular(AppDimensions.tubeBorderRadius),
                          bottomRight: const Radius.circular(AppDimensions.tubeBorderRadius),
                        ),
                        border: Border.all(
                          color: isPremium 
                              ? (theme.tubeRimColor ?? theme.accentColor).withValues(alpha: 0.8)
                              : _getBorderColor(),
                          width: isPremium ? 3 : _getBorderWidth(),
                        ),
                        gradient: isPremium
                            ? LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [
                                  (theme.tubeGlowColor ?? theme.accentColor).withValues(alpha: 0.15),
                                  theme.tubeColor,
                                  (theme.tubeGlowColor ?? theme.accentColor).withValues(alpha: 0.15),
                                ],
                              )
                            : AppColors.glassGradient,
                        boxShadow: [
                          ..._getBoxShadows(),
                          // Premium glow effect
                          if (isPremium)
                            BoxShadow(
                              color: (theme.tubeGlowColor ?? theme.accentColor).withValues(alpha: 0.4),
                              blurRadius: 15,
                              spreadRadius: 2,
                            ),
                          if (isPremium)
                            BoxShadow(
                              color: (theme.tubeGlowColor ?? theme.accentColor).withValues(alpha: 0.2),
                              blurRadius: 25,
                              spreadRadius: 5,
                            ),
                        ],
                      ),
                      child: ClipRRect(
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(AppDimensions.tubeTopOpeningRadius - 2),
                      topRight: const Radius.circular(AppDimensions.tubeTopOpeningRadius - 2),
                      bottomLeft: const Radius.circular(AppDimensions.tubeBorderRadius - 2),
                      bottomRight: const Radius.circular(AppDimensions.tubeBorderRadius - 2),
                    ),
                    child: Stack(
                      children: [
                        // Liquid layers (aligned to bottom)
                        Positioned(
                          left: 2,
                          right: 2,
                          bottom: 2,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: _buildLiquidLayers(),
                          ),
                        ),
                        // Glass highlight overlay
                        Positioned(
                          top: 8,
                          left: 6,
                          child: Container(
                            width: 4,
                            height: tubeHeight * 0.6,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(2),
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.white.withValues(alpha: 0.25),
                                  Colors.white.withValues(alpha: 0.05),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
              ],
            ),
          );
        },
      ),
    );
  }
  
  Matrix4 _calculateTransform() {
    if (widget.isPouringFrom && widget.targetOffset != Offset.zero) {
      // Animation phases (Must match GameScreen/Stream exactly)
      // 0.0 - 0.20: Entry (Lift -> Move -> Tilt)
      // 0.20 - 0.80: Pour
      // 0.80 - 1.00: Return
      
      double liftProgress = 0.0;
      double moveProgress = 0.0;
      double tiltProgress = 0.0;
      
      // New Phases matching GameScreen (0-0.4 Move, 0.4-0.9 Pour, 0.9-1.0 Return)
      if (widget.pourProgress < 0.40) {
        // Entry Phase (0.0 to 0.40)
        liftProgress = widget.pourProgress / 0.15; // Lift fast (first 15%)
        moveProgress = widget.pourProgress / 0.40; // Move throughout entry
        
        // Tilt starts after lift, during move
        if (widget.pourProgress > 0.10) {
          tiltProgress = (widget.pourProgress - 0.10) / 0.30;
        }
      } else if (widget.pourProgress < 0.90) {
        // Pour Phase (Hold)
        liftProgress = 1.0;
        moveProgress = 1.0;
        tiltProgress = 1.0;
      } else {
        // Return Phase (0.90 to 1.00)
        final returnProgress = (widget.pourProgress - 0.90) / 0.10;
        liftProgress = 1.0 - returnProgress;
        moveProgress = 1.0 - returnProgress;
        tiltProgress = 1.0 - returnProgress;
      }
      
      // Apply easing
      liftProgress = Curves.easeOutQuad.transform(liftProgress.clamp(0.0, 1.0));
      moveProgress = Curves.easeInOutCubic.transform(moveProgress.clamp(0.0, 1.0));
      tiltProgress = Curves.easeInOutCubic.transform(tiltProgress.clamp(0.0, 1.0));
      
      // Calculate values
      final liftY = -50.0 * liftProgress; // "Slightly lifts"
      
      // Tilt angle (45 degrees max as requested)
      final maxTilt = math.pi / 4;
      final tiltDirection = widget.targetOffset.dx < 0 ? -1.0 : 1.0;
      final tiltAngle = maxTilt * tiltProgress * tiltDirection;
      
      final tubeHeight = AppDimensions.tubeHeight;
      
      // Calculate moveX
      final openingShiftAtMaxTilt = tubeHeight * math.sin(maxTilt) * tiltDirection;
      final targetOpeningX = widget.targetOffset.dx;
      final finalBaseX = targetOpeningX - openingShiftAtMaxTilt;
      final moveX = finalBaseX * moveProgress;
      
      return Matrix4.identity()
        ..translate(moveX, liftY)
        ..rotateZ(tiltAngle);
    }
    
    if (widget.isSelected) {
      return Matrix4.translationValues(0.0, -20.0, 0.0);
    }
    
    return Matrix4.identity();
  }
  
  Color _getBorderColor() {
    if (widget.isPouringFrom) {
      return AppColors.accent.withValues(alpha: 0.8);
    }
    if (widget.isPouringTo) {
      return AppColors.success.withValues(alpha: 0.6);
    }
    if (widget.isSelected) {
      return AppColors.selectionGlow.withValues(alpha: _glowAnimation.value);
    }
    return AppColors.glassBorder;
  }
  
  double _getBorderWidth() {
    if (widget.isPouringFrom || widget.isPouringTo || widget.isSelected) {
      return 3;
    }
    return AppDimensions.tubeBorderWidth;
  }
  
  List<BoxShadow> _getBoxShadows() {
    // Calculate shadow offset to keep it "on the table" when lifted
    double shadowOffsetY = 4.0;
    
    if (widget.isPouringFrom && widget.pourProgress < 0.40) {
      // Entry phase lift
      final liftProgress = (widget.pourProgress / 0.10).clamp(0.0, 1.0);
      final curvedLift = Curves.easeOutQuad.transform(liftProgress);
      shadowOffsetY += (50.0 * curvedLift);
    } else if (widget.isPouringFrom && widget.pourProgress < 0.90) {
      // Hold phase
      shadowOffsetY += 50.0;
    } else if (widget.isPouringFrom) {
      // Return phase
      final returnProgress = ((widget.pourProgress - 0.90) / 0.10).clamp(0.0, 1.0);
      final curvedReturn = 1.0 - returnProgress; 
      shadowOffsetY += (50.0 * curvedReturn);
    }

    return [
      if (widget.isPouringFrom)
        BoxShadow(
          color: AppColors.accent.withValues(alpha: 0.5),
          blurRadius: 25,
          spreadRadius: 3,
        ),
      if (widget.isPouringTo)
        BoxShadow(
          color: AppColors.success.withValues(alpha: 0.4),
          blurRadius: 20,
          spreadRadius: 2,
        ),
      if (widget.isSelected)
        BoxShadow(
          color: AppColors.selectionGlow.withValues(alpha: _glowAnimation.value * 0.5),
          blurRadius: 20,
          spreadRadius: 2,
        ),
      // Base shadow
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.3),
        blurRadius: 10 + (shadowOffsetY - 4) * 0.1, // Blur increases as it lifts
        offset: Offset(0, shadowOffsetY),
      ),
    ];
  }
  
  List<Widget> _buildLiquidLayers() {
    final layers = <Widget>[];
    final liquids = widget.tube.liquids;
    
    // Get theme colors
    final settings = context.read<SettingsProvider>();
    final theme = ThemeService.getActiveTheme(settings);
    
    // Helper to get themed color for a liquid
    Color getThemedColor(LiquidModel liquid) {
      return AppColors.getLiquidColorFromTheme(liquid.colorId, theme);
    }
    
    // Default standard rendering
    if (!widget.isPouringFrom && !widget.isPouringTo) {
       for (int i = 0; i < liquids.length; i++) {
        layers.add(LiquidLayer(
          liquid: liquids[i],
          themedColor: getThemedColor(liquids[i]),
          isTop: i == liquids.length - 1,
          isBottom: i == 0,
          isMystery: widget.isMysteryMode && i < liquids.length - 1,
        ));
      }
      return layers.reversed.toList();
    }

    // Animation Logic (0.40 to 0.90 is the pour window for 600ms anim)
    double animProgress = 0.0;
    if (widget.pourProgress >= 0.40 && widget.pourProgress <= 0.90) {
      animProgress = (widget.pourProgress - 0.40) / 0.50;
    } else if (widget.pourProgress > 0.90) {
      animProgress = 1.0;
    }
    animProgress = animProgress.clamp(0.0, 1.0);

    // --- Source Tube (Emptying) ---
    if (widget.isPouringFrom) {
      final totalToRemove = widget.pouringLiquidCount ?? 0;
      // How much of the top stack remains? (Starts at totalToRemove, goes to 0)
      final remainingAmount = totalToRemove * (1.0 - animProgress);
      
      final fullSegmentsRemaining = remainingAmount.floor();
      final partialSegmentHeight = (remainingAmount - fullSegmentsRemaining) * AppDimensions.liquidLayerHeight;
      
      // Calculate how many stable bottom layers to keep
      final stableCount = math.max(0, liquids.length - totalToRemove);
      
      // 1. Add stable layers
      // 1. Add stable layers
      for (int i = 0; i < stableCount; i++) {
        layers.add(LiquidLayer(
          liquid: liquids[i],
          themedColor: getThemedColor(liquids[i]),
          isTop: i == stableCount - 1 && fullSegmentsRemaining == 0 && partialSegmentHeight < 1,
          isBottom: i == 0,
          animate: false,
          isMystery: widget.isMysteryMode,
        ));
      }
      
      // 2. Add remaining full segments of the pouring color
      for (int i = 0; i < fullSegmentsRemaining; i++) {
        final dataIndex = stableCount + i;
        if (dataIndex < liquids.length) {
          final isTop = i == fullSegmentsRemaining - 1 && partialSegmentHeight < 1;
          layers.add(LiquidLayer(
            liquid: liquids[dataIndex],
            themedColor: getThemedColor(liquids[dataIndex]),
            isTop: isTop,
            isBottom: dataIndex == 0,
            animate: false,
            isMystery: widget.isMysteryMode && !isTop,
          ));
        }
      }
      
      // 3. Add partial segment (shrinking layer)
      if (partialSegmentHeight >= 1) { // Only render if visible
         // Use the color of the liquid being removed (should be same as last stable or pouringColor)
         // We can perform a safe lookup.
         final dataIndex = stableCount + fullSegmentsRemaining;
         if (dataIndex < liquids.length) {
            layers.add(LiquidLayer(
              liquid: liquids[dataIndex],
              themedColor: getThemedColor(liquids[dataIndex]),
              isTop: true,
              isBottom: dataIndex == 0,
              height: partialSegmentHeight,
              animate: false,
              isMystery: false,
            ));
         }
      }
    }
    
    // --- Target Tube (Filling) ---
    else if (widget.isPouringTo) {
      // 1. Add existing liquids (always stable)
      for (int i = 0; i < liquids.length; i++) {
        layers.add(LiquidLayer(
          liquid: liquids[i],
          themedColor: getThemedColor(liquids[i]),
          isTop: i == liquids.length - 1 && animProgress == 0,
          isBottom: i == 0,
          animate: false,
          isMystery: widget.isMysteryMode,
        ));
      }
      
      // 2. Add filling layers on top
      if (widget.pouringLiquidCount != null && widget.pouringColorId != null) {
        final totalToAdd = widget.pouringLiquidCount!;
        final addedAmount = totalToAdd * animProgress;
        
        final fullSegmentsAdded = addedAmount.floor();
        final partialSegmentHeight = (addedAmount - fullSegmentsAdded) * AppDimensions.liquidLayerHeight;
        
        final colorModel = LiquidModel(
           colorId: widget.pouringColorId!, 
        );
        final themedPouringColor = getThemedColor(colorModel);

        // Add Full New Segments
        for (int i = 0; i < fullSegmentsAdded; i++) {
           layers.add(LiquidLayer(
             liquid: colorModel,
             themedColor: themedPouringColor,
             isTop: i == fullSegmentsAdded - 1 && partialSegmentHeight < 1,
             isBottom: liquids.isEmpty && i == 0,
             animate: false,
           ));
        }
        
        // Add Partial Growing Segment
        if (partialSegmentHeight >= 1) {
          layers.add(LiquidLayer(
             liquid: colorModel,
             themedColor: themedPouringColor,
             isTop: true,
             isBottom: liquids.isEmpty && fullSegmentsAdded == 0,
             height: partialSegmentHeight,
             animate: false,
          ));
        }
      }
    }

    return layers.reversed.toList(); // Stack from bottom to top
  }
}
