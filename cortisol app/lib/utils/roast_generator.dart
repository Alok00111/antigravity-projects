import 'dart:math';
import 'expression_classifier.dart';
import '../services/demographics_service.dart';
import '../content/demographic_roasts.dart';
/// Generates a fake cortisol level and selects a matching unhinged remark
/// based on both the cortisol tier AND the detected facial expression.
class RoastGenerator {
  static final _random = Random();

  /// Generate a cortisol score from 100 to 999.
  /// Based specifically on the detected FaceExpression.
  static int generateCortisolLevel(FaceExpression? expression) {
    if (expression == null) {
      return _random.nextInt(900) + 100;
    }

    int minScore = 100;
    int maxScore = 999;

    switch (expression) {
      case FaceExpression.bigSmile:
        minScore = 100; maxScore = 200; break;
      case FaceExpression.smiling:
        minScore = 150; maxScore = 350; break;
      case FaceExpression.neutral:
        minScore = 300; maxScore = 500; break;
      case FaceExpression.confused:
      case FaceExpression.winking:
      case FaceExpression.eyesClosed:
        minScore = 400; maxScore = 650; break;
      case FaceExpression.squinting:
      case FaceExpression.lookingAway:
        minScore = 600; maxScore = 850; break;
      case FaceExpression.frowning:
        minScore = 800; maxScore = 999; break;
    }

    final score = minScore + _random.nextInt((maxScore - minScore) + 1);
    return score.clamp(100, 999);
  }

  /// Get a meme-worthy severity tier label from the score.
  static String getTier(int score) {
    if (score < 250) return 'UNBOTHERED AF';
    if (score < 450) return 'LOWKEY TWEAKIN';
    if (score < 650) return 'COOKED';
    if (score < 850) return 'ABSOLUTELY GEEKED';
    return 'CRASH OUT IMMINENT';
  }

  /// Get the tier color as a hex value.
  static int getTierColorHex(int score) {
    if (score < 250) return 0xFF34C759; // green
    if (score < 450) return 0xFFFFD600; // yellow
    if (score < 650) return 0xFFFF9500; // orange
    if (score < 850) return 0xFFFF2D55; // red
    return 0xFFAF52DE; // purple / catastrophic
  }

  /// Get a short emoji for the tier.
  static String getTierEmoji(int score) {
    if (score < 250) return '💅';
    if (score < 450) return '🥴';
    if (score < 650) return '💀';
    if (score < 850) return '🍆';
    return '☣️';
  }

  /// Select a roast based purely on the cortisol score.
  static String getTierRoast(int score) {
    return _getTierRoast(score);
  }

  /// Select a brutal 1-line roast based on the detected facial expression.
  static String? getExpressionRoast(FaceExpression? expression) {
    if (expression != null) {
      final exprRoasts = _expressionRoasts[expression];
      if (exprRoasts != null && exprRoasts.isNotEmpty) {
        return exprRoasts[_random.nextInt(exprRoasts.length)];
      }
    }
    return null;
  }

  static String _getTierRoast(int score) {
    final List<String> remarks;

    if (score < 250) {
      remarks = _stableRoasts;
    } else if (score < 450) {
      remarks = _elevatedRoasts;
    } else if (score < 650) {
      remarks = _highRoasts;
    } else if (score < 850) {
      remarks = _criticalRoasts;
    } else {
      remarks = _catastrophicRoasts;
    }

    return remarks[_random.nextInt(remarks.length)];
  }

  // ──────────────────────────────────────────────────────────
  // EXPRESSION-SPECIFIC ROASTS
  // ──────────────────────────────────────────────────────────

  static const Map<FaceExpression, List<String>> _expressionRoasts = {
    FaceExpression.bigSmile: [
      "Smiling THIS hard? You either got that sloppy toppy or you're a certified psychopath.",
      "Bro is beaming like he just sent an unsolicited dick pic and thinks she liked it.",
      "You're cheesin' so hard you look like an NPC right before they give you a fetch quest.",
      "That smile screams 'I rawdogged therapy and learned nothing.'",
      "We get it, you got laid. Wipe that goofy shit off your face.",
      "You look so damn happy I assumed my algorithm was broken. W rizz.",
      "Smiling ear to ear? Delulu must really be the solulu today.",
      "Showing all your teeth like a feral badger isn't the flex you think it is.",
      "Bro is smiling like he just found out his rent bounced but doesn't care anymore.",
      "That grin is giving off major 'I peak at family reunions' energy.",
      "You're smiling like someone who still unironically says 'doggo'. Please stop.",
      "A smile that big usually indicates serious brain damage. Get checked.",
      "Cheesing like a dad who just dropped the worst barbecue joke of 2024.",
      "You look like a golden retriever trapped in the body of a disappointment.",
      "Bro's smile is so wide it's pulling his hairline back another inch.",
      "You're grinning like you just successfully gaslit someone into staying with you.",
      "Smiling like you genuinely think you're the main character. You're the background extra.",
      "That smile is doing way too much heavy lifting for a face that mid.",
      "You grinning at the phone like it's gonna text you back. Spoiler: It won't.",
      "Bro is happier than a frat boy finding an unattended vape.",
      "Smiling like you just got away with tax fraud but you only make 20k a year.",
      "That smile has the same energy as a youth pastor trying to relate to teens.",
      "Cheesing hard for the camera like your existence actually matters to the algorithm.",
      "You look like you just got called a 'good boy' and made it your whole personality.",
      "Smiling so hard your cheeks are gonna cramp before your bank account recovers.",
      "Bro is grinning like he just bought a bored ape in 2024. Tragic.",
      "You're giving big 'I still reply to Snapchat streaks' energy with that smile.",
      "Smiling like the rent is paid, but we both know your card declined at Chipotle.",
      "That is the smile of a mf who thinks a middle part counts as a personality.",
      "Bro is beaming like he didn't just spend 6 hours rotting in bed.",
      "You smile like a politician about to lie about raising taxes.",
      "Smiling like you actually understand the lore of Five Nights at Freddy's.",
      "That massive grin screams 'I have no critical thinking skills'.",
      "You're smiling like you successfully parallel parked for the first time in your life.",
      "Bro is so happy he looks like he's about to start a cult in a Denny's parking lot.",
      "Smiling like a toddler who just successfully shit their pants.",
      "You got the kind of smile that makes people cross the street when they see you.",
      "Grinning like a maniac because you finally hit 10 followers on TikTok. Huge.",
      "That smile is telling me you definitely still sleep with a nightlight.",
      "Bro is smiling like he just discovered what a clitoris is. Good for you.",
      "You look incredibly pleased with yourself for someone who has zero ops and zero hoes.",
      "Smiling like you just hit a 2-day streak on Duolingo and think you're bilingual.",
      "That grin is straight up terrifying. You look like a sleep paralysis demon.",
      "Bro is smiling like he just got un-shadowbanned on Twitter.",
      "Smiling so big it's actually highlighting your asymmetrical jawline. Tragic.",
      "You're grinning like you genuinely think 'skibidi' is a legitimate word.",
      "Bro's smile is brighter than his entire future.",
      "Smiling like someone whose frontal lobe definitely hasn't developed yet.",
      "That smile is proof that ignorance truly is bliss.",
      "You're beaming like you just found a leftover Zyn under the car seat."
    ],

    FaceExpression.smiling: [
      "A polite little smile. The exact face girls make when you ask 'Where my hug at?'",
      "You're giving 'everything is fine' smile but we all know you're getting absolutely clapped by life.",
      "Smiling but the eyes are screaming 'daddy issues.' We see you.",
      "This is the face of a mf who says 'no cap' after lying out their ass.",
      "Cute smile. Too bad the personality doesn't match.",
      "You're smiling like a boomer trying to use a self-checkout machine. Pure confusion wrapped in fake compliance.",
      "That slight smile is the ultimate beta male coping mechanism.",
      "Smiling softly like you didn't just cry in the shower an hour ago.",
      "You got that default NPC smile locked and loaded at all times.",
      "Bro's giving the 'I'm listening but I have no idea what you're saying' smile.",
      "That's the smile of someone who just lost an argument but wants to pretend they didn't care anyway.",
      "Smiling like you think you're being mysterious, but you're just boring.",
      "You look like you're smiling through the pain of a massive stomach ache.",
      "That little half-smile is giving major 'I peak in the friendzone' energy.",
      "Bro smiling like he just got a generic compliment and doesn't know how to act.",
      "You have the polite smile of a retail worker who is one rude customer away from snapping.",
      "Smiling gently like you're plotting something devious, but we know you're just picking what to eat.",
      "That's the fake smile you give when your mom calls your name from downstairs.",
      "You're smiling like you accidentally liked your ex's photo from 3 years ago and accepted your fate.",
      "Bro hit the 'Jim Halpert camera stare' smile and thinks he's hilarious.",
      "That smile couldn't hide your lack of rizz if it tried.",
      "Smiling like you just successfully read a clock with hands.",
      "You're giving the exact smile of someone who gets left on read and replies anyway.",
      "A tiny smile. Is that all your facial muscles can manage after years of rotting?",
      "Bro smiling like he's holding back a sneeze.",
      "That smile says 'I just put my phone on DND and feel incredibly powerful'.",
      "You look like you're smiling to avoid looking at your screen time report.",
      "Smiling like a sociopath trying to blend in at a social gathering.",
      "That's the smile of a mf who sends 'haha' when they have absolutely nothing to say.",
      "You're smiling like you just remembered a meme from 2016 and think it's still funny.",
      "Bro is smiling softly knowing damn well his assignments were due at 11:59 last night.",
      "That polite smile is exactly what people give you when you start talking about anime.",
      "Smiling like a kid whose mom just told them they could get McDonald's.",
      "You got that weak ass smile that screams 'I apologize when someone else bumps into me.'",
      "Bro's smile is as forced as a corporate diversity training.",
      "You're smiling like you just got a text, but it's literally just your service provider.",
      "That's the smile of someone who claims they 'love hiking' but gets out of breath walking up stairs.",
      "Smiling like you successfully hid your depression for another consecutive 24 hours.",
      "You look like you just ripped a silent fart and are waiting for someone to notice.",
      "Bro hit the timid smile of someone who always pays first on the split tab.",
      "That smile is doing absolutely nothing to improve your overall aesthetic.",
      "You're smiling like you genuinely believe crypto is going to bounce back.",
      "Smiling like a guy who strictly drinks IPAs and makes it his entire personality.",
      "That smile screams 'I text my mom when I'm scared'.",
      "Bro is giving the little smile of a dude who watches sigma male edits unironically.",
      "You're smiling like you actually have your life together. Stop lying to the algorithm.",
      "That soft smile is exactly how you look before getting curveball rejected.",
      "Smiling like you have a secret, but your only secret is that you still sleep with a stuffed animal.",
      "Bro's polite smile is the most forgettable thing I've ever processed.",
      "You look completely average and your smile is the cherry on top."
    ],

    FaceExpression.neutral: [
      "Negative canthal tilt, zero aura, resting bitch face. Wrap it up bro.",
      "Your face is buffering. No thoughts, just 100% smooth brain energy.",
      "You're giving absolutely nothing. Go girl, give us zero.",
      "This is the face of someone rawdogging life on 3 hours of sleep and gas station Zyn.",
      "Completely dead inside. Did your situationship leave you on delivered again?",
      "You looked at the camera with the same dead eyes you give your OnlyFans subscribers when they tip 5 bucks.",
      "Your face is so neutral I lost brain cells just scanning it. You definitely reply to texts with 'k'.",
      "Bro's face is stuck in default settings. Absolutely zero customization.",
      "Blank stare. You look like you're waiting for your turn to use the single brain cell.",
      "You literally have the facial expression of a thumb.",
      "Neutral expression? Bro has the personality of unseasoned chicken.",
      "You're looking at me like an iPad kid staring at CoComelon.",
      "This is the face of someone who watches hours of TikToks without laughing once.",
      "Bro is entirely dissociating. Come back to reality, your rent is due.",
      "You have the exact expression of a Sim whose queue was just cleared.",
      "Blank stare screaming 'I have absolutely zero ops and zero hoes'.",
      "You look like you're permanently disassociated from your own tragic reality.",
      "Neutral face. Just entirely numb to the fact that you're a walking L.",
      "Bro's face has less expression than a brick wall.",
      "You look like you just woke up from a 4-hour nap and don't know what year it is.",
      "That dead-eyed stare is giving major serial killer documentary B-roll.",
      "Zero emotion detected. Are you a sociopath or just heavily medicated?",
      "You look like you're staring at a microwave counting down the last 5 seconds.",
      "Bro has the resting face of someone who always gets 'seen' but never 'replied to'.",
      "You're doing the 'I'm not looking at anything' stare while creeping on someone in public.",
      "Complete lack of emotion. You definitely eat plain saltines as a snack.",
      "You look like you're contemplating whether to go to the gym or just stay broke and ugly.",
      "Bro is staring into the void and the void is telling him to get some bitches.",
      "That neutral face is exactly why you get overlooked for literally everything.",
      "You have the resting expression of an unlit candle.",
      "Staring blankly entirely devoid of rizz or charisma. Impressive.",
      "You look like you're doing math in your head but you forgot how to carry the one.",
      "Bro hit me with the 'lights are on but nobody's home' stare.",
      "You're giving NPC energy. Do you even have an internal monologue?",
      "That stare is the visual equivalent of dial-up internet noise.",
      "You look so neutral you could be a background extra in a commercial for antidepressants.",
      "Bro is looking at the screen like an absolute unit of pure mid.",
      "Your face is so emotionless I could use it as a white noise machine.",
      "Staring blankly like you're shocked the algorithm accurately diagnosed your lack of personality.",
      "You look like you just got lobotomized and are honestly okay with it.",
      "Bro has the dead eyes of an overworked cashier at a Spirit Halloween.",
      "You're giving 'I only drink water when my body forces me to' energy.",
      "Neutral af. You definitely have beige walls and no posters in your room.",
      "You look like a default Mii that someone accidentally hit 'Create' on.",
      "Bro is staring down the camera like he owes it money. Pay up.",
      "Your dead eyes scream 'I play League of Legends completely sober'.",
      "You have the resting face of someone who gets scammed regularly.",
      "Absolutely no soul behind those eyes. None.",
      "You're looking at the screen with the passion of a wet paper towel.",
      "Bro's neutral face is a stark reminder of his profound averageness."
    ],

    FaceExpression.frowning: [
      "Frowning won't fix your negative canthal tilt or your credit score.",
      "Bro's forehead is so wrinkled from frowning it looks like a barcode for depression.",
      "You're actively frowning like looking at yourself in the camera was a personal attack.",
      "That frown is carrying more emotional baggage than your last situationship.",
      "Frowning like you expected to see a 10 in the camera and got humbled.",
      "Stop frowning, you already look miserable enough by default.",
      "You have the frown of a mf who just realized they peaked in middle school.",
      "Frowning at your phone like it's the reason you have no bitches. It's not.",
      "Bro is frowning like he just found out his vape is out of juice and he's totally tweaking.",
      "That frown is pulling your whole face down into the abyss. Tragic.",
      "You look so sad it's almost funny. Almost.",
      "Frowning like you just paid \$40 for an Uber and the driver is actively missing the exit.",
      "Bro's lips are downturned so hard he looks like a disappointed blobfish.",
      "You have the exact frown of someone who just dropped their last chicken nugget.",
      "Frowning like a boomer trying to read a Gen Z meme. Pure confusion and anger.",
      "That frown screams 'I have 0 aura and the world knows it'.",
      "You're frowning like you just looked at your bank account after a weekend of pretending you're rich.",
      "Bro is pouting like a toddler who got his iPad taken away. Grow up.",
      "Frowning like the vibes are completely rancid. Spoiler: you ARE the bad vibes.",
      "You look like you're permanently upset about being exactly 5'8\".",
      "That frown is the face of a guy whose parlay just completely busted in the 4th quarter.",
      "You're frowning like you just smelled the absolute degeneracy emanating from yourself.",
      "Bro is actively mad at a piece of software. Touch grass immediately.",
      "Frowning so hard your eyebrows are going to fuse together. Big unibrow energy.",
      "You look like you just realized your crush has a completely public and thriving relationship.",
      "That frown is giving major incel energy complaining on a Reddit forum.",
      "Frowning like you're trying to intimdate the algorithm. It's not working, twink.",
      "Bro has the frown of a kid whose mom wouldn't buy him V-Bucks.",
      "You're frowning at me like I'm the one ruining your life. Take some accountability.",
      "That bitter pout is exactly why you're single and your DMs are dryer than the Sahara.",
      "Frowning like a disappointed father, which is ironic since yours probably looks at you the exact same way.",
      "Bro is upset because the algorithm diagnosed him with 'bitchless'. Cry about it.",
      "You look like you just tasted sparkling water for the first time and realized it's just angry static.",
      "Frowning like a guy who claims he's a 'nice guy' right before sending a 4-paragraph hate text.",
      "That frown says 'I hate the world' but really the world just doesn't care about you at all.",
      "Bro is sulking like he just got hit with a 'k' after pouring his heart out.",
      "Frowning so aggressively you're giving yourself premature wrinkles. Not a flex.",
      "You look like an anime villain who just realized the power of friendship actually works.",
      "That frown is as heavy as the disappointment you bring to your family tree.",
      "Frowning like a mf whose crypto portfolio is currently down 98%. HODL this L.",
      "Bro is visibly upset that he can't grow a full beard.",
      "You look like you just watched your homie secure a 10 while you're standing by the wall.",
      "That frown is radiating pure beta male frustration.",
      "Frowning like you're mad at the mirror for telling the truth.",
      "You're pouting so hard your bottom lip could serve as a landing strip.",
      "Bro is frowning like he's contractually obligated to be a buzzkill at all times.",
      "That frown is a defense mechanism for your overwhelming lack of personality.",
      "Frowning like you just remembered 2016 is never coming back. Get over it.",
      "You look visibly distressed that this app is reading you to absolute filth.",
      "Scowling at your phone isn't going to make you any less of a flop."
    ],

    FaceExpression.squinting: [
      "Why the fuck are you squinting? The text isn't that small. Put your glasses on, grandma.",
      "Squinting like you're trying to figure out if it's a 'u up?' text from your ex or Domino's pizza. It's Domino's, slut.",
      "Bro's squinting trying to find the clitoris through the phone screen.",
      "Your eyes are half-closed but your pores are fully open. Wash your fucking face.",
      "You're squinting like a frat boy trying to read a consent form. Sus af.",
      "The scanner assumes you're either high off your ass or legitimately blind.",
      "Squinting? Bro's trying to process this scan with a dial-up connection in their brain.",
      "Squinting like you're trying to read the fine print on your own tragic life choices.",
      "Bro is squinting like an anime character who is about to say some incredibly nerdy shit.",
      "You're squinting so hard your eyes disappeared. Much like your future prospects.",
      "Squinting at the camera like it just flashed its brights at you. Weak genetics.",
      "Bro is squinting like he's trying to see his own micropenis without a magnifying glass.",
      "You look like you're squinting directly into the sun of your own stupidity.",
      "Squinting like you just dropped your glasses in the toilet and are contemplating fishing them out.",
      "You're giving big 'I need Lasik but I'm too broke' energy.",
      "Bro is squinting like he's trying to decipher a cryptic text from a girl who clearly hates him.",
      "Squinting so hard you look like a perpetually confused mole rat.",
      "You look like someone who squints to read the menu at a drive-thru and still orders the same shit.",
      "Squinting like you're deeply suspicious of a 5-second harmless scan. Paranoid much?",
      "Bro is narrowing his eyes like a cartoon villain plotting a highly unsuccessful scheme.",
      "Squinting like you just saw a 10/10 in public and can't believe your eyes. They aren't looking at you.",
      "You're squinting like you're trying to spot a singular redeeming quality in your reflection.",
      "Bro's squinting like the brightness on his phone is set to flashbang.",
      "Squinting like a dad trying to figure out how to flip the camera on a FaceTime call.",
      "You look like you're squinting through the smoke of a burnt Hot Pocket.",
      "Squinting at the screen like it owes you money and you forgot exactly how much.",
      "Bro is narrowing his eyes like he's trying to mentally undress an anime character. Gross.",
      "Squinting like you're trying to solve a captcha that keeps asking you to find crosswalks.",
      "You look like you squint when you sneeze and somehow sneeze with your mouth open.",
      "Squinting like a guy who refuses to wear glasses because he thinks it hurts his 'aura'.",
      "Bro is squinting like he's trying to read the vibe, but the vibe is completely illiterate.",
      "You're squinting like you just realized you sent the screenshot to the person you took the screenshot of.",
      "Squinting like you're trying to see past your own raging insecurities.",
      "Bro is looking at the camera like he's aggressively trying to remember his own ZIP code.",
      "Squinting so hard your face looks like a crumpled up CVS receipt.",
      "You look like you're actively trying to squish your face into a smaller, sadder shape.",
      "Squinting like a rat that just emerged from the sewer into broad daylight.",
      "Bro is narrowing his eyes as if that makes him look mysterious. You're just blurry.",
      "Squinting at the phone like you're trying to see if your crypto went up. It didn't.",
      "You look like you squint when you type. That's big boomer energy.",
      "Squinting like you're trying to remember if you locked the door or if lying in bed is fine.",
      "Bro is squinting like he just hit a blinker and is trying to hold onto his singular brain cell.",
      "You're squinting like you're physically struggling to process basic information.",
      "Squinting so aggressively I can see your crow's feet forming in real time.",
      "Bro looks like he's squinting against the harsh reality of being completely average.",
      "Squinting like you're trying to identify a blurry shape in the distance and it's just your own failure.",
      "You look like you squint at the TV when the volume is too low. Actually retarded.",
      "Squinting like someone who genuinely thinks the earth might be flat but is afraid to ask.",
      "Bro's eyes are so narrowed he's basically rawdogging blindness for no reason.",
      "You're squinting at me like I'm the problem. I'm just the mirror, buddy."
    ],

    FaceExpression.winking: [
      "Did you just wink at the sensor? Down horrendous. Touch some grass.",
      "A wink! Mf thinks they have crazy rizz but realistically they haven't spoken to a woman since 2018.",
      "Winking at a cortisol scanner. Peak incel energy right here.",
      "Bro really hit the camera with the Lightskin Stare. I'm calling HR.",
      "You winked at me? Bitch I am code. Go get some real bitches.",
      "One eye open, one eye closed. Trying to hide half that ugly mug from the algorithm? Smart.",
      "Winking like a 40-year-old creepy uncle across the Thanksgiving table. Disgusting.",
      "Bro winked. You are immediately going on a watch list.",
      "You actually thought winking at a phone screen would do something. The delusion is terminal.",
      "Winking like you're a cartoon character holding a terrible secret. Grow up.",
      "Bro hit the camera with a wink like he's successfully seducing a string of numbers. Seek help.",
      "If you're winking to be ironic, it failed. If you're serious, it's a tragedy.",
      "You wink like someone who genuinely thinks negging works.",
      "Bro winked. I'm actively revoking your internet privileges.",
      "Winking at an app is some next-level loser behavior. What were you expecting to happen?",
      "You look like a glitching NPC whose eyelid is stuck. Stop that.",
      "Winking like a guy who sends 'hey trouble' at 2 AM on a Tuesday.",
      "Bro hit a wink that made my CPU throttle in pure cringe.",
      "You winked like a completely unhinged Disney Channel original movie villain.",
      "Winking like you just slipped a roofie in your own drink. Absolute dumbass.",
      "Bro's wink has negative rizz. It's actually sapping the charisma out of the room.",
      "You winked at a piece of software and thought it was slick. You are beyond saving.",
      "Winking like someone who still does magic tricks at college parties.",
      "Bro winked. My brother in Christ, you are staring at a piece of glass.",
      "That wink was so forced it looked like you were having a localized stroke.",
      "You winked like a sleazy car salesman trying to sell a 2004 Honda Civic with 300k miles.",
      "Bro threw a wink like he's practically begging for a restraining order.",
      "Winking? This isn't Tinder, you absolutely unlovable gremlin.",
      "You winked like you just told a dad joke and are waiting for the laugh track. Painful.",
      "Bro's giving major 'nice guy who turns toxic when rejected' energy with that wink.",
      "Winking at the algorithm is equivalent to flirting with a toaster. You're pathetic.",
      "That wink just lowered your credit score by 50 points.",
      "You look like someone who winks at the barista and then gets incredibly mad when they charge for oat milk.",
      "Bro winked. The sheer audacity of this unfuckable creature.",
      "Winking like you have a plan. The only plan you have is ordering DoorDash and rotting.",
      "You winked like someone who still uses the word 'swag' unironically in 2024.",
      "Bro's wink is physically repulsive. I need to purge my cache.",
      "Winking like an anime protagonist, but you look like the background extra that dies first.",
      "You winked like someone who thinks holding the door open entitles them to a handjob.",
      "Bro hit the wink. It's giving 'creepy dude at the gym staring at the mirror'.",
      "Winking like you are trying to communicate in Morse code. Blink twice if you need bitches.",
      "You have the wink of a guy who thinks buying purely organic groceries makes him superior.",
      "Bro winked and I physically recoiled. Please never do that again.",
      "That wink screams 'I just lied on my resume and they bought it'.",
      "Winking like you're in on a joke, but the joke is literally your entire life.",
      "You winked like a youth pastor trying to show he's 'down with the kidz'. Disgusting.",
      "Bro hit a wink like he's dropping the hardest pick-up line, but he's standing alone in his room.",
      "Winking at a cortisol scanner? Your priorities are as fucked as your hairline.",
      "That wink was so greasy I felt my screen instantly accumulate fingerprints.",
      "Bro winked. I am begging you to go outside and interact with a human being."
    ],

    FaceExpression.eyesClosed: [
      "Closing your eyes won't make you any less ugly to the rest of us.",
      "Bro closed his eyes so he didn't have to look at his own disastrous reflection.",
      "Eyes fully shut like you're bracing for impact because you know your face is a tragedy.",
      "Sleeping through the scan because your waking life is entirely devoid of meaning.",
      "You closed your eyes? Are you getting off to this or just entirely giving up on life?",
      "Shutting your eyes isn't going to hide the fact that you have zero aura.",
      "Bro closed his eyes like he's wishing on a shooting star for a girlfriend. It won't work.",
      "Eyes shut tight. You look like a baby that's refusing to eat its peas. Grow up.",
      "You closed your eyes so hard you look like you're trying to manually restart your brain.",
      "Bro is manifesting bitches with his eyes closed. Delusion at its absolute peak.",
      "Eyes closed like you just hit a blinker of a fake cart and your lungs are collapsing.",
      "You're closing your eyes like you just saw your screen time report and it's 14 hours on TikTok.",
      "Bro is literally sleeping. The melatonin hit you harder than reality.",
      "Eyes shut like you're listening to a sad song and pretending you're in a music video. Cringe.",
      "Closing your eyes to 'feel the vibes' but the vibes are literally just crippling anxiety.",
      "You look like you closed your eyes right before the flash went off. Flop era.",
      "Bro shut his eyes like he's hoping when he opens them his bank account will have money in it.",
      "Eyes closed, hands sweating, brain absolutely empty.",
      "You're sleeping through life while other people are actually touching grass.",
      "Closing your eyes like you're trying to hide from your own responsibilities. Typical.",
      "Bro thinks closing his eyes stops the algorithm from seeing how mid he is.",
      "Eyes closed looking like an absolute victim of the daily grind.",
      "You look like you're praying to whatever higher power can fix your busted genetic code.",
      "Bro closed his eyes like a dramamine kicked in mid-conversation.",
      "Eyes fully shut. You definitely fall asleep on the bus and miss your stop. Idiot.",
      "You look like a corpse that was badly prepared by a cheap mortician.",
      "Closing your eyes like you're trying to imagine a scenario where you actually pull.",
      "Bro's eyes are shut completely. Peak 'I give up' energy.",
      "Eyes closed like you're bracing to get slapped, which is exactly what you deserve.",
      "You look like someone who meditates for 2 minutes and calls it a spiritual awakening.",
      "Bro has his eyes closed like he's trying to remember a password he absolutely forgot.",
      "Eyes closed so tight you look like a wrinkled up raisin of despair.",
      "You're literally sleeping on the job of being a functioning human.",
      "Closing your eyes like a mom ignoring a screaming toddler. Unbothered but deeply stressed.",
      "Bro shut his eyes like he's enjoying the scent of his own farts. Heinous.",
      "Eyes closed looking entirely defenseless. Weak prey energy.",
      "You look like you closed your eyes to think and accidentally fell asleep.",
      "Bro is closing his eyes because the sight of his own face is too much to bear. Valid.",
      "Eyes shut tight. You definitely flinch when someone goes for a high five.",
      "You look like you're closing your eyes playing hide and seek like a literal toddler.",
      "Bro's eyes are closed like an NPC that ran out of idle animations.",
      "Closing your eyes won't protect you from the crushing weight of reality. Nice try though.",
      "You look like you just ate something sour and your entire face is collapsing inward.",
      "Bro closed his eyes to vibe to a podcast about crypto. Absolutely tragic.",
      "Eyes shut completely out of pure exhaustion from doing absolutely nothing all day.",
      "You look like someone who closes their eyes on a roller coaster because they are a huge bitch.",
      "Bro's eyes are closed like he's trying to absorb the sheer magnitude of his own Ls.",
      "Closing your eyes won't make the pain of being yourself go away.",
      "You look completely unconscious. Please stay that way, you're less annoying.",
      "Bro shut his eyes like he just sent a risky text and threw his phone across the room."
    ],

    FaceExpression.lookingAway: [
      "Looking away from the camera. Classic evasive maneuver of a chronic gaslighter.",
      "You literally looked away. Not my fault you can't even maintain eye contact with your own reflection.",
      "Turning your head like dodging the camera is gonna dodge the opps. They already have your location dumbass.",
      "Looking away so the app doesn't see you crying over your ex. It's okay, we're all laughing at you anyway.",
      "You turned your head like the cortisol was coming from outside the house. It's inside you, bozo.",
      "Stop looking away and face the music. Your life is a mess.",
      "Bro looked away like he just saw an ad for therapy and got scared.",
      "Looking away the exact same way your parents look away when you bring up your career.",
      "You're looking away like you're pretending not to see someone in public. Peak antisocial.",
      "Turning your head like you have a better angle. Spoiler: you don't.",
      "Bro looked away because staring into his own eyes caused an existential crisis.",
      "Looking off to the side like you're on an album cover, but really you're just standing in your mom's kitchen.",
      "You're dodging the camera just like you dodge accountability.",
      "Bro looked away like someone just called his name, but no one is talking to you.",
      "Looking away won't change the fact that you still live at home and have zero savings.",
      "You're looking away like a dog that knows it just destroyed a pillow.",
      "Bro turned his head like he's intensely focused on literally anything else to avoid self-reflection.",
      "Looking away like you expect a paparazzi flash. You are a nobody.",
      "You look like you're trying to act casual while actively stealing something.",
      "Bro looked away like he's checking for ops. You live in a gated community, Tyler.",
      "Looking off-camera like you're doing an interview for a documentary about incels.",
      "You're turning your head to hide your asymmetrical face. The ML model already clocked it.",
      "Bro is looking away like he just got roasted and is trying not to cry.",
      "Looking away is giving 'I can't handle the truth' energy. Pathetic.",
      "You look away like a guy who knows he's lying and can't maintain eye contact.",
      "Bro turned his head hoping to catch a breeze of fresh air in his musty ass room.",
      "Looking away from the screen as if staring at the wall is going to fix your problems.",
      "You turned away like a shy anime girl but you're a grown adult with bad posture.",
      "Bro is looking away like he's trying to spot his dignity. It's long gone.",
      "Looking to the side to show off the jawline you literally do not have.",
      "You're looking away like someone just threw a basketball at your head and you're flinching late.",
      "Bro turned away like he saw the ghost of his past mistakes walking in the room.",
      "Looking away like a dramatic reality TV star waiting for the camera cut.",
      "You turned your head to avoid the flash but it's just the harsh light of reality.",
      "Bro is looking away because looking direct-to-camera feels too intimate for his completely isolated self.",
      "Looking off to the side like a high schooler pretending to be deep in thought.",
      "You look away like a person who absolutely folds under pressure the second they are confronted.",
      "Bro turned his head as if the answers to his problems are written on the ceiling.",
      "Looking away from the screen gives immense 'I don't care' energy, but really you care way too much.",
      "You're turning your head like you just got caught taking a selfie in public and feel immense shame.",
      "Bro looked away like he's hoping his crush will notice his 'mysterious side profile'. It's not working.",
      "Looking away because making eye contact with your own depression is too much today.",
      "You turned your head like a disappointed boomer looking at modern art.",
      "Bro looked away like a guy who just missed the exit on the highway and has to pretend he didn't.",
      "Looking away to hide the fact that your eyes are watering from starring at your screen for 9 hours.",
      "You turned away like someone pretending to read a menu when they already know they want tendies.",
      "Bro is looking to the side like he's expecting an adult to come save him from his own life.",
      "Looking away like you have something better to do. We both know you have absolutely nothing going on.",
      "You turned your head like a cat ignoring its owner. Completely useless.",
      "Bro looked away. Total coward behavior. Face the lens and take the L like a man."
    ],

    FaceExpression.confused: [
      "Head tilt detected. Bro is entirely lost in the sauce.",
      "You tilting your head like a confused dog when it hears a vacuum cleaner. Negative IQ.",
      "You look genuinely baffled. That makes two of us — you about this app, and me about why you thought that haircut was a good idea.",
      "Tilting your head isn't going to make you look any better. It just exposes a different bad angle.",
      "Bro hit the TikTok fuckboy head tilt. Please log off.",
      "The 'what the sigma' head tilt. Your brain is entirely rotted.",
      "You look so confused. Did you just try to process a simple two-step instruction and fail?",
      "Bro is tilting his head like he's trying to pour the water out of his ear, but really it's to pour out his last brain cell.",
      "Confused face. You literally have the cognitive processing speed of an old dial-up router.",
      "You look like a bewildered boomer trying to understand what a 'skibidi' is.",
      "Tilting your head like a confused puppy. Except puppies are cute, and you are just an idiot.",
      "Bro hit me with the 'huh?' face. Try turning your brain off and on again.",
      "You look baffled as to why you're single, but everyone else completely understands.",
      "That confused look is the exact face you make when the waiter asks what sides you want and you panic.",
      "Bro is tilting his head trying to understand basic app UI. It's a button, just press it.",
      "You look like you're constantly struggling to remember how to spell your own name.",
      "Confused face checking in. You definitely ask 'wait, what?' at the end of every sentence.",
      "Bro is tilting his head looking for a signal. Zero bars of intelligence found.",
      "You look like you just got hit with a math problem that includes letters and you completely gave up.",
      "That confused expression is the hallmark of a mf who never does the reading before class.",
      "Bro's head tilt is giving 'I am completely helpless and need an adult to function'.",
      "You look confused. Is it because the app correctly identified your total lack of aura?",
      "Tilting your head like you're trying to look around a corner that isn't there. Fully stupid.",
      "Bro is bewildered. The lights are flickering on and off in that empty skull of yours.",
      "You look like you just watched a TikTok that actually required an attention span longer than 3 seconds.",
      "Confused face like you walked into a room and instantly forgot why. Dementia at 20.",
      "Bro is tilting his head trying to align his two brain cells so they can make a spark.",
      "You look intensely confused, like a Victorian child seeing an iPhone for the first time.",
      "That baffled expression tells me you definitely rely on autocorrect for basic words.",
      "Bro's head is tilted like he thinks changing the angle will make him understand the joke. It won't.",
      "You look completely lost. Someone come pick up their child.",
      "Confused look. You definitely stare at the microwave while it runs.",
      "Bro is tilting his head like he's trying to listen to the ocean in a conch shell, but he's just deaf to logic.",
      "You look like you just encountered a pull door that says push and you're currently short-circuiting.",
      "That confused face is exactly why you're always chosen last for trivia night.",
      "Bro is baffled by his own existence. Don't worry, we are too.",
      "You're tilting your head like a guy who just got rejected and thinks she's 'playing hard to get'.",
      "Confused expression heavily implies you struggle with basic shapes and colors.",
      "Bro looks like he's trying to understand a meme but lacks over 10 years of internet context.",
      "You look like you're trying to read a completely blank piece of paper.",
      "That head tilt is the universal sign for 'my brain has encountered a fatal error'.",
      "Bro is confused like someone who orders a black coffee and is shocked when it's bitter.",
      "You look bewildered by literally everything. It must be exhausting being this dumb.",
      "Tilting your head like you're trying to shift the single brain cell to the other side.",
      "Bro is giving the 'wait, isn't Alaska an island?' confused face. Painful.",
      "You look like a guy trying to decipher Ikea instructions and completely failing.",
      "That confused expression is permanently etched into your face. Just L after L.",
      "Bro is tilting his head like a heavily medicated patient trying to focus on a shiny object.",
      "You look so lost you probably need a map just to navigate your own bedroom.",
      "Confused? Yeah, the algorithm does that to people who have absolutely zero self-awareness."
    ],
  };

  // ──────────────────────────────────────────────────────────
  // TIER-BASED ROASTS (fallback)
  // ──────────────────────────────────────────────────────────

  static const _stableRoasts = [
    "You have the chill of a trust fund baby whose dad just bought them a Tesla.",
    "Literally unbothered. Are you high or just dead inside? Oh wait, it's both.",
    "Your cortisol is so low I'm honestly checking for a pulse. Bro is medically boring.",
    "Not a single thought going on up there. Ignorance is bliss ig.",
    "Completely zen. Must be nice having zero ambition or responsibilities.",
    "You're giving 'I let my parents pay my rent' energy. And you do.",
  ];

  static const _elevatedRoasts = [
    "Slightly stressed. You just remembered you have left somebody on read for 2 weeks.",
    "Your stress is starting to act up. Go hit the vape and pretend everything is fine like you usually do.",
    "Mid-tier stress. Just enough to be annoying, not enough to actually be interesting.",
    "You're one minor inconvenience away from starting an OnlyFans.",
    "Cortisol is rising faster than your body count.",
    "You have 'I swear I'll start doing my work in 5 minutes' energy right now.",
  ];

  static const _highRoasts = [
    "You're literally tweaking. Your body is running entirely on iced coffee and unresolved trauma.",
    "Bro is COOKED. You're probably sweating through your shirt right now just reading this.",
    "High cortisol. The 'it is what it is' mindset is officially failing you.",
    "You're stressed as fuck because you're realizing you peaked in high school.",
    "Your fight-or-flight response is broken. You're just taking the hits at this point.",
    "This is the face of a mf who has a negative bank balance and 4 Klarna payments due.",
  ];

  static const _criticalRoasts = [
    "ABSOLUTELY GEEKED. Your nervous system is screaming 'SKIBIDI TOILET' on repeat.",
    "Your cortisol is higher than your screen time, and you spend 9 hours a day on TikTok.",
    "You look like you're about to crash out in public. Someone call security.",
    "Critical levels of brainrot. You're physically shaking. Get your shit together.",
    "Your DNA is begging you to jump off a bridge.",
    "At this point you're not even a person, you're just a vessel for pure localized anxiety.",
  ];

  static const _catastrophicRoasts = [
    "CRASH OUT IMMINENT. You are straight up vibrating with bad vibes. Stay away from normal people.",
    "Your cortisol just broke the scanner scale. If I was you I'd literally spontaneously combust.",
    "You are a Geneva Convention violation. Even the algorithm wants a restraining order.",
    "Completely unhinged. You need to be institutionalized before you hurt yourself or others.",
    "The camera saw your face and the ML model immediately requested a factory reset.",
    "This is 'my therapist needs a therapist after our session' territory. Godspeed you absolute freak.",
    "Your stress is so catastrophic you're probably gonna end up as a viral public freakout video.",
  ];

  // ──────────────────────────────────────────────────────────
  // DEMOGRAPHIC-SPECIFIC ROASTS
  // ──────────────────────────────────────────────────────────

  /// Get a roast personalized to the user's detected demographic.
  /// Returns null if no demographic-specific roast is available.
  static String? getDemographicRoast(DemographicCategory? category) {
    if (category == null) return null;
    final roasts = DemographicRoasts.roasts[category];
    if (roasts == null || roasts.isEmpty) return null;
    return roasts[_random.nextInt(roasts.length)];
  }
}
