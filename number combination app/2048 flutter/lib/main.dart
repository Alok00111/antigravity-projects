/// Main entry point for Block Stack 2048.
/// A grid-based number stacking puzzle game.
library;

import 'package:flutter/material.dart';
import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BlockStackApp());
}
