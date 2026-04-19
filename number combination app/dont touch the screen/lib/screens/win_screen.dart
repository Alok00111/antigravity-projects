import 'package:flutter/material.dart';

class WinScreen extends StatelessWidget {
  const WinScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: GestureDetector(
          onTap: () => Navigator.pushNamedAndRemoveUntil(
            context,
            '/',
            (route) => false,
          ),
          behavior: HitTestBehavior.opaque,
          child: Container(
            width: double.infinity,
            height: double.infinity,
            color: Colors.black,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(flex: 2),
                // Win message
                const Text(
                  'YOU',
                  style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w300,
                    color: Colors.white54,
                    letterSpacing: 8,
                  ),
                ),
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [Colors.amber, Colors.orange, Colors.amber],
                  ).createShader(bounds),
                  child: const Text(
                    'WON!',
                    style: TextStyle(
                      fontSize: 80,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 4,
                    ),
                  ),
                ),
                const Spacer(),
                // 60 seconds display
                const Text(
                  '60.0s',
                  style: TextStyle(
                    fontSize: 72,
                    fontWeight: FontWeight.w200,
                    color: Colors.white,
                  ),
                ),
                const Text(
                  'COMPLETE',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                    color: Colors.white38,
                    letterSpacing: 4,
                  ),
                ),
                const SizedBox(height: 30),
                const Text(
                  '🏆 CHAMPION 🏆',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.amber,
                    letterSpacing: 2,
                  ),
                ),
                const Spacer(),
                // Play again
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.amber.withOpacity(0.5), width: 1),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Text(
                    'TAP TO PLAY AGAIN',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.amber,
                      letterSpacing: 3,
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
