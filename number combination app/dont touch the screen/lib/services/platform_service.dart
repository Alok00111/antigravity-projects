import 'dart:io';
import 'package:flutter/widgets.dart';

enum DevicePlatform { ios, android }
enum DeviceType { phone, tablet }

/// Service to detect the current device platform and type
class PlatformService {
  /// Gets the current device platform
  static DevicePlatform get currentPlatform {
    return Platform.isIOS ? DevicePlatform.ios : DevicePlatform.android;
  }

  /// Returns true if running on iOS
  static bool get isIOS => Platform.isIOS;

  /// Returns true if running on Android
  static bool get isAndroid => Platform.isAndroid;

  /// Gets the device type based on screen size
  /// A device is considered a tablet if the shortest side is >= 600dp
  static DeviceType getDeviceType(BuildContext context) {
    final shortestSide = MediaQuery.of(context).size.shortestSide;
    return shortestSide >= 600 ? DeviceType.tablet : DeviceType.phone;
  }

  /// Returns true if the device is a tablet
  static bool isTablet(BuildContext context) {
    return getDeviceType(context) == DeviceType.tablet;
  }

  /// Returns true if the device is a phone
  static bool isPhone(BuildContext context) {
    return getDeviceType(context) == DeviceType.phone;
  }

  /// Gets a device-friendly name for UI display
  /// Returns "iPad" for iOS tablets, "iPhone" for iOS phones,
  /// "tablet" for Android tablets, "phone" for Android phones
  static String getDeviceName(BuildContext context) {
    final deviceType = getDeviceType(context);

    if (isIOS) {
      return deviceType == DeviceType.tablet ? 'iPad' : 'iPhone';
    } else {
      return deviceType == DeviceType.tablet ? 'tablet' : 'phone';
    }
  }

  /// Gets the OS name for UI display
  /// Returns "iPadOS" for iPad, "iOS" for iPhone, "Android" for Android
  static String getOSName(BuildContext context) {
    if (isIOS) {
      return isTablet(context) ? 'iPadOS' : 'iOS';
    }
    return 'Android';
  }

  /// Gets a scaling factor for widgets based on device type
  /// Tablets get 1.3x scaling, phones get 1.0x
  static double getScaleFactor(BuildContext context) {
    return isTablet(context) ? 1.3 : 1.0;
  }

  /// Gets a font scaling factor for text
  /// Tablets get slightly larger text (1.15x)
  static double getFontScaleFactor(BuildContext context) {
    return isTablet(context) ? 1.15 : 1.0;
  }

  /// Gets responsive dialog width based on device
  static double getDialogWidth(BuildContext context, {double baseWidth = 270}) {
    final screenWidth = MediaQuery.of(context).size.width;
    final scaleFactor = getScaleFactor(context);

    // On tablets, use a max of 450, on phones scale the base width
    if (isTablet(context)) {
      return (baseWidth * scaleFactor).clamp(300, 450);
    }
    return baseWidth.clamp(250, screenWidth * 0.9);
  }

  /// Gets device info summary
  static DeviceInfo getDeviceInfo(BuildContext context) {
    return DeviceInfo(
      platform: currentPlatform,
      deviceType: getDeviceType(context),
      isLargeScreen: isTablet(context),
      deviceName: getDeviceName(context),
      osName: getOSName(context),
    );
  }
}

/// Data class containing device information
class DeviceInfo {
  final DevicePlatform platform;
  final DeviceType deviceType;
  final bool isLargeScreen;
  final String deviceName;
  final String osName;

  const DeviceInfo({
    required this.platform,
    required this.deviceType,
    required this.isLargeScreen,
    required this.deviceName,
    required this.osName,
  });

  bool get isIOS => platform == DevicePlatform.ios;
  bool get isAndroid => platform == DevicePlatform.android;
  bool get isPhone => deviceType == DeviceType.phone;
  bool get isTablet => deviceType == DeviceType.tablet;
}
