import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import '../content/unhinged_notifications.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await _flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
    );
  }

  Future<void> requestPermissions() async {
    // Request for Android 13+
    await _flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
        
    // Request for iOS
    await _flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Schedules a random aggressive notification every day at 17:00 (5:00 PM).
  Future<void> scheduleDailyStreakReminder() async {
    // First, clear any existing schedule to reset the randomized prompt
    await _flutterLocalNotificationsPlugin.cancelAll();

    final unhingedPayload = UnhingedNotifications.getRandomNotification();
    final String title = unhingedPayload['title'] ?? "Cortisol Check-in";
    final String body = unhingedPayload['body'] ?? "Time to get roasted.";

    // Configure the Notification style
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'daily_streak_reminder', // channel id
      'Cortisol Streak Reminders', // channel name
      channelDescription: 'Daily unhinged reminders to keep your streak alive',
      importance: Importance.max,
      priority: Priority.high,
    );
    
    const DarwinNotificationDetails iosPlatformChannelSpecifics = 
        DarwinNotificationDetails();

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iosPlatformChannelSpecifics
    );

    // Schedule for 17:00 (5:00 PM) everyday repeatedly
    await _flutterLocalNotificationsPlugin.zonedSchedule(
      0, // ID 0 means only 1 recurring alarm
      title,
      body,
      _nextInstanceOf5PM(),
      platformChannelSpecifics,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }
  
  // Calculate the next occurrence of 5:00 PM local time
  tz.TZDateTime _nextInstanceOf5PM() {
    final tz.TZDateTime now = tz.TZDateTime.now(tz.local);
    tz.TZDateTime scheduledDate =
        tz.TZDateTime(tz.local, now.year, now.month, now.day, 17, 0);
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }
    return scheduledDate;
  }
}
