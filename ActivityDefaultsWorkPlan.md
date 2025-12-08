# Activity-Specific Defaults Work Plan

## Current Problem

The `getFallbackRecommendation()` function uses **generic category names** that don't match all activities:

| Generic Logic Uses | But These Activities Have Different Categories |
|--------------------|-----------------------------------------------|
| `tops` | Cycling uses `jersey`, XC Skiing uses `tops` but different options |
| `bottoms` | Cycling uses `bibs` category with bib-specific options |
| `shoes` | Snowshoeing/XC Skiing use `boots` category |
| `gloves` | All have gloves but with very different options |

**Result**: Many activities get their defaults from `getDefaultClothing()` but temperature adjustments don't apply correctly.

---

## Work Required

### Option A: Activity-Specific Fallback Functions (Recommended)
**Effort: ~2-3 hours**

Create separate temperature-based logic for each activity type:

```typescript
// Instead of one generic function:
function getFallbackRecommendation(weather, activity) {
  switch(activity) {
    case 'running': return getRunningDefaults(weather);
    case 'cycling': return getCyclingDefaults(weather);
    case 'hiking': return getHikingDefaults(weather);
    // etc.
  }
}
```

**Files to modify:**
- `src/services/recommendationEngine.ts` - Major refactor of `getFallbackRecommendation()`

**New code needed for each activity:**

#### 1. Running (Currently works OK)
- Uses generic `tops`, `bottoms`, `shoes` ✅
- Minor tweaks needed

#### 2. Trail Running (Currently works OK)
- Similar to running ✅
- Add hydration recommendations by temperature?

#### 3. Hiking (Needs work)
| Temp Range | baseLayer | midLayer | outerLayer | bottoms | footwear |
|------------|-----------|----------|------------|---------|----------|
| <25°F | Heavy merino | Heavy puffy | Insulated jacket | Insulated pants | Waterproof boots |
| 25-40°F | Merino base | Fleece | Wind jacket | Softshell pants | Hiking boots |
| 40-55°F | Long sleeve | None/Fleece | None | Hiking pants | Hiking boots |
| 55-65°F | T-shirt | None | None | Hiking pants | Hiking shoes |
| 65-75°F | T-shirt | None | None | Convertible pants | Trail runners |
| >75°F | T-shirt | None | None | Shorts | Trail runners |

#### 4. Walking (Needs work)
| Temp Range | tops | outerLayer | bottoms | shoes |
|------------|------|------------|---------|-------|
| <25°F | Fleece | Winter coat | Insulated pants | Boots |
| 25-40°F | Sweater | Down jacket | Fleece-lined leggings | Boots |
| 40-55°F | Long sleeve | Light jacket | Casual pants | Walking shoes |
| 55-65°F | T-shirt | None | Casual pants | Sneakers |
| 65-75°F | T-shirt | None | Shorts | Sneakers |
| >75°F | T-shirt | None | Shorts | Sandals |

#### 5. Cycling (NEEDS MAJOR WORK)
| Temp Range | jersey | bibs | shoes | socks | gloves | armWarmers |
|------------|--------|------|-------|-------|--------|------------|
| <25°F | Thermal jersey | Bib tights | Shoe covers | Thermal socks | Lobster gloves | Arm + leg warmers |
| 25-40°F | Jersey + jacket | Bib tights | Road shoes | Wool socks | Thermal gloves | Leg warmers |
| 40-55°F | Long sleeve jersey | 3/4 bibs | Road shoes | Cycling socks | Full finger light | Knee warmers |
| 55-65°F | Short sleeve jersey | Bib shorts | Road shoes | Cycling socks | Fingerless | None |
| 65-75°F | Short sleeve jersey | Bib shorts | Road shoes | Cycling socks | None | None |
| >75°F | Sleeveless jersey | Shorts | Road shoes | No-show | None | None |

#### 6. Snowshoeing (Already has winter defaults, but needs temp ranges)
| Temp Range | baseLayer | midLayer | outerLayer | bottoms | boots | gloves |
|------------|-----------|----------|------------|---------|-------|--------|
| <0°F | Expedition weight | Heavy puffy | Insulated jacket | Bibs | Pac boots | Liner + mittens |
| 0-15°F | Heavy merino | Heavy puffy | Hardshell | Insulated pants | Winter boots | Heavy mittens |
| 15-25°F | Merino base | Fleece | Softshell | Softshell pants | Winter boots | Insulated gloves |
| 25-35°F | Light synthetic | Light fleece | Wind jacket | Hiking pants | Winter hiking boots | Light gloves |

#### 7. XC Skiing (Highly activity-dependent)
| Temp Range | baseLayer | tops | bottoms | boots | gloves |
|------------|-----------|------|---------|-------|--------|
| <0°F | Merino base | Wind jacket + fleece | Wind pants over tights | Insulated boots | Heavy mittens |
| 0-15°F | Merino base | XC jacket | XC pants | Classic boots | Lobster mitts |
| 15-25°F | Light synthetic | XC jacket | XC pants | Classic boots | XC gloves |
| 25-35°F | Light synthetic | Soft shell | Race suit tights | Classic boots | Light gloves |

---

### Option B: Data-Driven Approach (More Scalable)
**Effort: ~4-5 hours**

Create a configuration object with defaults per activity per temperature range:

```typescript
const ACTIVITY_TEMP_DEFAULTS: Record<ActivityType, TempDefaults> = {
  cycling: {
    veryHot: { jersey: 'Sleeveless jersey', bibs: 'Shorts', ... },
    hot: { jersey: 'Short sleeve jersey', bibs: 'Bib shorts', ... },
    warm: { ... },
    mild: { ... },
    cool: { ... },
    cold: { ... },
    veryCold: { ... },
    freezing: { ... },
  },
  // ... other activities
};
```

**Pros:**
- Easier to maintain
- Could be moved to a JSON/config file
- Easy to add new activities

**Cons:**
- More upfront work
- Need to define all combinations

---

## Categories That Need Activity-Specific Logic

| Category | Activities That Need Special Handling |
|----------|--------------------------------------|
| `jersey` | Cycling only |
| `bibs` | Cycling only |
| `boots` | Snowshoeing, XC Skiing (instead of shoes) |
| `baseLayer` | Hiking, Snowshoeing, XC Skiing |
| `midLayer` | Hiking, Snowshoeing |
| `armWarmers` | Cycling only |
| `eyewear` | Cycling, XC Skiing (use photochromic logic) |
| `gaiters` | Snowshoeing only |
| `hydration` | Trail Running (maybe temperature-based?) |

---

## Accessories Logic Gaps

Currently missing activity-specific accessory defaults:

| Activity | Missing Accessory Logic |
|----------|------------------------|
| Trail Running | Hydration vest when hot/long |
| Hiking | Trekking poles (always?), pack size |
| Cycling | Lights when dark, arm/leg warmers by temp |
| Snowshoeing | Poles (always), gaiters (always) |
| XC Skiing | Neck gaiter when very cold |

---

## Recommended Implementation Order

1. **Phase 1: Fix Cycling** (highest impact - completely broken now)
   - Add cycling-specific jersey/bib temperature logic
   - Add arm/leg warmer logic by temperature

2. **Phase 2: Fix Walking** 
   - Add casual clothing temperature logic
   - Walking shoes vs boots vs sandals

3. **Phase 3: Enhance Winter Sports**
   - Snowshoeing temperature adjustments
   - XC Skiing temperature adjustments

4. **Phase 4: Enhance Others**
   - Hiking layering system
   - Trail running hydration

---

## Estimated Total Effort

| Phase | Activities | Effort |
|-------|-----------|--------|
| Phase 1 | Cycling | 1 hour |
| Phase 2 | Walking | 30 min |
| Phase 3 | Snowshoeing, XC Skiing | 1 hour |
| Phase 4 | Hiking, Trail Running | 1 hour |
| Testing | All activities at all temps | 1 hour |
| **Total** | | **4-5 hours** |

---

## Decision Needed

**Which approach do you prefer?**

- **Option A**: Activity-specific functions (simpler, faster to implement)
- **Option B**: Data-driven configuration (more maintainable long-term)

Both will achieve the same result - sensible defaults for every activity at every temperature.

