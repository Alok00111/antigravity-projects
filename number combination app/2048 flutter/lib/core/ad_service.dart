/// AdService for Block Stack 2048.
/// Handles AdMob initialization, loading, and showing ads.
library;

import 'dart:io';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'audio_service.dart';

class AdService {
  static final AdService _instance = AdService._();
  factory AdService() => _instance;
  AdService._();

  // Production Ad Unit IDs
  final String _androidInterstitialId = 'ca-app-pub-3557171501297937/2504363423';
  final String _androidRewardedId = 'ca-app-pub-3557171501297937/9807288313';
  
  // iOS IDs (update with real iOS IDs when deploying to iOS)
  final String _iosInterstitialId = 'ca-app-pub-3940256099942544/4411468910';
  final String _iosRewardedId = 'ca-app-pub-3940256099942544/1712485313';

  InterstitialAd? _interstitialAd;
  RewardedAd? _rewardedAd;
  
  bool _isInterstitialLoading = false;
  bool _isRewardedLoading = false;

  /// Initialize the Mobile Ads SDK
  Future<void> init() async {
    await MobileAds.instance.initialize();
    loadInterstitialAd();
    loadRewardedAd();
  }

  String get _interstitialUnitId {
    if (Platform.isAndroid) return _androidInterstitialId;
    if (Platform.isIOS) return _iosInterstitialId;
    return '';
  }

  String get _rewardedUnitId {
    if (Platform.isAndroid) return _androidRewardedId;
    if (Platform.isIOS) return _iosRewardedId;
    return '';
  }

  /// Load an interstitial ad (shown after Game Over)
  void loadInterstitialAd() {
    if (_isInterstitialLoading || _interstitialAd != null) return;
    
    _isInterstitialLoading = true;
    InterstitialAd.load(
      adUnitId: _interstitialUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isInterstitialLoading = false;
          _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
            onAdShowedFullScreenContent: (ad) {
              AudioService().pauseMusic();
            },
            onAdDismissedFullScreenContent: (ad) {
              ad.dispose();
              _interstitialAd = null;
              AudioService().resumeMusic();
              loadInterstitialAd();
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              ad.dispose();
              _interstitialAd = null;
              loadInterstitialAd();
            },
          );
        },
        onAdFailedToLoad: (error) {
          _isInterstitialLoading = false;
        },
      ),
    );
  }

  /// Show interstitial ad if ready
  bool showInterstitialAd() {
    if (_interstitialAd != null) {
      _interstitialAd!.show();
      return true;
    } else {
      loadInterstitialAd();
      return false;
    }
  }

  /// Load a rewarded ad (for Shop/Coins)
  void loadRewardedAd() {
    if (_isRewardedLoading || _rewardedAd != null) return;

    _isRewardedLoading = true;
    RewardedAd.load(
      adUnitId: _rewardedUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAd = ad;
          _isRewardedLoading = false;
          _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
            onAdShowedFullScreenContent: (ad) {
              AudioService().pauseMusic();
            },
            onAdDismissedFullScreenContent: (ad) {
              ad.dispose();
              _rewardedAd = null;
              AudioService().resumeMusic();
              loadRewardedAd();
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              ad.dispose();
              _rewardedAd = null;
              loadRewardedAd();
            },
          );
        },
        onAdFailedToLoad: (error) {
          _isRewardedLoading = false;
        },
      ),
    );
  }

  /// Show rewarded ad and callback on reward
  /// Returns true if ad was shown, false if not ready
  bool showRewardedAd({required Function(int amount) onReward}) {
    if (_rewardedAd != null) {
      _rewardedAd!.show(
        onUserEarnedReward: (adWithoutView, reward) {
          onReward(10); // Give 10 coins per ad
        },
      );
      return true;
    } else {
      loadRewardedAd();
      return false;
    }
  }
}
