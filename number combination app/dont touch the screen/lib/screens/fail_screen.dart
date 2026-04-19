import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class FailScreen extends StatefulWidget {
  const FailScreen({super.key});

  @override
  State<FailScreen> createState() => _FailScreenState();
}

class _FailScreenState extends State<FailScreen> {
  double _timeSurvived = 0;
  bool _isNewHighScore = false;
  final StorageService _storage = StorageService();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is double) {
      _timeSurvived = args;
      _checkHighScore();
    }
  }

  Future<void> _checkHighScore() async {
    final isNew = await _storage.checkAndUpdateHighScore(_timeSurvived);
    if (mounted) {
      setState(() => _isNewHighScore = isNew);
    }
  }

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
                // Fail message
                const Text(
                  'YOU',
                  style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w300,
                    color: Colors.white54,
                    letterSpacing: 8,
                  ),
                ),
                Text(
                  'FAILED',
                  style: TextStyle(
                    fontSize: 64,
                    fontWeight: FontWeight.bold,
                    color: Colors.red.shade400,
                    letterSpacing: 4,
                  ),
                ),
                const Spacer(),
                // Time survived
                Text(
                  '${_timeSurvived.toStringAsFixed(1)}s',
                  style: const TextStyle(
                    fontSize: 72,
                    fontWeight: FontWeight.w200,
                    color: Colors.white,
                  ),
                ),
                const Text(
                  'SURVIVED',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                    color: Colors.white38,
                    letterSpacing: 4,
                  ),
                ),
                if (_isNewHighScore) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      '✨ NEW BEST! ✨',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.amber,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                // Try again
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white24, width: 1),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Text(
                    'TAP TO TRY AGAIN',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
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
