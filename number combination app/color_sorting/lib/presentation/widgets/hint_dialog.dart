import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/colors.dart';

/// Dialog shown when user taps Hint button
/// Shows options based on hint availability
class HintDialog extends StatelessWidget {
  final int hintsRemaining;
  final int coins;
  final VoidCallback onUseHint;
  final VoidCallback onWatchAd;
  final VoidCallback onBuyHints;
  final bool isAdReady;

  const HintDialog({
    super.key,
    required this.hintsRemaining,
    required this.coins,
    required this.onUseHint,
    required this.onWatchAd,
    required this.onBuyHints,
    this.isAdReady = true,
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
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.glassBorder, width: 2),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [AppColors.accent, AppColors.accentSecondary],
                ),
              ),
              child: const Icon(
                Icons.lightbulb_rounded,
                size: 35,
                color: Colors.white,
              ),
            ),
            
            const SizedBox(height: 16),
            
            Text(
              hintsRemaining > 0 ? 'Use Hint?' : 'Out of Hints!',
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            
            const SizedBox(height: 8),
            
            // Hints remaining
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.glassBase,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lightbulb_outline, color: AppColors.accent, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    '$hintsRemaining hints',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Icon(Icons.monetization_on, color: Colors.amber, size: 20),
                  const SizedBox(width: 4),
                  Text(
                    '$coins',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Buttons
            if (hintsRemaining > 0) ...[
              // Use Hint Button
              _buildButton(
                context,
                label: 'Use Hint',
                icon: Icons.lightbulb,
                isPrimary: true,
                onTap: () {
                  Navigator.pop(context);
                  onUseHint();
                },
              ),
              const SizedBox(height: 12),
            ],
            
            // Watch Ad Button
            _buildButton(
              context,
              label: 'Watch Ad (+1 hint)',
              icon: Icons.play_circle_filled,
              isPrimary: hintsRemaining == 0,
              enabled: isAdReady,
              onTap: () {
                Navigator.pop(context);
                onWatchAd();
              },
            ),
            
            const SizedBox(height: 12),
            
            // Buy with coins
            if (coins >= 50)
              _buildButton(
                context,
                label: 'Buy 1 Hint (50 coins)',
                icon: Icons.monetization_on,
                isPrimary: false,
                onTap: () {
                  Navigator.pop(context);
                  onBuyHints();
                },
              ),
            
            const SizedBox(height: 12),
            
            // Cancel
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Cancel',
                style: GoogleFonts.poppins(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildButton(
    BuildContext context, {
    required String label,
    required IconData icon,
    required VoidCallback onTap,
    bool isPrimary = false,
    bool enabled = true,
  }) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: enabled ? 1.0 : 0.5,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            gradient: isPrimary
                ? LinearGradient(
                    colors: [AppColors.accent, AppColors.accentSecondary],
                  )
                : null,
            color: isPrimary ? null : AppColors.glassBase,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isPrimary ? Colors.transparent : AppColors.glassBorder,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isPrimary ? Colors.white : AppColors.textPrimary,
                size: 22,
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: isPrimary ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
