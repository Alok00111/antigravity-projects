/// Core constants for the Block Stack 2048 game.
/// Centralizes all magic numbers for easy tuning.
library;

/// Grid dimensions
const int kGridRows = 7;
const int kGridColumns = 5;

/// Cell sizing
const double kCellSize = 60.0;
const double kCellPadding = 4.0;
const double kCellBorderRadius = 12.0;

/// Grid sizing (calculated)
const double kGridWidth = kGridColumns * (kCellSize + kCellPadding) + kCellPadding;
const double kGridHeight = kGridRows * (kCellSize + kCellPadding) + kCellPadding;

/// Spawn area
const double kSpawnAreaHeight = 100.0;
const double kSpawnBlockY = kGridHeight + kSpawnAreaHeight / 2;

/// Animation durations (in milliseconds)
const int kShootDurationMs = 450;  // Increased for smoother travel
const int kSnapDurationMs = 120;
const int kMergePopDurationMs = 280;  // Increased for more noticeable pop
const int kSpawnPulseDurationMs = 200;
const int kScoreAnimationDurationMs = 300;
const int kGravityDurationMs = 200;  // For blocks falling after merge

/// Merge animation parameters
const double kMergeScaleMax = 1.25;  // Scale up to 125% during merge
const double kMergeScaleMin = 0.9;   // Slight shrink before pop

/// Physics
const double kDragSensitivity = 1.0;

/// Text styling
const double kBlockFontSizeSmall = 20.0;  // For 4+ digit numbers
const double kBlockFontSizeMedium = 24.0; // For 3 digit numbers
const double kBlockFontSizeLarge = 28.0;  // For 1-2 digit numbers

/// Game limits
const int kMaxBlockValue = 131072; // 2^17
