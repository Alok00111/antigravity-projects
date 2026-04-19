/// App widget for Block Stack 2048.
/// MaterialApp configuration and theme setup.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/colors.dart';
import 'game/game_state.dart';
import 'game/app_state.dart';
import 'ui/pages/splash_screen.dart';

/// Main app widget
class BlockStackApp extends StatelessWidget {
  const BlockStackApp({super.key});
  
  @override
  Widget build(BuildContext context) {
    // Lock to portrait orientation
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    
    // Set system UI overlay style
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: kBackgroundColor,
      systemNavigationBarIconBrightness: Brightness.dark,
    ));
    
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => GameState()),
        ChangeNotifierProvider(create: (_) => AppState()),
      ],
      child: Consumer<AppState>(
        builder: (context, appState, child) {
          return MaterialApp(
            title: '2048 Block Stack',
            debugShowCheckedModeBanner: false,
            themeMode: appState.themeMode,
            theme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFFEDC22E),
                brightness: Brightness.light,
              ),
              fontFamily: 'Roboto',
              scaffoldBackgroundColor: kBackgroundColor,
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFFEDC22E),
                brightness: Brightness.dark,
              ),
              fontFamily: 'Roboto',
              scaffoldBackgroundColor: const Color(0xFF1A1A1A),
            ),
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
