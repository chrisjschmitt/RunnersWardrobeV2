# Expert Mode: Activity Level & Duration Impact on Recommendations

## Overview
When Expert Mode is enabled, activity level (low/medium/high) and duration (<1h/≥1h) should influence clothing recommendations to provide more personalized suggestions.

---

## 1. Activity Level Impact on T_comfort Calculation

### Current Formula
```
T_comfort = T_actual + B(activity) + wΔ(activity) × Δ + thermal_offset
```

### Proposed Modification
Add an intensity adjustment factor (I) that modifies the base heat generation:

```
T_comfort = T_actual + B(activity) + I(intensity) + wΔ(activity) × Δ + thermal_offset
```

### Intensity Adjustment Values (in °C)
- **Low intensity**: -1.5°C (less body heat, need warmer clothes)
- **Moderate intensity**: 0°C (baseline, no adjustment)
- **High intensity**: +1.5°C (more body heat, can wear lighter clothes)

### Rationale
- Higher intensity = more metabolic heat = body stays warmer = lighter clothing needed (raises T_comfort)
- Lower intensity = less heat generation = body cools faster = warmer clothing needed (lowers T_comfort)
- This shifts T_comfort, which changes the temperature range selected, affecting clothing defaults

### Example Impact
For a 40°F run:
- **High intensity**: T_comfort shifts up by 1.5°C (2.7°F) → suggests lighter clothing
- **Low intensity**: T_comfort shifts down by 1.5°C (2.7°F) → suggests warmer clothing

---

## 2. Duration Impact on Safety & Recommendations

### Short Duration (< 1 hour)
- **Less critical**: Can tolerate slightly suboptimal clothing
- **More flexible**: Can start warmer and remove layers if needed
- **Historical matching**: Normal similarity weighting
- **Safety overrides**: Standard thresholds

### Long Duration (≥ 1 hour)
- **More critical**: Must be appropriate from the start (harder to adjust mid-activity)
- **More protective**: Favor more protective clothing options
- **Layering preference**: Suggest layering systems for flexibility
- **Safety overrides**: Stricter thresholds (dress warmer at lower temps)
- **Historical matching**: Boost weight for sessions with same duration

### Proposed Adjustments for Long Duration

#### A. Safety Override Thresholds (dress warmer earlier)
- Current: Shorts/short sleeves blocked at <25°F
- Long duration: Block at <30°F (5°F warmer threshold)
- Rationale: Can't adjust mid-activity, need to start correctly

#### B. Layering Recommendations
- For long activities: Prioritize systems that allow adjustment (base + mid + outer layers)
- For short activities: Can use simpler systems (single layers)
- Example: Long hike at 45°F → suggest base + light mid + shell (can remove layers)
- Example: Short run at 45°F → suggest long sleeve (simpler, adequate)

#### C. Similarity Matching Boost
- When matching historical sessions: 
  - Same duration: +10% similarity boost
  - Different duration: No boost
- Rationale: A 2-hour run at 40°F is different from a 30-minute run at 40°F

---

## 3. Similarity Matching Enhancements

### Current System
Matches sessions based on weather similarity (T_comfort, precipitation, UV, etc.)

### Proposed Additions

#### A. Activity Level Matching
```typescript
// In calculateFeedbackSimilarity or findSimilarRuns:
if (currentActivityLevel && feedback.activityLevel) {
  if (currentActivityLevel === feedback.activityLevel) {
    similarityBoost += 0.05; // +5% boost for same intensity
  } else if (
    (currentActivityLevel === 'high' && feedback.activityLevel === 'moderate') ||
    (currentActivityLevel === 'moderate' && feedback.activityLevel === 'high') ||
    (currentActivityLevel === 'low' && feedback.activityLevel === 'moderate') ||
    (currentActivityLevel === 'moderate' && feedback.activityLevel === 'low')
  ) {
    similarityBoost += 0.02; // +2% boost for adjacent levels
  }
  // Different (high vs low): No boost
}
```

#### B. Duration Matching
```typescript
// In calculateFeedbackSimilarity or findSimilarRuns:
if (currentDuration && feedback.duration) {
  if (currentDuration === feedback.duration) {
    similarityBoost += 0.10; // +10% boost for same duration
  }
  // Different duration: No boost (long vs short is significant difference)
}
```

### Voting System Weight Adjustment
When sessions vote for clothing items:
- Same activity level + duration: Full vote weight
- Same activity level, different duration: 0.8× vote weight
- Different activity level, same duration: 0.8× vote weight
- Different activity level + duration: 0.6× vote weight

---

## 4. Implementation Strategy

### Phase 1: T_comfort Adjustment (High Impact, Medium Effort)
**File**: `src/services/recommendationEngine.ts`
- Add `activityLevel?: ActivityLevel` parameter to `calculateComfortTemperature()`
- Add intensity adjustment values
- Apply adjustment to T_comfort calculation
- Update function signature in `getClothingRecommendation()`

**Impact**: Changes which temperature range is selected, affecting all recommendations

### Phase 2: Similarity Matching (High Impact, High Effort)
**Files**: `src/services/recommendationEngine.ts`
- Update `calculateFeedbackSimilarity()` to accept and use activityLevel/duration
- Update `findSimilarRuns()` to pass through activityLevel/duration
- Update `findRecentSimilarFeedback()` to match on activity level/duration
- Apply boosts in similarity calculations
- Adjust voting weights based on activity level/duration matches

**Impact**: Better matching of historical data, more relevant recommendations

### Phase 3: Safety Overrides for Duration (Medium Impact, Low Effort)
**File**: `src/services/recommendationEngine.ts` (safety override section)
- Check if duration === 'long'
- Apply stricter thresholds for long activities
- Block inappropriate clothing at warmer temperatures

**Impact**: More protective recommendations for long activities

### Phase 4: Layering Preferences (Low Impact, Medium Effort)
**Files**: `src/services/recommendationEngine.ts`, `src/data/activityDefaults.ts`
- For long activities, favor layering systems when multiple options exist
- For short activities, favor simpler single-layer options
- Could adjust defaults or add preference logic

**Impact**: Better layering recommendations based on duration

---

## 5. Recommended Priority

1. **T_comfort Adjustment (Activity Level)** - Highest priority
   - Simple to implement
   - High impact on recommendations
   - Directly affects clothing selection

2. **Similarity Matching (Both)** - High priority
   - More complex but very important
   - Improves relevance of historical data matching
   - Better personalization

3. **Safety Overrides (Duration)** - Medium priority
   - Simple to implement
   - Important for long activities
   - Prevents dangerous recommendations

4. **Layering Preferences (Duration)** - Lower priority
   - More nuanced impact
   - Could be handled through better defaults
   - Less critical than above

---

## 6. Example Scenarios

### Scenario 1: High Intensity, Short Duration
- **Activity**: 45-minute high-intensity interval run at 40°F
- **T_comfort adjustment**: +1.5°C (feels like 42.7°F) → may select "cool" range instead of "cold"
- **Recommendation**: Long sleeve, tights, light gloves
- **Rationale**: High intensity generates heat, short duration allows flexibility

### Scenario 2: Low Intensity, Long Duration
- **Activity**: 2-hour easy run at 40°F
- **T_comfort adjustment**: -0.5°C (feels like 39.1°F) → stays in "cold" range
- **Recommendation**: Base layer + jacket, tights, gloves (more protection)
- **Rationale**: Low intensity = less heat, long duration = need to start correctly

### Scenario 3: Moderate Intensity, Long Duration
- **Activity**: 90-minute moderate run at 50°F
- **T_comfort adjustment**: 0°C (no change) → "cool" range
- **Recommendation**: Long sleeve, tights (with layering option)
- **Rationale**: Standard intensity, but long duration favors more protection

---

## 7. Backwards Compatibility

- All changes should be **optional** (only apply when Expert Mode enabled and data provided)
- If activity level/duration not provided: Use current behavior (no changes)
- Historical data without activity level/duration: Still used, just no intensity/duration matching
- Gradually improves as users enable Expert Mode and provide data

---

## 8. Testing Considerations

- Test with all combinations: 3 intensity levels × 2 durations = 6 scenarios
- Verify T_comfort adjustments produce reasonable clothing recommendations
- Verify similarity matching boosts improve relevance
- Test edge cases: Very cold + high intensity, very warm + low intensity
- Ensure backwards compatibility (works without Expert Mode data)

