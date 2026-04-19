/// Shop page for Block Stack 2048.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/colors.dart';
import '../../core/block_themes.dart';
import '../../game/app_state.dart';
import '../../core/ad_service.dart';

/// Shop page to buy themes and earn coins
class ShopPage extends StatelessWidget {
  const ShopPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        return SafeArea(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Text(
                    'Shop',
                    style: TextStyle(
                      color: getTextPrimaryColor(context),
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            
                // Coin Balance Card
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24.0),
                  padding: const EdgeInsets.all(20.0),
                  decoration: BoxDecoration(
                    color: getScoreBackgroundColor(context), 
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: getBlackShadow(context),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Your Balance',
                            style: TextStyle(
                              color: Color(0xFFEEE4DA),
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.monetization_on,
                                color: Color(0xFFFFD700),
                                size: 28,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${appState.coins}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            
                const SizedBox(height: 32),
            
                // Get Coins Section
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Text(
                    'Get Coins',
                    style: TextStyle(
                      color: getTextPrimaryColor(context),
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
            
                // Watch Ad Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        final adShown = AdService().showRewardedAd(onReward: (amount) {
                           appState.addCoins(amount);
                           
                           ScaffoldMessenger.of(context).showSnackBar(
                             SnackBar(
                               content: Text('Received $amount Coins!'),
                               backgroundColor: const Color(0xFF66BB6A),
                               duration: const Duration(seconds: 2),
                             ),
                           );
                        });
                        
                        if (!adShown) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Ad not ready yet. Please try again in a moment.'),
                              backgroundColor: Colors.orange,
                              duration: Duration(seconds: 2),
                            ),
                          );
                        }
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(
                             color: getTextPrimaryTransparent(context).withOpacity(0.2), 
                             width: 2
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.play_circle_fill,
                                color: Colors.blue,
                                size: 32,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Watch Video Ad',
                                    style: TextStyle(
                                      color: getTextPrimaryColor(context),
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Get +10 Coins',
                                    style: TextStyle(
                                      color: getTextPrimaryTransparent(context),
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              Icons.arrow_forward_ios, 
                              size: 16, 
                              color: getTextPrimaryTransparent(context)
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            
                const SizedBox(height: 32),
            
                // Themes Section
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Text(
                    'Themes',
                    style: TextStyle(
                      color: getTextPrimaryColor(context),
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Theme Grid
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: availableThemes.length,
                    itemBuilder: (context, index) {
                      final theme = availableThemes[index];
                      return _ThemeCard(
                        theme: theme,
                        appState: appState,
                      );
                    },
                  ),
                ),
                
                const SizedBox(height: 24),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Individual theme card widget
class _ThemeCard extends StatelessWidget {
  final BlockTheme theme;
  final AppState appState;
  
  const _ThemeCard({
    required this.theme,
    required this.appState,
  });

  @override
  Widget build(BuildContext context) {
    final isOwned = appState.isThemeOwned(theme.id);
    final isEquipped = appState.activeThemeId == theme.id;
    final canAfford = appState.coins >= theme.price;
    
    return Container(
      decoration: BoxDecoration(
        color: getBackgroundColor(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isEquipped 
              ? const Color(0xFF66BB6A) 
              : getTextPrimaryTransparent(context).withOpacity(0.2),
          width: isEquipped ? 3 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: getBlackShadow(context),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Preview colors
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              child: Row(
                children: theme.previewColors.map((color) {
                  return Expanded(
                    child: Container(color: color),
                  );
                }).toList(),
              ),
            ),
          ),
          
          // Theme info
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  theme.name,
                  style: TextStyle(
                    color: getTextPrimaryColor(context),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  theme.description,
                  style: TextStyle(
                    color: getTextPrimaryTransparent(context),
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                
                // Action button
                SizedBox(
                  width: double.infinity,
                  child: _buildActionButton(context, isOwned, isEquipped, canAfford),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildActionButton(BuildContext context, bool isOwned, bool isEquipped, bool canAfford) {
    if (isEquipped) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF66BB6A),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(
          child: Text(
            'EQUIPPED',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      );
    }
    
    if (isOwned) {
      return GestureDetector(
        onTap: () {
          appState.setActiveTheme(theme.id);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${theme.name} theme equipped!'),
              backgroundColor: const Color(0xFF66BB6A),
              duration: const Duration(seconds: 1),
            ),
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: getScoreBackgroundColor(context),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Center(
            child: Text(
              'EQUIP',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      );
    }
    
    // Not owned - show buy button
    return GestureDetector(
      onTap: canAfford ? () {
        final success = appState.purchaseTheme(theme.id, theme.price);
        if (success) {
          appState.setActiveTheme(theme.id);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${theme.name} theme purchased and equipped!'),
              backgroundColor: const Color(0xFF66BB6A),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      } : () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Not enough coins! Need ${theme.price - appState.coins} more.'),
            backgroundColor: Colors.red.shade400,
            duration: const Duration(seconds: 2),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: canAfford 
              ? const Color(0xFFF67C5F) 
              : getTextPrimaryTransparent(context).withOpacity(0.3),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.monetization_on,
              color: Colors.white,
              size: 14,
            ),
            const SizedBox(width: 4),
            Text(
              '${theme.price}',
              style: TextStyle(
                color: canAfford ? Colors.white : Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
