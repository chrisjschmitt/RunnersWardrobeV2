# Long Duration Safety Recommendations

## Overview
When activities are ≥1 hour, additional safety considerations become critical. Users will take breaks, may have meals, and need to carry extra gear for changing conditions. This document outlines recommendations for enhancing safety overrides and recommendations for long-duration activities.

---

## Problem Statement

Long-duration activities (≥1 hour) present unique challenges:

1. **Break/Rest Periods**: When activity stops, body heat generation drops dramatically → rapid cooling
2. **Meal Stops**: Extended stops without movement require additional insulation
3. **Carrying Capacity**: Need space for extra layers, water, food, emergency gear
4. **Hydration**: Volume requirements increase with duration (hands-free preferred)
5. **Weather Changes**: Conditions may change significantly over extended periods
6. **Fatigue**: Reduced ability to notice early warning signs of hypothermia/overheating

---

## Current State

### Existing Safety Overrides
- Temperature thresholds for tops, bottoms, head cover, gloves
- Rain gear recommendations
- Sunglasses/headlamp logic

### Pack/Hydration Support by Activity

| Activity | Pack Category | Hydration Category | Current Options |
|----------|---------------|-------------------|-----------------|
| **Hiking** | ✅ Yes | ❌ No | None, Waist pack, Daypack (20L), Daypack (30L), Overnight pack |
| **Trail Running** | ❌ No | ✅ Yes | None, Handheld bottle, Waist belt, Hydration vest, Running pack |
| **Running** | ❌ No | ❌ No | - |
| **Walking** | ❌ No | ❌ No | - |
| **Cycling** | ❌ No | ❌ No | - |
| **Snowshoeing** | ❌ No | ❌ No | - |
| **XC Skiing** | ❌ No | ❌ No | - |

---

## Proposed Enhancements

### 1. Break/Rest Period Insulation

**Problem**: Body heat generation drops to zero during breaks → rapid cooling

**Recommendations**:
- **< 50°F**: Recommend carrying lightweight insulating layer (puffy/insulated jacket)
- **< 35°F**: Recommend heavier insulated layer (down/synthetic puffy) for breaks
- **< 20°F**: Critical - must have significant insulation for breaks

**Implementation Options**:
- Add "extra layer" recommendation as a note/comment
- Suggest warmer outer layer that can be opened/closed for active vs rest
- For activities with outer layers: recommend insulated jacket vs softshell for long activities

### 2. Stricter Temperature Thresholds

**Rationale**: Can't adjust mid-activity, need more protective clothing from the start

| Category | Current Threshold | Long Duration Threshold | Change |
|----------|------------------|------------------------|--------|
| **Shorts/short sleeves** | <25°F blocked | <30°F blocked | +5°F |
| **T-shirt → long sleeve** | <40°F | <45°F | +5°F |
| **Shorts → tights/pants** | <45°F | <50°F | +5°F |
| **Head cover required** | <40°F | <45°F | +5°F |
| **Gloves recommended** | <40°F | <45°F | +5°F |

### 3. Pack/Backpack Requirements

#### Hiking
- **Short (< 2 hours)**: Daypack (20L) may suffice
- **Long (≥ 1 hour)**: Ensure pack is NOT "None"
- **Very Long (≥ 2 hours)**: Recommend Daypack (30L) minimum for extra gear
- **Rationale**: Need space for extra layers, water, food, emergency gear

#### Trail Running
- **Short**: Handheld bottle or waist belt acceptable
- **Long (≥ 1 hour)**: Recommend "Hydration vest" or "Running pack" (hands-free + carrying capacity)
- **Rationale**: Need hands-free hydration + space for extra layers/gear

#### Other Activities
- **Running**: Consider waist belt or hydration vest (schema addition needed)
- **Cycling**: Frame bags/packs (schema addition needed)
- **Walking**: Daypack for long walks (schema addition needed)

### 4. Hydration System Requirements

#### Trail Running (has hydration category)
- **Short (< 1 hour)**: Handheld bottle acceptable
- **Long (≥ 1 hour)**: 
  - Recommend hydration vest or running pack (NOT handheld, NOT waist belt for very long)
  - Ensure hydration is NOT "None"
  - Rationale: Hands-free, more capacity, space for gear

#### Other Activities (no hydration category)
- **Consideration**: May need schema additions or recommendation notes
- **Running**: Suggest waist belt or hydration system
- **Hiking**: Water bottles in pack (implied by pack recommendation)

### 5. Enhanced Protective Gear Recommendations

For long activities, favor:

- **Gloves**: 
  - Upgrade earlier: Recommend at <45°F (instead of <40°F)
  - Prefer heavier options: At <35°F, suggest heavy gloves/mittens vs light gloves

- **Footwear**:
  - Waterproof footwear at <40°F (instead of <32°F) if any precipitation risk
  - Better insulation for cold conditions

- **Layering Systems**:
  - Prioritize base + mid + outer layer combinations (flexibility to adjust)
  - Over single layers (harder to adjust mid-activity)

- **Wind Protection**:
  - Recommend windproof layers at lower wind speeds (>15 mph instead of >20 mph)
  - Wind chill more dangerous over extended exposure

- **Extremity Protection**:
  - Wool/thicker socks at <45°F (instead of <40°F)
  - Neck gaiter/buff at <40°F (instead of <35°F)
  - Face protection more important over long exposure

### 6. Carried Gear Checklist

For activities ≥1 hour, ensure recommendations account for:

1. **Extra insulating layer** (for breaks/rest stops)
2. **Water/hydration** (volume increases with duration)
3. **Food/snacks** (energy needs for long activities)
4. **Emergency/weather gear** (extra layer, gloves, hat, emergency blanket)
5. **Weather changes** (lightweight rain shell if forecast uncertain)

---

## Activity-Specific Recommendations

### Hiking (Long Duration)
- ✅ Ensure pack is Daypack (30L) or larger (NOT 20L, NOT None)
- ✅ Warmer outer layer than short hike (insulated jacket vs softshell)
- ✅ Extra base layer to carry for breaks
- ✅ Consider larger pack size for very long hikes (30L+)

### Trail Running (Long Duration)
- ✅ Hydration vest or Running pack (NOT handheld, NOT waist belt for very long)
- ✅ Ensure hydration is NOT "None"
- ✅ Pack capacity consideration for extra gear

### Running (Long Duration)
- ⚠️ Schema addition needed: Consider hydration/waist belt options
- ✅ Extra lightweight layer to carry
- ✅ Suggest carrying capacity for water, extra layer

### Cycling (Long Duration)
- ⚠️ Schema addition needed: Consider frame bags/packs
- ✅ Warmer layers than short ride
- ✅ Consider carrying capacity

### Walking (Long Duration)
- ⚠️ Schema addition needed: Consider daypack option
- ✅ Warmer outer layers
- ✅ Carrying capacity for breaks

### Snowshoeing / XC Skiing (Long Duration)
- ✅ Extra insulation critical (breaks are cold)
- ✅ Consider pack options for gear
- ✅ Warmer layers than short activities

---

## Implementation Strategy

### Phase 1: Temperature Threshold Overrides (Low Effort, High Impact)
**File**: `src/services/recommendationEngine.ts` (safety override section)

- Add `duration?: ActivityDuration` parameter to safety override logic
- Check `if (duration === 'long')` before applying overrides
- Apply 5°F warmer thresholds for long activities
- **Impact**: More protective recommendations for long activities

### Phase 2: Pack Requirements (Medium Effort, High Impact)
**Files**: `src/services/recommendationEngine.ts`

- **Hiking**: Check duration, ensure pack is NOT "None", upgrade to 30L for long
- **Trail Running**: Check duration, recommend hydration vest/pack for long
- Add safety overrides to enforce pack/hydration recommendations
- **Impact**: Ensures users have carrying capacity for essential gear

### Phase 3: Break Insulation Recommendations (Medium Effort, Medium Impact)
**Approach Options**:

**Option A: Recommendation Notes/Comments**
- Add text recommendation about carrying extra layer for breaks
- Display as informational message or in recommendations

**Option B: Schema Addition**
- Add "carried gear" or "extra layer" category to activities
- More structured but requires schema changes

**Option C: Outer Layer Upgrades**
- For activities with outer layers: recommend warmer options for long activities
- Implicit break protection (can open/close layer)

**Impact**: Better preparation for rest stops

### Phase 4: Schema Expansions (High Effort, Medium Impact)
**Files**: `src/types/index.ts`

Consider adding:
- **Running**: Hydration category (waist belt, hydration vest, handheld)
- **Cycling**: Pack/carrying category (frame bag, seat bag, handlebar bag)
- **Walking**: Pack category (daypack options)
- **All activities**: "Carried gear" or "Extra layer" category

**Impact**: More complete recommendations but requires significant schema work

---

## Recommended Priority

1. **Phase 1: Temperature Thresholds** - Highest priority
   - Simple to implement
   - High impact on safety
   - Low risk

2. **Phase 2: Pack Requirements** - High priority
   - Medium effort (already have pack/hydration categories for hiking/trail running)
   - Ensures carrying capacity
   - Critical for safety

3. **Phase 3: Break Insulation** - Medium priority
   - Can start with Option C (outer layer upgrades) - simpler
   - Option A (notes) is low effort alternative
   - Important but less critical than above

4. **Phase 4: Schema Expansions** - Lower priority
   - Significant effort
   - Nice-to-have for completeness
   - Can be done incrementally per activity

---

## Example Scenarios

### Scenario 1: Long Hike (2+ hours) at 40°F
**Current recommendations**:
- Long sleeve, tights, light gloves, daypack (20L)

**Enhanced for long duration**:
- Base layer + jacket (warmer than long sleeve)
- Tights (no change)
- Light gloves (but recommended earlier)
- Daypack (30L) - upgrade from 20L
- Extra base layer to carry for breaks
- Warmer outer layer that can be opened/closed

### Scenario 2: Long Trail Run (90 minutes) at 45°F
**Current recommendations**:
- Long sleeve, tights, handheld bottle

**Enhanced for long duration**:
- Long sleeve (okay)
- Tights (okay)
- Hydration vest or Running pack (NOT handheld)
- Extra lightweight layer to carry

### Scenario 3: Long Run (2 hours) at 35°F
**Current recommendations**:
- Long sleeve, tights, light gloves

**Enhanced for long duration**:
- Base layer + jacket (warmer)
- Tights (okay)
- Heavy gloves (upgrade from light)
- Waist belt or hydration system (schema addition needed)
- Extra insulating layer to carry for breaks

---

## Testing Considerations

- Test with all activity types (some have pack/hydration, some don't)
- Verify temperature thresholds are appropriately stricter
- Ensure pack recommendations don't conflict with activity defaults
- Test edge cases: very long activities (3+ hours), extreme temperatures
- Verify recommendations make sense for each activity type
- Ensure backwards compatibility (works when duration not provided)

---

## Related Documentation

- See `EXPERT_MODE_RECOMMENDATION_SUGGESTIONS.md` for activity level and duration tracking context
- Current safety overrides documented in `src/services/recommendationEngine.ts` (lines ~666-850)
- Activity-specific defaults in `src/data/activityDefaults.ts`
- Clothing schemas in `src/types/index.ts` (ACTIVITY_CONFIGS)

---

## Notes

- This is a planning document for future implementation
- Current version: v4.17.3 (Expert Mode with activity level/duration tracking implemented)
- Duration tracking is already in place - this document covers safety enhancements that use duration data
- Schema expansions (Phase 4) can be done incrementally, one activity at a time
- Consider user feedback and real-world usage patterns when implementing

