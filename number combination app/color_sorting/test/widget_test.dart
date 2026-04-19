// This is a basic Flutter widget test.

import 'package:flutter_test/flutter_test.dart';
import 'package:liquid_sort_puzzle/main.dart';

void main() {
  testWidgets('App builds successfully', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const LiquidSortApp());
    
    // Verify that the splash screen is shown
    expect(find.text('Liquid Sort'), findsOneWidget);
    expect(find.text('PUZZLE'), findsOneWidget);
  });
}
