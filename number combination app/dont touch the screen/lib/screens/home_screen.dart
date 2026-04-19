import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  double _highScore = 0.0;
  final StorageService _storage = StorageService();

  @override
  void initState() {
    super.initState();
    _loadHighScore();
  }

  Future<void> _loadHighScore() async {
    final score = await _storage.getHighScore();
    if (mounted) {
      setState(() => _highScore = score);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: GestureDetector(
          onTap: () => Navigator.pushNamed(context, '/game'),
          behavior: HitTestBehavior.opaque,
          child: Container(
            width: double.infinity,
            height: double.infinity,
            color: Colors.black,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(flex: 2),
                // Title
                const Text(
                  "DON'T",
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w300,
                    color: Colors.white,
                    letterSpacing: 8,
                  ),
                ),
                const Text(
                  "TOUCH",
                  style: TextStyle(
                    fontSize: 64,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 4,
                  ),
                ),
                const Text(
                  "THE SCREEN",
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w300,
                    color: Colors.white70,
                    letterSpacing: 6,
                  ),
                ),
                const Spacer(),
                // Tap to start
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white24, width: 1),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Text(
                    'TAP TO START',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                      letterSpacing: 4,
                    ),
                  ),
                ),
                const Spacer(),
                // High score
                if (_highScore > 0)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Text(
                      'BEST: ${_highScore.toStringAsFixed(1)}s',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w400,
                        color: Colors.white38,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                const Spacer(flex: 1),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
