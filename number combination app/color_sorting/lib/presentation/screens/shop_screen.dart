import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/dimensions.dart';
import '../../data/models/theme_pack.dart';
import '../../data/models/victory_pack.dart';
import '../../data/models/victory_effect_model.dart';
import '../../state/settings_provider.dart';
import '../widgets/animated_background.dart';

/// Shop screen for purchasing theme packs
class ShopScreen extends StatelessWidget {
  const ShopScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: DefaultTabController(
            length: 2,
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(AppDimensions.screenPadding),
                  child: Row(
                    children: [
                      _BackButton(),
                      const SizedBox(width: 16),
                      Text(
                        'Shop',
                        style: GoogleFonts.poppins(
                          fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary,
                        ),
                      ),
                      const Spacer(),
                      _CoinBadge(),
                    ],
                  ),
                ),
                
                // Tabs
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: AppDimensions.screenPadding),
                  height: 50,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: TabBar(
                    indicator: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.accent.withValues(alpha: 0.4),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white60,
                    labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14),
                    padding: const EdgeInsets.all(4),
                    tabs: const [
                      Tab(text: 'Themes'),
                      Tab(text: 'Effects'),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Content
                Expanded(
                  child: TabBarView(
                    children: [
                      _ThemeGrid(),
                      _EffectGrid(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: AppColors.glassBase, borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
      ),
    );
  }
}

class _CoinBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settings, _) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.glassBase, borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.monetization_on, color: Colors.amber, size: 22),
            const SizedBox(width: 8),
            Text('${settings.coins}', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          ],
        ),
      ),
    );
  }
}

class _ThemeGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settings, _) {
        final themes = ThemePack.allThemes;
        return CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
             SliverPadding(
              padding: const EdgeInsets.all(AppDimensions.screenPadding),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 0.75,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final theme = themes[index];
                    final isOwned = settings.isThemeOwned(theme.id);
                    final isActive = settings.activeThemeId == theme.id;
                    return _ThemeCard(
                      theme: theme, isOwned: isOwned, isActive: isActive,
                      onTap: () => _handleThemeTap(context, theme, isOwned, settings),
                    );
                  },
                  childCount: themes.length,
                ),
              ),
            ),
             SliverToBoxAdapter(
                child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 48),
                child: Column(
                    children: [
                        Icon(Icons.auto_awesome, color: Colors.white54, size: 32),
                        const SizedBox(height: 12),
                        Text('More Themes Coming Soon', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white70)),
                    ],
                ),
                ),
             ),
          ],
        );
      },
    );
  }
  
  void _handleThemeTap(BuildContext context, ThemePack theme, bool isOwned, SettingsProvider settings) {
      if (isOwned) {
          settings.setActiveTheme(theme.id);
          _showSnack(context, '${theme.name} theme activated!');
      } else {
          _showPurchaseTheme(context, theme, settings);
      }
  }
  
  void _showPurchaseTheme(BuildContext context, ThemePack theme, SettingsProvider settings) {
      showDialog(
        context: context,
        builder: (ctx) => _PurchaseDialog(
          title: theme.name,
          description: theme.description,
          price: theme.price,
          isAffordable: settings.coins >= theme.price,
          onBuy: () async {
            final success = await settings.purchaseTheme(theme.id, theme.price);
            if (context.mounted) Navigator.pop(context);
            if (success && context.mounted) _showSnack(context, '${theme.name} unlocked!');
          },
          icon: Icon(Icons.palette, size: 40, color: theme.accentColor), 
        ),
      );
  }
  
  void _showSnack(BuildContext context, String msg) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg, style: GoogleFonts.poppins()), backgroundColor: AppColors.success, duration: const Duration(seconds: 1)));
  }
}

class _EffectGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settings, _) {
        final effects = VictoryPack.allEffects;
        return CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
             SliverPadding(
                padding: const EdgeInsets.all(AppDimensions.screenPadding),
                sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 0.8,
                    ),
                    delegate: SliverChildBuilderDelegate(
                        (context, index) {
                        final effect = effects[index];
                        final isOwned = settings.isEffectOwned(effect.id);
                        final isActive = settings.activeEffectId == effect.id;
                        return _EffectCard(
                            effect: effect, isOwned: isOwned, isActive: isActive,
                            onTap: () {
                                if (isOwned) {
                                    settings.setActiveEffect(effect.id);
                                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${effect.name} selected!', style: GoogleFonts.poppins()), backgroundColor: AppColors.success, duration: const Duration(seconds: 1)));
                                } else {
                                    showDialog(
                                        context: context,
                                        builder: (ctx) => _PurchaseDialog(
                                            title: effect.name,
                                            description: effect.description,
                                            price: effect.price,
                                            isAffordable: settings.coins >= effect.price,
                                            onBuy: () async {
                                                final success = await settings.purchaseEffect(effect.id, effect.price);
                                                if (context.mounted) Navigator.pop(context);
                                                if (success && context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${effect.name} unlocked!', style: GoogleFonts.poppins()), backgroundColor: AppColors.success));
                                            },
                                            icon: const Icon(Icons.celebration, size: 40, color: Colors.amber),
                                        ),
                                    );
                                }
                            },
                        );
                        },
                        childCount: effects.length,
                    ),
                ),
             ),
          ],
        );
      },
    );
  }
}

class _PurchaseDialog extends StatelessWidget {
    final String title;
    final String description;
    final int price;
    final bool isAffordable;
    final VoidCallback onBuy;
    final Widget icon;
    
    const _PurchaseDialog({
        required this.title, required this.description, required this.price, 
        required this.isAffordable, required this.onBuy, required this.icon
    });

    @override
    Widget build(BuildContext context) {
        return Dialog(
            backgroundColor: AppColors.backgroundSecondary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: BorderSide(color: AppColors.glassBorder)),
            child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                        Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(color: AppColors.glassBase, shape: BoxShape.circle),
                            child: icon,
                        ),
                        const SizedBox(height: 16),
                        Text(title, style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                        Text(description, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 14, color: Colors.white70)),
                        const SizedBox(height: 20),
                        Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                                const Icon(Icons.monetization_on, color: Colors.amber),
                                const SizedBox(width: 8),
                                Text('$price', style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.amber)),
                            ],
                        ),
                        const SizedBox(height: 24),
                         GestureDetector(
                            onTap: isAffordable ? onBuy : null,
                            child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                width: double.infinity,
                                decoration: BoxDecoration(
                                    color: isAffordable ? AppColors.accent : Colors.grey[800],
                                    borderRadius: BorderRadius.circular(16),
                                ),
                                child: Center(child: Text('Buy Now', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: isAffordable ? Colors.white : Colors.grey))),
                            )
                        )
                    ],
                ),
            ),
        );
    }
}

class _EffectCard extends StatelessWidget {
  final VictoryEffectModel effect;
  final bool isOwned;
  final bool isActive;
  final VoidCallback onTap;

  const _EffectCard({required this.effect, required this.isOwned, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isActive ? AppColors.glassBase : AppColors.backgroundSecondary.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isActive ? AppColors.accent : AppColors.glassBorder, width: isActive ? 2 : 1),
        ),
        child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
                Icon(
                    effect.type == VictoryEffectType.confetti ? Icons.celebration :
                    effect.type == VictoryEffectType.fireworks ? Icons.sunny : Icons.bubble_chart,
                    size: 48,
                    color: isActive ? AppColors.accent : Colors.white54,
                ),
                const SizedBox(height: 12),
                Text(effect.name, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white)),
                Text(effect.price == 0 ? 'FREE' : '${effect.price}', style: GoogleFonts.poppins(color: Colors.amber)),
                if (isActive)
                    Container(margin: const EdgeInsets.only(top: 8), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(8)), child: Text('ACTIVE', style: GoogleFonts.poppins(fontSize: 10, color: Colors.white))),
            ],
        ),
      ),
    );
  }
}

class _ThemeCard extends StatelessWidget {
  final ThemePack theme;
  final bool isOwned;
  final bool isActive;
  final VoidCallback onTap;

  const _ThemeCard({
    required this.theme,
    required this.isOwned,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: theme.backgroundGradient,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? theme.accentColor : AppColors.glassBorder,
            width: isActive ? 3 : 1,
          ),
          boxShadow: isActive
              ? [BoxShadow(color: theme.accentColor.withValues(alpha: 0.4), blurRadius: 15)]
              : null,
        ),
        child: Stack(
          children: [
            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Color dots preview
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: theme.liquidColors.take(6).map((color) => 
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white24),
                          boxShadow: [
                            BoxShadow(
                              color: color.withValues(alpha: 0.5),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                      ),
                    ).toList(),
                  ),
                  
                  const Spacer(),
                  // Theme name
                  Text(
                    theme.name,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  
                  Text(
                    theme.description,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: Colors.white70,
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Status or price
                  if (isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: theme.accentColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'ACTIVE',
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    )
                  else if (isOwned)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'OWNED',
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    )
                  else
                    Row(
                      children: [
                        const Icon(Icons.monetization_on, color: Colors.amber, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          theme.price == 0 ? 'FREE' : '${theme.price}',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.amber,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
            
            // Lock overlay for locked themes
            if (!isOwned && theme.price > 0)
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.lock, size: 16, color: Colors.white70),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
