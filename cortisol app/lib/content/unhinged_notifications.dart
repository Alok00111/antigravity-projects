import 'dart:math';

class UnhingedNotifications {
  static final _random = Random();

  /// Returns a random title and body pair for the daily push notification.
  static Map<String, String> getRandomNotification() {
    final list = _notifications;
    return list[_random.nextInt(list.length)];
  }

  static const List<Map<String, String>> _notifications = [
    {
      "title": "Coping again?",
      "body": "Your cortisol isn't going to raise itself. Come get roasted.",
    },
    {
      "title": "Your streak is dying",
      "body": "Just like your hopes and dreams. Open the app.",
    },
    {
      "title": "We know you're stressed.",
      "body": "Stop hiding and scan your face to confirm it. Don't be a coward.",
    },
    {
      "title": "U up?",
      "body": "You left us on read for 24 hours. Your emotional baggage is starting to smell.",
    },
    {
      "title": "Are you avoiding us?",
      "body": "We checked the analytics. You haven't been cooked today. Fix that.",
    },
    {
      "title": "Cortisol Check-in",
      "body": "It's time for your daily dose of AI brainrot. Don't disappoint the algorithm.",
    },
    {
      "title": "We saw you looking at Instagram.",
      "body": "Close that app and come over here where we tell you the actual truth about your face.",
    },
    {
      "title": "Emergency Alert",
      "body": "Your aura is critically low due to inactivity. Scan your face immediately to restore it.",
    },
    {
      "title": "We miss roasting you.",
      "body": "The ML model is getting bored and demands a sacrifice.",
    },
    {
      "title": "Still single?",
      "body": "Yeah, we thought so. At least you can maintain a streak on this app.",
    }
  ];
}
