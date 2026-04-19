import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/history/presentation/history_screen.dart';
import '../services/streak_service.dart';
import '../services/notification_service.dart';
import 'scanner_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _entranceController;
  final AuthRepository _authRepo = AuthRepository();
  User? _user;
  StreakData? _streakData;

  // For scan button press animation
  double _buttonScale = 1.0;

  @override
  void initState() {
    super.initState();
    _user = FirebaseAuth.instance.currentUser;

    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..forward();

    _loadStreak();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await NotificationService().requestPermissions();
      await NotificationService().scheduleDailyStreakReminder();
    });
  }

  Future<void> _loadStreak() async {
    final data = await StreakService.getStreakData();
    if (mounted) setState(() => _streakData = data);
  }

  @override
  void dispose() {
    _entranceController.dispose();
    super.dispose();
  }

  void _navigateToScanner() {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const ScannerScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.05),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: animation,
                curve: Curves.easeOutCubic,
              )),
              child: child,
            ),
          );
        },
        transitionDuration: const Duration(milliseconds: 500),
      ),
    ).then((_) => _loadStreak()); // Refresh streak on return
  }

  void _navigateToHistory() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const HistoryScreen()),
    );
  }

  Future<void> _signOut() async {
    await _authRepo.signOut();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              // Top bar
              FadeTransition(
                opacity: CurvedAnimation(
                  parent: _entranceController,
                  curve: const Interval(0, 0.4, curve: Curves.easeOut),
                ),
                child: Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Row(
                    children: [
                      // User avatar
                      if (_user?.photoURL != null)
                        CircleAvatar(
                          radius: 18,
                          backgroundImage: NetworkImage(_user!.photoURL!),
                          backgroundColor: const Color(0xFFE5E5EA),
                        )
                      else
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: const Color(0xFFFF453A),
                          child: Text(
                            (_user?.displayName ?? _user?.email ?? 'U')
                                .substring(0, 1)
                                .toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _user?.displayName ?? _user?.email ?? '',
                          style: const TextStyle(
                            color: Color(0xFF3C3C43),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // History button
                      _buildIconButton(
                        Icons.history,
                        onTap: _navigateToHistory,
                        tooltip: 'Scan History',
                      ),
                      const SizedBox(width: 8),
                      // Sign out button
                      _buildIconButton(
                        Icons.logout_rounded,
                        onTap: _signOut,
                        tooltip: 'Sign Out',
                      ),
                    ],
                  ),
                ),
              ),

              const Spacer(flex: 1),

              // Stats row
              if (_streakData != null)
                FadeTransition(
                  opacity: CurvedAnimation(
                    parent: _entranceController,
                    curve: const Interval(0.1, 0.5, curve: Curves.easeOut),
                  ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: 16,
                      horizontal: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        _buildStatItem(
                          emoji: '🔥',
                          value: '${_streakData!.currentStreak}',
                          label: 'Streak',
                        ),
                        _buildDivider(),
                        _buildStatItem(
                          emoji: '🧪',
                          value: '${_streakData!.totalScans}',
                          label: 'Scans',
                        ),
                        _buildDivider(),
                        _buildStatItem(
                          emoji: '🏆',
                          value: '${_streakData!.bestStreak}',
                          label: 'Best',
                        ),
                        _buildDivider(),
                        _buildStatItem(
                          emoji: _streakData!.scannedToday ? '✅' : '⬜',
                          value: _streakData!.scannedToday ? 'Done' : 'No',
                          label: 'Today',
                        ),
                      ],
                    ),
                  ),
                ),

              const Spacer(flex: 1),

              // Title
              FadeTransition(
                opacity: CurvedAnimation(
                  parent: _entranceController,
                  curve: const Interval(0.1, 0.6, curve: Curves.easeOut),
                ),
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, 0.2),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                    parent: _entranceController,
                    curve: const Interval(0.1, 0.6, curve: Curves.easeOut),
                  )),
                  child: const Column(
                    children: [
                      Text(
                        'Cortisol',
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF000000),
                          letterSpacing: -1,
                          height: 1.0,
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Scanner',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w400,
                          color: Color(0xFF8E8E93),
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Subtitle
              FadeTransition(
                opacity: CurvedAnimation(
                  parent: _entranceController,
                  curve: const Interval(0.3, 0.8, curve: Curves.easeOut),
                ),
                child: const Text(
                  'Scan your face. Get roasted by science.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    color: Color(0xFF8E8E93),
                    height: 1.5,
                  ),
                ),
              ),

              const Spacer(flex: 2),

              // Scan button
              FadeTransition(
                opacity: CurvedAnimation(
                  parent: _entranceController,
                  curve: const Interval(0.4, 1.0, curve: Curves.easeOut),
                ),
                child: GestureDetector(
                  onTapDown: (_) => setState(() => _buttonScale = 0.93),
                  onTapUp: (_) {
                    setState(() => _buttonScale = 1.0);
                    _navigateToScanner();
                  },
                  onTapCancel: () => setState(() => _buttonScale = 1.0),
                  child: AnimatedScale(
                    scale: _buttonScale,
                    duration: const Duration(milliseconds: 120),
                    curve: Curves.easeOut,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFFFF453A),
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.fingerprint,
                            size: 52,
                            color: Colors.white,
                          ),
                          SizedBox(height: 6),
                          Text(
                            'SCAN',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              letterSpacing: 4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const Spacer(flex: 1),

              // Bottom disclaimer
              FadeTransition(
                opacity: CurvedAnimation(
                  parent: _entranceController,
                  curve: const Interval(0.6, 1.0, curve: Curves.easeOut),
                ),
                child: const Padding(
                  padding: EdgeInsets.only(bottom: 24),
                  child: Text(
                    '⚠ Not actual medical advice.\nFor entertainment purposes only.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF8E8E93),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required String emoji,
    required String value,
    required String label,
  }) {
    return Expanded(
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF000000),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF8E8E93),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      height: 36,
      color: const Color(0xFFE5E5EA),
    );
  }

  Widget _buildIconButton(IconData icon,
      {required VoidCallback onTap, String? tooltip}) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Tooltip(
          message: tooltip ?? '',
          child: Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            child: Icon(
              icon,
              color: const Color(0xFF3C3C43),
              size: 20,
            ),
          ),
        ),
      ),
    );
  }
}
