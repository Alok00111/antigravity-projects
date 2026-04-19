import 'dart:math';
import 'package:battery_plus/battery_plus.dart';
import 'package:intl/intl.dart';

import 'expression_classifier.dart';
import '../services/demographics_service.dart';
import '../services/device_context_service.dart';

/// The Mad Libs style Roast Engine that uses local device context
/// (Actionable data like Battery, Time, Day of Week, Expression) 
/// to generate an unhinged, highly personalized narrative.
class ContextualRoastEngine {
  static final _random = Random();

  static String generateRoast({
    required int cortisolScore,
    required DeviceContext context,
    FaceExpression? expression,
    DemographicCategory? demographic,
  }) {
    List<String> pool = [];
    final timeStr = DateFormat('h:mm a').format(context.currentTime);

    // ─────────────────────────────────────────────────────────
    // 1. PURE TIME BASED ROASTS
    // ─────────────────────────────────────────────────────────
    if (context.timeCategory == TimeOfDayCategory.goblinHours) {
      pool.addAll([
        "It's literally $timeStr and you're scanning your face on a cortisol app. Please just go to sleep, nobody is texting you back.",
        "Goblin hours. $timeStr and you have the audacity to stare into my camera? The sleep deprivation is making you look 10 years older.",
        "Why are you awake at $timeStr? Your crypto isn't pumping and you have zero matches. Put the phone down.",
        "At $timeStr your cortisol is $cortisolScore? Your circadian rhythm is fully cooked."
      ]);
      
      if (context.batteryLevel < 15) {
        pool.add("It's $timeStr and your phone is at ${context.batteryLevel}%. You are living on the absolute edge of degeneracy.");
      }
    }

    if (context.timeCategory == TimeOfDayCategory.lateNight) {
      pool.addAll([
        "Scanning at $timeStr instead of winding down... this is exactly why you're single and deeply stressed.",
        "It's late. Do you really want to be looking at your own $cortisolScore stress level at $timeStr instead of resting?",
      ]);
    }

    if (context.timeCategory == TimeOfDayCategory.morning && cortisolScore >= 600) {
      pool.addAll([
        "It's barely $timeStr and your cortisol is already $cortisolScore? Your day is absolutely chalked. Go back to bed.",
        "Waking up with $cortisolScore cortisol is insane. Did you wake up and immediately fight a feral raccoon?",
        "$timeStr and you're already tweaking. I dread to see how you function at 3 PM."
      ]);
    }

    // ─────────────────────────────────────────────────────────
    // 2. BATTERY BASED ROASTS
    // ─────────────────────────────────────────────────────────
    if (context.batteryLevel <= 15 && context.batteryState != BatteryState.charging) {
      pool.addAll([
        "Your phone is at ${context.batteryLevel}% and dying just like your hopes and dreams. Find a charger.",
        "Rawdogging life with ${context.batteryLevel}% battery and no charger in sight... no wonder your cortisol is $cortisolScore.",
        "Your battery is at ${context.batteryLevel}%. It literally has more energy left than you do right now."
      ]);

      if (expression == FaceExpression.smiling) {
        pool.add("Smiling like a psychopath while your phone is crying at ${context.batteryLevel}%. What is wrong with you?");
      }
    }

    if (context.batteryState == BatteryState.charging && context.batteryLevel < 50) {
      pool.addAll([
        "Even plugged in at ${context.batteryLevel}%, you're still nowhere near 100%. Honestly, same.",
        "Charging your phone won't charge your chronic lack of personality, but it's a start."
      ]);
    }

    if (context.batteryLevel == 100) {
      pool.addAll([
        "100% battery and yet somehow you still emit 0% aura. Tragic.",
        "Fully charged phone just to have zero incoming notifications. Must be tough."
      ]);
    }

    // ─────────────────────────────────────────────────────────
    // 3. EXPRESSION + DEMOGRAPHIC CROSSOVERS
    // ─────────────────────────────────────────────────────────
    if (demographic == DemographicCategory.genZMale) {
      if (expression == FaceExpression.frowning) {
        pool.addAll([
          "Pouting like a TikTok fuckboy who just realized his 'fit check' got 12 views.",
          "Frowning won't fix your negative canthal tilt or your tragic jawline, lil bro.",
        ]);
      } else if (expression == FaceExpression.smiling) {
        pool.addAll([
          "Smiling like he just discovered what a clitoris is. Keep coping, buddy.",
          "Looking way too happy for someone who definitely still uses Snapchat streaks in 2026."
        ]);
      } else if (expression == FaceExpression.squinting) {
        pool.addAll([
          "Squinting at the screen like an iPad kid who just lost his Cocomelon privileges.",
        ]);
      }
    } else if (demographic == DemographicCategory.millennialMale) {
       pool.addAll([
         "You have that 'I drink IPAs and still talk about The Office' millennial energy.",
         "Cortisol at $cortisolScore. Have you considered buying another houseplant to mask the void?"
       ]);
       if (expression == FaceExpression.smiling) {
         pool.add("That's the fake smile of a millennial who just paid \$24 for a smash burger.");
       }
    } else if (demographic == DemographicCategory.genZFemale) {
       if (expression == FaceExpression.neutral) {
         pool.add("Neutral face, 0 aura. You're giving 'I reply with just \"real\" to everything' energy.");
         pool.add("Completely dead inside. Did your situationship leave you on delivered again?");
       } else if (expression == FaceExpression.winking) {
         pool.add("Winking at a stress app? Please go touch grass and find a real man.");
       }
    }

    // ─────────────────────────────────────────────────────────
    // 4. WEEKEND / DAY OF WEEK
    // ─────────────────────────────────────────────────────────
    if (context.isWeekend) {
      if (cortisolScore > 600) {
        pool.addAll([
          "It's the freaking weekend and your cortisol is $cortisolScore. How are you failing at relaxing?",
          "Imagine being this stressed on a weekend. You literally cannot turn it off, can you?",
        ]);
      } else if (context.timeCategory == TimeOfDayCategory.morning) {
         pool.add("Waking up chill on a weekend morning. Enjoy it before Monday ruins your life again.");
      }
    } else {
      // Weekday
      if (context.timeCategory == TimeOfDayCategory.morning && cortisolScore > 500) {
         pool.add("Weekday morning grind and you're already sitting at $cortisolScore cortisol. Corporate slavery is real.");
      } else if (context.timeCategory == TimeOfDayCategory.afternoon && cortisolScore > 700) {
         pool.add("Midday weekday crash. Your cortisol is $cortisolScore, you need to quit your job immediately.");
      }
    }

    // ─────────────────────────────────────────────────────────
    // 5. PURE CORTISOL EXTREMES (If no specific context hits strong enough)
    // ─────────────────────────────────────────────────────────
    if (cortisolScore >= 900) {
      pool.addAll([
        "Your DNA is begging you to jump off a bridge. Cortisol is $cortisolScore.",
        "You are a Geneva Convention violation. Even the algorithm wants a restraining order at $cortisolScore.",
      ]);
    } else if (cortisolScore <= 200) {
      pool.addAll([
        "Cortisol is $cortisolScore. Are you high or just dead inside? Oh wait, it's both.",
        "Completely zen. Must be nice having zero ambition or responsibilities.",
      ]);
    }

    // ─────────────────────────────────────────────────────────
    // FALLBACK
    // ─────────────────────────────────────────────────────────
    if (pool.isEmpty) {
       pool.addAll([
         "Your cortisol is $cortisolScore. Honestly you're just incredibly mid, in every sense of the word.",
         "At $cortisolScore, you're the poster child for 'lights are on but nobody's home'.",
         "The scanner calculated your stress at $cortisolScore and then immediately requested a factory reset."
       ]);
    }

    // Randomly select one of the highly contextual roasts
    return pool[_random.nextInt(pool.length)];
  }
}
