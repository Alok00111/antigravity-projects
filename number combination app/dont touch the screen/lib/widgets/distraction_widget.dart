import 'package:flutter/material.dart';
import 'dart:ui';
import '../services/distraction_service.dart';
import '../services/platform_service.dart';

class DistractionWidget extends StatelessWidget {
  final Distraction distraction;
  final VoidCallback onDismiss;

  const DistractionWidget({
    super.key,
    required this.distraction,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final isIOS = PlatformService.isIOS;

    switch (distraction.type) {
      case DistractionType.call:
        return isIOS ? _buildIPhoneCall(context) : _buildAndroidCall(context);
      case DistractionType.fullScreenAd:
        return _buildFullScreenAd(context);
      case DistractionType.virusAlert:
        return _buildVirusAlert(context);
      case DistractionType.prizeWinner:
        return _buildPrizeWinner(context);
      case DistractionType.systemUpdate:
        return isIOS ? _buildIPhoneSystemUpdate(context) : _buildAndroidSystemUpdate(context);
      case DistractionType.appCrash:
        return isIOS ? _buildIPhoneAppCrash(context) : _buildAndroidAppCrash(context);
      case DistractionType.lowBattery:
        return isIOS ? _buildIPhoneLowBattery(context) : _buildAndroidLowBattery(context);
      case DistractionType.alarm:
        return isIOS ? _buildIPhoneAlarm(context) : _buildAndroidAlarm(context);
      default:
        return isIOS ? _buildIPhoneNotification(context) : _buildAndroidNotification(context);
    }
  }

  // iOS-style notification banner
  Widget _buildIPhoneNotification(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 8,
      left: 8,
      right: 8,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.85),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                // App icon - rounded square like iOS
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: _getAppColor(),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(child: _getAppIcon()),
                ),
                const SizedBox(width: 10),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Text(
                            distraction.appName.toUpperCase(),
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.3,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            'now',
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        distraction.title,
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        distraction.message,
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontSize: 13,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // iOS-style incoming call
  Widget _buildIPhoneCall(BuildContext context) {
    return Positioned.fill(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF1C1C1E),
              Color(0xFF000000),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 50),
              // Caller info
              Text(
                distraction.message,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w300,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                distraction.appName == 'WhatsApp' 
                    ? 'WhatsApp Audio' 
                    : 'mobile',
                style: TextStyle(
                  color: Colors.grey.shade400,
                  fontSize: 18,
                ),
              ),
              const Spacer(),
              // Avatar
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.grey.shade700,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    distraction.message.isNotEmpty 
                        ? distraction.message[0].toUpperCase() 
                        : '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 44,
                      fontWeight: FontWeight.w300,
                    ),
                  ),
                ),
              ),
              const Spacer(),
              // iOS action buttons row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 50),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildIOSCallAction(Icons.alarm, 'Remind Me'),
                    _buildIOSCallAction(Icons.message, 'Message'),
                  ],
                ),
              ),
              const SizedBox(height: 50),
              // Accept/Decline buttons (iOS style)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 50),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Decline
                    Column(
                      children: [
                        Container(
                          width: 70,
                          height: 70,
                          decoration: const BoxDecoration(
                            color: Color(0xFFFF3B30),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.call_end,
                            color: Colors.white,
                            size: 35,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Decline',
                          style: TextStyle(color: Colors.white, fontSize: 13),
                        ),
                      ],
                    ),
                    // Accept
                    Column(
                      children: [
                        Container(
                          width: 70,
                          height: 70,
                          decoration: const BoxDecoration(
                            color: Color(0xFF34C759),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.call,
                            color: Colors.white,
                            size: 35,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Accept',
                          style: TextStyle(color: Colors.white, fontSize: 13),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 50),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIOSCallAction(IconData icon, String label) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.white, size: 26),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
        ),
      ],
    );
  }

  // iOS-style low battery alert
  Widget _buildIPhoneLowBattery(BuildContext context) {
    final dialogWidth = PlatformService.getDialogWidth(context);
    final fontScale = PlatformService.getFontScaleFactor(context);

    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.4),
        child: Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Container(
                width: dialogWidth,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF2C2C2E).withOpacity(0.9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Low Battery',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17 * fontScale,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '5% battery remaining',
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 13 * fontScale,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      height: 44,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Colors.grey.shade700, width: 0.5),
                        ),
                      ),
                      child: const Center(
                        child: Text(
                          'OK',
                          style: TextStyle(
                            color: Color(0xFF0A84FF),
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // iOS-style alarm
  Widget _buildIPhoneAlarm(BuildContext context) {
    final dialogWidth = PlatformService.getDialogWidth(context);

    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.4),
        child: Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Container(
                width: dialogWidth,
                decoration: BoxDecoration(
                  color: const Color(0xFF2C2C2E).withOpacity(0.9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Text(
                            'Timer',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            "Time's up!",
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Colors.grey.shade700, width: 0.5),
                        ),
                      ),
                      child: const SizedBox(
                        height: 44,
                        child: Center(
                          child: Text(
                            'OK',
                            style: TextStyle(
                              color: Color(0xFF0A84FF),
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // iOS-style system update
  Widget _buildIPhoneSystemUpdate(BuildContext context) {
    final osName = PlatformService.getOSName(context);
    final dialogWidth = PlatformService.getDialogWidth(context);
    final fontScale = PlatformService.getFontScaleFactor(context);

    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.4),
        child: Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Container(
                width: dialogWidth,
                decoration: BoxDecoration(
                  color: const Color(0xFF2C2C2E).withOpacity(0.9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Icon(
                            Icons.system_update,
                            color: Colors.white,
                            size: 40 * fontScale,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Software Update',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 17 * fontScale,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '$osName 18.1 is available. Would you like to update now?',
                            style: TextStyle(
                              color: Colors.grey.shade400,
                              fontSize: 13 * fontScale,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Colors.grey.shade700, width: 0.5),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: 44,
                              decoration: BoxDecoration(
                                border: Border(
                                  right: BorderSide(color: Colors.grey.shade700, width: 0.5),
                                ),
                              ),
                              child: const Center(
                                child: Text(
                                  'Later',
                                  style: TextStyle(
                                    color: Color(0xFF0A84FF),
                                    fontSize: 17,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const Expanded(
                            child: SizedBox(
                              height: 44,
                              child: Center(
                                child: Text(
                                  'Install',
                                  style: TextStyle(
                                    color: Color(0xFF0A84FF),
                                    fontSize: 17,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // iOS-style app crash dialog
  Widget _buildIPhoneAppCrash(BuildContext context) {
    final dialogWidth = PlatformService.getDialogWidth(context);

    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.4),
        child: Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Container(
                width: dialogWidth,
                decoration: BoxDecoration(
                  color: const Color(0xFF2C2C2E).withOpacity(0.9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          const Text(
                            '"Don\'t Touch The Screen" is Not Responding',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Would you like to wait or close the app?',
                            style: TextStyle(
                              color: Colors.grey.shade400,
                              fontSize: 13,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Colors.grey.shade700, width: 0.5),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: 44,
                              decoration: BoxDecoration(
                                border: Border(
                                  right: BorderSide(color: Colors.grey.shade700, width: 0.5),
                                ),
                              ),
                              child: const Center(
                                child: Text(
                                  'Wait',
                                  style: TextStyle(
                                    color: Color(0xFF0A84FF),
                                    fontSize: 17,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const Expanded(
                            child: SizedBox(
                              height: 44,
                              child: Center(
                                child: Text(
                                  'Close App',
                                  style: TextStyle(
                                    color: Color(0xFFFF3B30),
                                    fontSize: 17,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Full-screen Ad
  Widget _buildFullScreenAd(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black,
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.blue.shade600,
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Center(
                      child: Text(
                        distraction.iconEmoji ?? '🎮',
                        style: const TextStyle(fontSize: 50),
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                  Text(
                    distraction.message,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF34C759),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'INSTALL',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              top: MediaQuery.of(context).padding.top + 10,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    Text(
                      distraction.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.close, color: Colors.white, size: 14),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Virus Alert
  Widget _buildVirusAlert(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.95),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(
                  color: Color(0xFFFF3B30),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.white,
                  size: 50,
                ),
              ),
              const SizedBox(height: 30),
              Text(
                distraction.title,
                style: const TextStyle(
                  color: Color(0xFFFF3B30),
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  distraction.message,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 40),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF3B30),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'CLEAN NOW',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Prize Winner
  Widget _buildPrizeWinner(BuildContext context) {
    return Positioned.fill(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.purple.shade900,
              Colors.black,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🎊 🎉 🎊', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 20),
              Text(
                distraction.title,
                style: const TextStyle(
                  color: Color(0xFFFFD700),
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 30),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFFD700).withOpacity(0.5)),
                ),
                child: Column(
                  children: [
                    Text(distraction.iconEmoji ?? '🎁', style: const TextStyle(fontSize: 50)),
                    const SizedBox(height: 10),
                    Text(
                      distraction.message,
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFD700), Color(0xFFFF8C00)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'CLAIM NOW!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _getAppIcon() {
    final appName = distraction.appName.toLowerCase();
    IconData iconData;
    
    switch (appName) {
      case 'whatsapp':
        iconData = Icons.chat_bubble;
        break;
      case 'instagram':
        iconData = Icons.camera_alt;
        break;
      case 'youtube':
        iconData = Icons.play_arrow;
        break;
      case 'gmail':
        iconData = Icons.mail;
        break;
      case 'netflix':
        iconData = Icons.movie;
        break;
      case 'spotify':
        iconData = Icons.music_note;
        break;
      default:
        iconData = Icons.notifications;
    }
    
    return Icon(iconData, color: Colors.white, size: 20);
  }

  Color _getAppColor() {
    switch (distraction.appName.toLowerCase()) {
      case 'whatsapp':
        return const Color(0xFF25D366);
      case 'instagram':
        return const Color(0xFFE1306C);
      case 'youtube':
        return const Color(0xFFFF0000);
      case 'gmail':
        return const Color(0xFFEA4335);
      case 'netflix':
        return const Color(0xFFE50914);
      case 'spotify':
        return const Color(0xFF1DB954);
      default:
        return Colors.grey.shade600;
    }
  }

  // ==========================================
  // ANDROID-STYLE WIDGETS
  // ==========================================

  // Android-style notification (Material Design)
  Widget _buildAndroidNotification(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 4,
      left: 4,
      right: 4,
      child: Material(
        elevation: 6,
        borderRadius: BorderRadius.circular(4),
        color: const Color(0xFF2D2D2D),
        child: Container(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // App icon - small circle like Android
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: _getAppColor(),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Center(
                  child: Icon(
                    _getAndroidAppIcon(),
                    color: Colors.white,
                    size: 14,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Text(
                          distraction.appName,
                          style: TextStyle(
                            color: Colors.grey.shade400,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Text(
                          ' • now',
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                        const Spacer(),
                        Icon(
                          Icons.expand_more,
                          color: Colors.grey.shade500,
                          size: 18,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      distraction.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      distraction.message,
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 13,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Android-style incoming call
  Widget _buildAndroidCall(BuildContext context) {
    return Positioned.fill(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF1A1A2E),
              Color(0xFF16213E),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 60),
              // Caller avatar
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.teal.shade700,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    distraction.message.isNotEmpty
                        ? distraction.message[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 50,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Caller name
              Text(
                distraction.message,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                distraction.appName == 'WhatsApp'
                    ? 'WhatsApp voice call'
                    : 'Incoming call',
                style: TextStyle(
                  color: Colors.grey.shade400,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              // Android-style call buttons
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildAndroidCallButton(
                      icon: Icons.call_end,
                      label: 'Decline',
                      color: const Color(0xFFEA4335),
                    ),
                    _buildAndroidCallButton(
                      icon: Icons.call,
                      label: 'Answer',
                      color: const Color(0xFF34A853),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // Swipe hint text
              Text(
                'Swipe up to reply with message',
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAndroidCallButton({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.white, size: 32),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 14),
        ),
      ],
    );
  }

  // Android-style low battery notification
  Widget _buildAndroidLowBattery(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 4,
      left: 4,
      right: 4,
      child: Material(
        elevation: 6,
        borderRadius: BorderRadius.circular(4),
        color: const Color(0xFF2D2D2D),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.orange.shade800,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.battery_alert,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Battery low',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '5% remaining. Connect to charger.',
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: null,
                child: Text(
                  'BATTERY SAVER',
                  style: TextStyle(
                    color: Colors.blue.shade400,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Android-style alarm dialog
  Widget _buildAndroidAlarm(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.6),
        child: Center(
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(4),
            color: const Color(0xFF303030),
            child: Container(
              width: 280,
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.alarm,
                    color: Colors.white,
                    size: 48,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    "Time's up!",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Timer',
                    style: TextStyle(
                      color: Colors.grey.shade400,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: null,
                        child: Text(
                          'SNOOZE',
                          style: TextStyle(
                            color: Colors.blue.shade400,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: null,
                        child: Text(
                          'DISMISS',
                          style: TextStyle(
                            color: Colors.blue.shade400,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Android-style system update dialog
  Widget _buildAndroidSystemUpdate(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.6),
        child: Center(
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(4),
            color: const Color(0xFF303030),
            child: Container(
              width: 300,
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.green.shade700,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.system_update,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Text(
                          'System update available',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Android 15 is ready to install. Your device will restart during the update.',
                    style: TextStyle(
                      color: Colors.grey.shade400,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: null,
                        child: Text(
                          'LATER',
                          style: TextStyle(
                            color: Colors.blue.shade400,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: null,
                        child: Text(
                          'INSTALL',
                          style: TextStyle(
                            color: Colors.blue.shade400,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Android-style app not responding (ANR) dialog
  Widget _buildAndroidAppCrash(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.6),
        child: Center(
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(4),
            color: const Color(0xFF303030),
            child: Container(
              width: 300,
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Don't Touch The Screen isn't responding",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Do you want to close it?',
                    style: TextStyle(
                      color: Colors.grey.shade400,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: null,
                        child: Text(
                          'WAIT',
                          style: TextStyle(
                            color: Colors.blue.shade400,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: null,
                        child: Text(
                          'CLOSE APP',
                          style: TextStyle(
                            color: Colors.blue.shade400,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _getAndroidAppIcon() {
    final appName = distraction.appName.toLowerCase();

    switch (appName) {
      case 'whatsapp':
        return Icons.chat;
      case 'instagram':
        return Icons.camera_alt;
      case 'youtube':
        return Icons.play_arrow;
      case 'gmail':
        return Icons.mail_outline;
      case 'netflix':
        return Icons.movie_outlined;
      case 'spotify':
        return Icons.music_note;
      case 'chrome':
        return Icons.public;
      case 'google pay':
        return Icons.payment;
      case 'amazon':
        return Icons.shopping_cart;
      case 'swiggy':
        return Icons.delivery_dining;
      case 'telegram':
        return Icons.send;
      case 'snapchat':
        return Icons.camera;
      default:
        return Icons.notifications_none;
    }
  }
}

