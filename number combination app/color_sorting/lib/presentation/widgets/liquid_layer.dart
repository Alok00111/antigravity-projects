import 'package:flutter/material.dart';
import '../../core/constants/dimensions.dart';
import '../../core/constants/animations.dart';
import '../../data/models/liquid_model.dart';

/// Widget representing a single liquid layer in a tube
class LiquidLayer extends StatelessWidget {
  final LiquidModel liquid;
  final bool isTop;
  final bool isBottom;
  final double height;
  final bool animate;
  final Color? themedColor; // Optional themed color override
  
  const LiquidLayer({
    super.key,
    required this.liquid,
    this.isTop = false,
    this.isBottom = false,
    this.height = AppDimensions.liquidLayerHeight,
    this.animate = true,
    this.isMystery = false,
    this.themedColor,
  });

  final bool isMystery;
  
  @override
  Widget build(BuildContext context) {
    final displayColor = themedColor ?? liquid.color;
    
    final borderRadius = BorderRadius.only(
      topLeft: isTop ? const Radius.circular(8) : Radius.zero,
      topRight: isTop ? const Radius.circular(8) : Radius.zero,
      bottomLeft: isBottom ? const Radius.circular(AppDimensions.tubeBorderRadius - 4) : Radius.zero,
      bottomRight: isBottom ? const Radius.circular(AppDimensions.tubeBorderRadius - 4) : Radius.zero,
    );
    
    return AnimatedContainer(
      duration: animate ? AppAnimations.liquidFlow : Duration.zero,
      curve: AppAnimations.smoothCurve,
      height: height,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: isMystery ? [
            const Color(0xFF352B42), // Space Purple Light
            const Color(0xFF251E30), // Space Purple
            const Color(0xFF1A1520), // Space Purple Dark
          ] : [
            displayColor.withValues(alpha: 0.95),
            displayColor,
            displayColor.withValues(alpha: 0.85),
          ],
        ),
        boxShadow: [
          // Inner glow
          BoxShadow(
            color: (isMystery ? const Color(0xFF2A2A3A) : displayColor).withValues(alpha: 0.6),
            blurRadius: 8,
            spreadRadius: -2,
          ),
        ],
      ),
      child: Stack(
        children: [
          // Highlight effect
          if (isTop)
            Positioned(
              top: 4,
              left: 8,
              right: 8,
              child: Container(
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  color: Colors.white.withValues(alpha: 0.4),
                ),
              ),
            ),
          // Side highlight
          Positioned(
            top: 0,
            bottom: 0,
            left: 4,
            child: Container(
              width: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(1.5),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.white.withValues(alpha: 0.3),
                    Colors.white.withValues(alpha: 0.1),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          
          if (isMystery)
            Center(
               child: Text(
                 '?',
                 style: TextStyle(
                   color: Colors.white.withValues(alpha: 0.3),
                   fontSize: 24,
                   fontWeight: FontWeight.bold,
                 ),
               ),
            ),
        ],
      ),
    );
  }
}

