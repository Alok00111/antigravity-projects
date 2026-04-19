import 'package:battery_plus/battery_plus.dart';

enum TimeOfDayCategory {
  morning,    // 6 AM - 11 AM
  afternoon,  // 12 PM - 5 PM
  evening,    // 6 PM - 10 PM
  lateNight,  // 11 PM - 1 AM
  goblinHours // 2 AM - 5 AM
}

class DeviceContext {
  final int batteryLevel;
  final BatteryState batteryState;
  final TimeOfDayCategory timeCategory;
  final bool isWeekend;
  final DateTime currentTime;
  
  DeviceContext({
    required this.batteryLevel,
    required this.batteryState,
    required this.timeCategory,
    required this.isWeekend,
    required this.currentTime,
  });
}

class DeviceContextService {
  static final Battery _battery = Battery();

  static Future<DeviceContext> getContext() async {
    int batteryLevel = 50;
    BatteryState batteryState = BatteryState.unknown;
    try {
      batteryLevel = await _battery.batteryLevel;
      batteryState = await _battery.batteryState;
    } catch (_) {
      // Fallback
    }

    final now = DateTime.now();
    
    TimeOfDayCategory category;
    if (now.hour >= 6 && now.hour < 12) {
      category = TimeOfDayCategory.morning;
    } else if (now.hour >= 12 && now.hour < 18) {
      category = TimeOfDayCategory.afternoon;
    } else if (now.hour >= 18 && now.hour <= 22) {
      category = TimeOfDayCategory.evening;
    } else if (now.hour > 22 || now.hour <= 1) {
      category = TimeOfDayCategory.lateNight;
    } else {
      category = TimeOfDayCategory.goblinHours;
    }

    bool isWeekend = (now.weekday == DateTime.saturday || now.weekday == DateTime.sunday);

    return DeviceContext(
      batteryLevel: batteryLevel,
      batteryState: batteryState,
      timeCategory: category,
      isWeekend: isWeekend,
      currentTime: now,
    );
  }
}
