import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:flutter/foundation.dart';

/// Centralized Ad Management Service
/// Uses Google's test ad unit IDs for development
class AdManager {
  static final AdManager _instance = AdManager._internal();
  factory AdManager() => _instance;
  AdManager._internal();

  // Test Ad Unit IDs (Replace with real IDs for production)
  static const String _testRewardedAdId = 'ca-app-pub-3940256099942544/5224354917';
  static const String _testInterstitialAdId = 'ca-app-pub-3940256099942544/1033173712';
  
  // Production Ad Unit IDs (Replace these with your actual AdMob IDs)
  static const String _prodRewardedAdId = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';
  static const String _prodInterstitialAdId = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';
  
  // Use test ads in debug mode
  static String get rewardedAdId => kDebugMode ? _testRewardedAdId : _prodRewardedAdId;
  static String get interstitialAdId => kDebugMode ? _testInterstitialAdId : _prodInterstitialAdId;

  RewardedAd? _rewardedAd;
  InterstitialAd? _interstitialAd;
  
  bool _isInitialized = false;
  bool _isAdFree = false;
  
  // Track levels completed for interstitial frequency
  int _levelsSinceLastAd = 0;
  static const int _levelsPerInterstitial = 4;
  
  DateTime? _lastInterstitialTime;
  static const Duration _minInterstitialInterval = Duration(seconds: 180); // 3 minutes

  /// Initialize the Mobile Ads SDK
  Future<void> init() async {
    if (_isInitialized) return;
    
    await MobileAds.instance.initialize();
    
    // Add test device ID (from logs) to fix "No fill" error
    if (kDebugMode) {
      await MobileAds.instance.updateRequestConfiguration(
        RequestConfiguration(
          testDeviceIds: ['F3215433E17DD5D18AA289F87357216F'],
        ),
      );
    }
    
    _isInitialized = true;
    
    // Preload ads
    _loadRewardedAd();
    _loadInterstitialAd();
    
    debugPrint('AdManager: Initialized with test ads');
  }

  /// Set ad-free status (from IAP)
  void setAdFree(bool value) {
    _isAdFree = value;
    if (_isAdFree) {
      // Dispose loaded ads if user goes ad-free
      _rewardedAd?.dispose();
      _interstitialAd?.dispose();
      _rewardedAd = null;
      _interstitialAd = null;
    }
  }

  /// Check if a rewarded ad is ready
  bool get isRewardedAdReady => _rewardedAd != null;

  /// Check if an interstitial ad is ready
  bool get isInterstitialAdReady => _interstitialAd != null && !_isAdFree;

  // ============ REWARDED ADS ============

  void _loadRewardedAd() {
    if (_isAdFree) return;
    
    RewardedAd.load(
      adUnitId: rewardedAdId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          debugPrint('AdManager: Rewarded ad loaded');
          _rewardedAd = ad;
        },
        onAdFailedToLoad: (error) {
          debugPrint('AdManager: Rewarded ad failed to load: ${error.message}');
          _rewardedAd = null;
          // Retry after delay
          Future.delayed(const Duration(seconds: 30), _loadRewardedAd);
        },
      ),
    );
  }

  /// Show rewarded ad and call onRewarded when complete
  /// Returns true if ad was shown, false otherwise
  Future<bool> showRewardedAd({
    required Function(int amount) onRewarded,
    Function()? onAdClosed,
  }) async {
    if (_rewardedAd == null) {
      debugPrint('AdManager: Rewarded ad not ready');
      _loadRewardedAd();
      return false;
    }

    _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        debugPrint('AdManager: Rewarded ad dismissed');
        ad.dispose();
        _rewardedAd = null;
        _loadRewardedAd(); // Preload next ad
        onAdClosed?.call();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('AdManager: Rewarded ad failed to show: ${error.message}');
        ad.dispose();
        _rewardedAd = null;
        _loadRewardedAd();
      },
    );

    await _rewardedAd!.show(
      onUserEarnedReward: (ad, reward) {
        debugPrint('AdManager: User earned reward: ${reward.amount} ${reward.type}');
        onRewarded(reward.amount.toInt());
      },
    );

    return true;
  }

  // ============ INTERSTITIAL ADS ============

  void _loadInterstitialAd() {
    if (_isAdFree) return;
    
    InterstitialAd.load(
      adUnitId: interstitialAdId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          debugPrint('AdManager: Interstitial ad loaded');
          _interstitialAd = ad;
        },
        onAdFailedToLoad: (error) {
          debugPrint('AdManager: Interstitial ad failed to load: ${error.message}');
          _interstitialAd = null;
          // Retry after delay
          Future.delayed(const Duration(seconds: 30), _loadInterstitialAd);
        },
      ),
    );
  }

  /// Called when a level is completed. Shows interstitial if conditions met.
  Future<void> onLevelComplete({Function()? onAdClosed}) async {
    if (_isAdFree) return;
    
    _levelsSinceLastAd++;
    
    // Check frequency
    if (_levelsSinceLastAd < _levelsPerInterstitial) {
      debugPrint('AdManager: Skipping interstitial (${_levelsSinceLastAd}/$_levelsPerInterstitial levels)');
      return;
    }
    
    // Check time interval
    if (_lastInterstitialTime != null) {
      final timeSinceLast = DateTime.now().difference(_lastInterstitialTime!);
      if (timeSinceLast < _minInterstitialInterval) {
        debugPrint('AdManager: Skipping interstitial (too soon)');
        return;
      }
    }
    
    // Show ad if available
    if (_interstitialAd == null) {
      debugPrint('AdManager: Interstitial not ready');
      _loadInterstitialAd();
      return;
    }

    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        debugPrint('AdManager: Interstitial dismissed');
        ad.dispose();
        _interstitialAd = null;
        _loadInterstitialAd();
        onAdClosed?.call();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('AdManager: Interstitial failed to show: ${error.message}');
        ad.dispose();
        _interstitialAd = null;
        _loadInterstitialAd();
      },
    );

    await _interstitialAd!.show();
    _levelsSinceLastAd = 0;
    _lastInterstitialTime = DateTime.now();
  }

  /// Dispose all loaded ads
  void dispose() {
    _rewardedAd?.dispose();
    _interstitialAd?.dispose();
  }
}
