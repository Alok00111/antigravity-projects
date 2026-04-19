import 'dart:async';
import 'dart:math';

enum DistractionType {
  notification,
  message,
  call,
  lowBattery,
  download,
  update,
  alarm,
  reminder,
  socialMedia,
  email,
  payment,
  delivery,
  game,
  // Full screen types
  fullScreenAd,
  virusAlert,
  prizeWinner,
  systemUpdate,
  appCrash,
}

class Distraction {
  final DistractionType type;
  final String appName;
  final String title;
  final String message;
  final String? iconEmoji;
  final Duration displayDuration;
  final bool hasSound;
  final bool isFullScreen;

  Distraction({
    required this.type,
    required this.appName,
    required this.title,
    required this.message,
    this.iconEmoji,
    this.displayDuration = const Duration(seconds: 4),
    this.hasSound = true,
    this.isFullScreen = false,
  });
}

class DistractionService {
  final Random _random = Random();
  Timer? _timer;
  Function(Distraction)? onDistraction;
  final List<int> _recentIndices = [];

  final List<Distraction> _distractions = [
    // === FULL SCREEN DISTRACTIONS ===
    
    // Fake Video Ads
    Distraction(
      type: DistractionType.fullScreenAd,
      appName: 'Ad',
      title: 'SKIP AD',
      message: 'Download Candy Crush Now!',
      iconEmoji: '🍬',
      displayDuration: Duration(seconds: 6),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.fullScreenAd,
      appName: 'Ad',
      title: 'Skip in 5s',
      message: 'Clash of Clans - Build Your Empire!',
      iconEmoji: '⚔️',
      displayDuration: Duration(seconds: 6),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.fullScreenAd,
      appName: 'Ad', 
      title: 'INSTALL NOW',
      message: 'This game will make you addicted!',
      iconEmoji: '🎮',
      displayDuration: Duration(seconds: 5),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.fullScreenAd,
      appName: 'Sponsored',
      title: 'X',
      message: 'Get 100% Cashback on First Order!',
      iconEmoji: '💸',
      displayDuration: Duration(seconds: 5),
      isFullScreen: true,
    ),

    // Fake Virus/Security Alerts
    Distraction(
      type: DistractionType.virusAlert,
      appName: 'Security',
      title: '⚠️ VIRUS DETECTED!',
      message: 'Your phone is infected with 3 viruses! Tap to clean now.',
      iconEmoji: '🦠',
      displayDuration: Duration(seconds: 6),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.virusAlert,
      appName: 'Google',
      title: 'Security Warning',
      message: 'Your phone may be at risk! 2 threats found.',
      iconEmoji: '🔒',
      displayDuration: Duration(seconds: 5),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.virusAlert,
      appName: 'System',
      title: 'STORAGE FULL',
      message: 'Delete junk files to free 4.2GB space',
      iconEmoji: '📁',
      displayDuration: Duration(seconds: 5),
      isFullScreen: true,
    ),

    // Fake Prize Winners
    Distraction(
      type: DistractionType.prizeWinner,
      appName: 'Lucky Draw',
      title: '🎉 CONGRATULATIONS! 🎉',
      message: 'You have won an iPhone 15 Pro! Claim now!',
      iconEmoji: '🏆',
      displayDuration: Duration(seconds: 6),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.prizeWinner,
      appName: 'Spin & Win',
      title: 'YOU WON!',
      message: '₹10,000 Amazon Gift Card\nTap to claim before it expires!',
      iconEmoji: '🎁',
      displayDuration: Duration(seconds: 6),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.prizeWinner,
      appName: 'Survey',
      title: 'Congratulations!',
      message: 'You are our 1,000,000th visitor! Spin the wheel!',
      iconEmoji: '🎰',
      displayDuration: Duration(seconds: 5),
      isFullScreen: true,
    ),

    // Fake System Updates
    Distraction(
      type: DistractionType.systemUpdate,
      appName: 'System',
      title: 'System Update Available',
      message: 'Android 15 is ready to install\nTap to update now',
      iconEmoji: '📲',
      displayDuration: Duration(seconds: 5),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.systemUpdate,
      appName: 'Google Play',
      title: 'Apps Need Update',
      message: '12 apps need updating\nUpdate All',
      iconEmoji: '⬇️',
      displayDuration: Duration(seconds: 4),
      isFullScreen: true,
    ),

    // Fake App Crash
    Distraction(
      type: DistractionType.appCrash,
      appName: 'System',
      title: 'App Not Responding',
      message: 'Don\'t Touch The Screen isn\'t responding.\nWait or Close app?',
      iconEmoji: '💀',
      displayDuration: Duration(seconds: 5),
      isFullScreen: true,
    ),

    // === CALLS (Full Screen) ===
    Distraction(
      type: DistractionType.call,
      appName: 'Phone',
      title: 'Incoming Call',
      message: 'Unknown Number',
      iconEmoji: '📞',
      displayDuration: Duration(seconds: 8),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.call,
      appName: 'Phone',
      title: 'Incoming Call',
      message: 'Mom',
      iconEmoji: '📞',
      displayDuration: Duration(seconds: 8),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.call,
      appName: 'WhatsApp',
      title: 'WhatsApp Call',
      message: 'Boss',
      iconEmoji: '📱',
      displayDuration: Duration(seconds: 8),
      isFullScreen: true,
    ),
    Distraction(
      type: DistractionType.call,
      appName: 'Phone',
      title: 'Incoming Call',
      message: 'Crush 💕',
      iconEmoji: '📞',
      displayDuration: Duration(seconds: 8),
      isFullScreen: true,
    ),

    // === NOTIFICATION DISTRACTIONS ===
    
    // WhatsApp Messages
    Distraction(
      type: DistractionType.message,
      appName: 'WhatsApp',
      title: 'Mom',
      message: 'Beta, dinner is ready! Come home now 🍛',
      iconEmoji: '💬',
    ),
    Distraction(
      type: DistractionType.message,
      appName: 'WhatsApp',
      title: 'Family Group',
      message: '15 new messages',
      iconEmoji: '👨‍👩‍👧‍👦',
    ),
    Distraction(
      type: DistractionType.message,
      appName: 'WhatsApp',
      title: 'Best Friend',
      message: 'Bro check this out!! 😂😂',
      iconEmoji: '🔥',
    ),
    Distraction(
      type: DistractionType.message,
      appName: 'WhatsApp',
      title: 'Crush 💕',
      message: 'Heyy, you there? 👀',
      iconEmoji: '💕',
    ),

    // Instagram
    Distraction(
      type: DistractionType.socialMedia,
      appName: 'Instagram',
      title: 'New follower',
      message: '@coolperson123 started following you',
      iconEmoji: '📸',
    ),
    Distraction(
      type: DistractionType.socialMedia,
      appName: 'Instagram',
      title: 'Direct Message',
      message: 'Someone sent you a message',
      iconEmoji: '✉️',
    ),
    Distraction(
      type: DistractionType.socialMedia,
      appName: 'Instagram',
      title: 'Live Video',
      message: 'Your friend is now live! Watch now',
      iconEmoji: '🔴',
    ),

    // YouTube
    Distraction(
      type: DistractionType.notification,
      appName: 'YouTube',
      title: 'MrBeast',
      message: 'I Gave \$1,000,000 To Random Subscribers!',
      iconEmoji: '▶️',
    ),
    Distraction(
      type: DistractionType.notification,
      appName: 'YouTube',
      title: 'Trending',
      message: '#1 Trending video you might like',
      iconEmoji: '🔥',
    ),

    // System alerts
    Distraction(
      type: DistractionType.lowBattery,
      appName: 'System',
      title: 'Low Battery',
      message: '5% battery remaining. Connect charger.',
      iconEmoji: '🔋',
      displayDuration: Duration(seconds: 5),
    ),
    Distraction(
      type: DistractionType.download,
      appName: 'Chrome',
      title: 'Download Complete',
      message: 'important_file.pdf - Tap to open',
      iconEmoji: '📥',
    ),

    // Alarms & Reminders
    Distraction(
      type: DistractionType.alarm,
      appName: 'Clock',
      title: 'Timer',
      message: "Time's up! ⏰",
      iconEmoji: '⏰',
      displayDuration: Duration(seconds: 6),
    ),
    Distraction(
      type: DistractionType.reminder,
      appName: 'Calendar',
      title: 'Meeting in 5 minutes',
      message: 'Team standup - Join now',
      iconEmoji: '📅',
    ),

    // E-commerce & Payments
    Distraction(
      type: DistractionType.payment,
      appName: 'Google Pay',
      title: 'Payment Received',
      message: '₹5,000 received from Dad',
      iconEmoji: '💰',
    ),
    Distraction(
      type: DistractionType.delivery,
      appName: 'Amazon',
      title: 'Out for Delivery',
      message: 'Your package arrives today!',
      iconEmoji: '📦',
    ),
    Distraction(
      type: DistractionType.delivery,
      appName: 'Swiggy',
      title: 'Order Update',
      message: 'Your food is being prepared 🍔',
      iconEmoji: '🛵',
    ),

    // Email
    Distraction(
      type: DistractionType.email,
      appName: 'Gmail',
      title: 'Job Application',
      message: 'Congratulations! You are selected for...',
      iconEmoji: '📧',
    ),

    // Games
    Distraction(
      type: DistractionType.game,
      appName: 'Candy Crush',
      title: 'Free Lives!',
      message: 'Claim your 5 free lives now! 🎮',
      iconEmoji: '🎮',
    ),
    Distraction(
      type: DistractionType.game,
      appName: 'BGMI',
      title: 'Squad Invite',
      message: 'Your friend invited you to play',
      iconEmoji: '🎯',
    ),

    // Snapchat
    Distraction(
      type: DistractionType.socialMedia,
      appName: 'Snapchat',
      title: 'New Snap',
      message: '📸 from BFF - Tap to view',
      iconEmoji: '👻',
    ),

    // Telegram
    Distraction(
      type: DistractionType.message,
      appName: 'Telegram',
      title: 'Secret Chat',
      message: 'New message (self-destructing)',
      iconEmoji: '✈️',
    ),

    // Netflix
    Distraction(
      type: DistractionType.notification,
      appName: 'Netflix',
      title: 'New Episode',
      message: 'Stranger Things S5 is now streaming!',
      iconEmoji: '🎬',
    ),

    // Spotify
    Distraction(
      type: DistractionType.notification,
      appName: 'Spotify',
      title: 'Your friend is listening',
      message: 'See what songs they love 🎵',
      iconEmoji: '🎵',
    ),
  ];

  void start() {
    _recentIndices.clear();
    _scheduleNext();
  }

  void _scheduleNext() {
    // Show distraction every 5 seconds
    final delay = Duration(seconds: 5);
    _timer = Timer(delay, () {
      _showRandomDistraction();
      _scheduleNext();
    });
  }

  void _showRandomDistraction() {
    if (onDistraction == null) return;

    // Get a random index that wasn't used recently
    int index;
    int attempts = 0;
    do {
      index = _random.nextInt(_distractions.length);
      attempts++;
    } while (_recentIndices.contains(index) && attempts < 15);

    // Track recent indices to avoid repetition
    _recentIndices.add(index);
    if (_recentIndices.length > 8) {
      _recentIndices.removeAt(0);
    }

    onDistraction!(_distractions[index]);
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }
}
