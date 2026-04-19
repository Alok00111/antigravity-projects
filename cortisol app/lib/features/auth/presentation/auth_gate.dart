import 'package:flutter/material.dart';
import '../../auth/data/auth_repository.dart';

/// Listens to Firebase auth state and routes to Login or Home accordingly.
class AuthGate extends StatelessWidget {
  final AuthRepository authRepository;
  final Widget loginScreen;
  final Widget homeScreen;

  const AuthGate({
    super.key,
    required this.authRepository,
    required this.loginScreen,
    required this.homeScreen,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: authRepository.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: Color(0xFFF2F2F7),
            body: Center(
              child: CircularProgressIndicator(
                color: Color(0xFFFF453A),
              ),
            ),
          );
        }

        if (snapshot.hasData) {
          return homeScreen;
        }

        return loginScreen;
      },
    );
  }
}
