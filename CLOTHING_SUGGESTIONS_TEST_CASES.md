# Clothing Suggestions Test Cases

This document outlines test cases for the clothing suggestions feature that appears when confidence is medium or low.

## Test Case Categories

### 1. Confidence Level Filtering

**TC-1.1: High Confidence (No Suggestions)**
- **Input**: Confidence = 75%, matchingRuns = 5
- **Expected**: `null` (no suggestions generated)
- **Reason**: Suggestions only appear for confidence < 70%

**TC-1.2: Medium Confidence (Suggestions Generated)**
- **Input**: Confidence = 55%, matchingRuns = 3
- **Expected**: Suggestions object with confidence = 55
- **Language**: Uses "Consider" (softer language)

**TC-1.3: Low Confidence (Suggestions Generated)**
- **Input**: Confidence = 35%, matchingRuns = 2
- **Expected**: Suggestions object with confidence = 35
- **Language**: Uses "Add", "Use", "Wear", "Remove" (strong language)

---

### 2. T_comfort-based Suggestions - Needs Warmer

**TC-2.1: Current Colder Than Historical (Fahrenheit)**
- **Setup**:
  - Current T_comfort: -15°C
  - Historical T_comfort: -10°C
  - Difference: -5°C = -9°F
  - Current clothing: T-shirt, Shorts, No mid-layer
  - Confidence: 45% (medium)
- **Expected Suggestions**:
  - Mid-layer: "Current conditions are 9°F colder than your historical sessions. Consider adding a layer."
  - Tops: "Current conditions are 9°F colder. Consider a warmer top."
- **Temperature Unit**: Fahrenheit

**TC-2.2: Current Colder Than Historical (Celsius)**
- **Setup**: Same as TC-2.1 but temperatureUnit = 'celsius'
- **Expected**: All temperature differences shown in °C (e.g., "5.0°C colder")

**TC-2.3: Low Confidence - Strong Language for Warmer**
- **Setup**: Same as TC-2.1 but confidence = 35%
- **Expected Language**:
  - "Add a layer for warmth" (not "Consider adding")
  - "Use a warmer top" (not "Consider a warmer top")
  - "Wear this to protect extremities" (not "Recommended for warmth")

**TC-2.4: Medium Confidence - Softer Language for Warmer**
- **Setup**: Same as TC-2.1 but confidence = 55%
- **Expected Language**:
  - "Consider adding a layer"
  - "Consider a warmer top"
  - "Recommended for warmth"

**TC-2.5: Significant Difference (≥5°C / ≥9°F)**
- **Setup**: Difference = -6°C = -10.8°F
- **Expected**: Stronger language even for medium confidence
- **Example**: "Add a layer for warmth" (not "Consider")

---

### 3. T_comfort-based Suggestions - Needs Cooler

**TC-3.1: Current Warmer Than Historical (Fahrenheit)**
- **Setup**:
  - Current T_comfort: 10°C
  - Historical T_comfort: 5°C
  - Difference: +5°C = +9°F
  - Current clothing: Base layer + jacket, Fleece mid-layer, Jacket outer-layer
  - Confidence: 45%
- **Expected Suggestions**:
  - Mid-layer: "Current conditions are 9°F warmer than your historical sessions. Consider removing this layer."
  - Tops: "Current conditions are 9°F warmer. Consider a lighter top."

**TC-3.2: Current Warmer Than Historical (Celsius)**
- **Setup**: Same as TC-3.1 but temperatureUnit = 'celsius'
- **Expected**: All temperature differences shown in °C

**TC-3.3: Low Confidence - Strong Language for Cooler**
- **Setup**: Same as TC-3.1 but confidence = 35%
- **Expected Language**:
  - "Remove this layer" (not "Consider removing")
  - "Use a lighter top" (not "Consider a lighter top")

---

### 4. Explanation Text

**TC-4.1: Low Confidence with T_comfort Difference**
- **Setup**: Confidence = 35%, difference = -5°C, temperatureUnit = 'fahrenheit'
- **Expected Explanation**: 
  - "Low confidence (35%) from 2 sessions. Current conditions are 9°F colder than your historical sessions. Add layers for warmth."
- **Key**: Uses "Add layers" (strong) not "Consider adding layers"

**TC-4.2: Medium Confidence with T_comfort Difference**
- **Setup**: Confidence = 55%, difference = -5°C, temperatureUnit = 'fahrenheit'
- **Expected Explanation**:
  - "Medium confidence (55%) from 2 sessions. Current conditions are 9°F colder than your historical sessions. Consider adding layers."
- **Key**: Uses "Consider adding layers" (softer)

**TC-4.3: Temperature Unit Formatting (Celsius)**
- **Setup**: Difference = -5°C, temperatureUnit = 'celsius'
- **Expected**: "5.0°C colder" (with decimal)
- **Not**: "9°F colder"

**TC-4.4: Temperature Unit Formatting (Fahrenheit)**
- **Setup**: Difference = -5°C, temperatureUnit = 'fahrenheit'
- **Expected**: "9°F colder" (rounded to whole number)
- **Not**: "5.0°C colder"

**TC-4.5: No Historical Data**
- **Setup**: matchingRuns = 0, similarConditions = []
- **Expected Explanation**: "No similar sessions found. These suggestions are based on typical recommendations for these conditions."

**TC-4.6: Single Historical Session**
- **Setup**: matchingRuns = 1
- **Expected Explanation**: "Based on only 1 similar session."

---

### 5. Edge Cases

**TC-5.1: Temperature Difference Too Small**
- **Setup**: Difference = -1.5°C (< 2°C threshold)
- **Expected**: No T_comfort-based suggestions (may have fallback suggestions comparing to defaults)

**TC-5.2: Multiple Historical Sessions (Average Calculation)**
- **Setup**: 
  - Historical T_comforts: -10°C, -12°C, -8°C
  - Average: -10°C
  - Current: -15°C
  - Difference: -5°C
- **Expected**: Suggestions based on average historical T_comfort

**TC-5.3: Undefined Confidence**
- **Setup**: confidence = undefined
- **Expected**: Suggestions still generated (uses fallback logic, no confidence-based language)

**TC-5.4: Exact Match (No Suggestions)**
- **Setup**: Current clothing exactly matches fallback defaults, no T_comfort difference
- **Expected**: Empty suggestions array or minimal suggestions

---

### 6. Clothing Category-Specific Suggestions

**TC-6.1: Gloves/Head Cover for Cold Conditions**
- **Setup**: 
  - Current T_comfort: -15°C
  - Historical: -10°C
  - Current: gloves = 'None', headCover = 'None'
  - Confidence: 35%
- **Expected**: 
  - Suggestion for gloves or headCover
  - Reason: "Wear this to protect extremities" (low confidence) or "Recommended for warmth" (medium)

**TC-6.2: Long Bottoms When Shorts Too Light**
- **Setup**:
  - Current: bottoms = 'Shorts'
  - Suggested: bottoms = 'Tights' or 'Pants'
  - Current T_comfort: -15°C
  - Historical: -10°C
- **Expected**:
  - Suggestion: "Wear long bottoms" (low confidence) or "Long bottoms recommended" (medium)
  - Reason includes temperature difference

**TC-6.3: Warmer Tops When T-shirt Too Light**
- **Setup**:
  - Current: tops = 'T-shirt'
  - Suggested: tops = 'Base layer' or 'Base layer + jacket'
  - Current T_comfort: -15°C
  - Historical: -10°C
- **Expected**:
  - Suggestion: "Use a warmer top" (low confidence) or "Consider a warmer top" (medium)
  - Reason includes temperature difference

---

## Test Data Examples

### Example 1: Low Confidence, Needs Warmer (Fahrenheit)
```javascript
{
  currentClothing: {
    tops: 'T-shirt',
    bottoms: 'Shorts',
    shoes: 'Running shoes',
    midLayer: 'None',
    outerLayer: 'None',
    gloves: 'None'
  },
  weather: { temperature: -5.8°F, feelsLike: -5.8°F }, // Results in -15°C T_comfort
  activity: 'running',
  confidence: 35,
  matchingRuns: 2,
  similarConditions: [
    { /* RunRecord with -10°C T_comfort */ }
  ],
  temperatureUnit: 'fahrenheit'
}
```

**Expected Output**:
```javascript
{
  suggestions: [
    {
      category: 'midLayer',
      categoryLabel: 'Mid Layer',
      current: 'None',
      suggested: 'Fleece',
      reason: 'Current conditions are 9°F colder than your historical sessions. Add a layer for warmth.'
    },
    {
      category: 'tops',
      categoryLabel: 'Top',
      current: 'T-shirt',
      suggested: 'Base layer',
      reason: 'Current conditions are 9°F colder. Use a warmer top.'
    }
  ],
  explanation: 'Low confidence (35%) from 2 sessions. Current conditions are 9°F colder than your historical sessions. Add layers for warmth.',
  confidence: 35,
  matchingRuns: 2
}
```

### Example 2: Medium Confidence, Needs Cooler (Celsius)
```javascript
{
  currentClothing: {
    tops: 'Base layer + jacket',
    bottoms: 'Tights',
    shoes: 'Running shoes',
    midLayer: 'Fleece',
    outerLayer: 'Jacket'
  },
  weather: { temperature: 50°F, feelsLike: 50°F }, // Results in 10°C T_comfort
  activity: 'running',
  confidence: 55,
  matchingRuns: 3,
  similarConditions: [
    { /* RunRecord with 5°C T_comfort */ }
  ],
  temperatureUnit: 'celsius'
}
```

**Expected Output**:
```javascript
{
  suggestions: [
    {
      category: 'midLayer',
      categoryLabel: 'Mid Layer',
      current: 'Fleece',
      suggested: 'None',
      reason: 'Current conditions are 5.0°C warmer than your historical sessions. Consider removing this layer.'
    }
  ],
  explanation: 'Medium confidence (55%) from 3 sessions. Current conditions are 5.0°C warmer than your historical sessions. Consider removing layers.',
  confidence: 55,
  matchingRuns: 3
}
```

---

## Language Strength Matrix

| Confidence | Temperature Difference | Language Style | Examples |
|------------|----------------------|----------------|----------|
| < 40% (Low) | Any | Strong/Imperative | "Add", "Use", "Wear", "Remove" |
| 40-69% (Medium) | < 5°C / < 9°F | Softer/Suggestive | "Consider", "Recommended" |
| 40-69% (Medium) | ≥ 5°C / ≥ 9°F | Stronger | "Add", "Upgrade" |
| ≥ 70% (High) | N/A | N/A | No suggestions generated |

---

## Notes

1. **Temperature Threshold**: Suggestions only trigger when T_comfort difference ≥ 2°C (≈3.6°F)
2. **Unit Conversion**: 
   - Celsius: Shows 1 decimal place (e.g., "5.0°C")
   - Fahrenheit: Shows whole numbers (e.g., "9°F")
3. **Fallback Logic**: If no historical data or T_comfort difference too small, suggestions compare current clothing to activity defaults
4. **Confidence Impact**: Low confidence always uses strong language, regardless of temperature difference magnitude

