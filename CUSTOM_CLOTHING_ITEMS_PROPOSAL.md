# Custom Clothing Items - Feature Proposal

## Overview
Allow users to add their own clothing items to any activity's categories, making the app more personalized and useful for users with specific gear.

## Current Implementation Status

**Note**: Custom clothing functionality already exists in the codebase!
- Database: `customClothing` table in IndexedDB (schema version 3+)
- Storage: Activity-specific keys (`${activity}:${category}`)
- Functions: `getCustomClothingOptions()`, `addCustomClothingOption()`, `deleteCustomClothingOption()`
- UI: `ClothingPicker` component has basic custom item support

**Current Behavior**:
- Custom items are added to the end of the category list
- Category is determined by which category's picker is open
- Items are activity-specific (stored with activity context)
- Custom items can be deleted via long-press/delete action

**Current Limitations**:
- Category selection happens implicitly (based on which picker is open)
- No explicit category selection UI when adding items
- Items always added to end (no positioning options)
- No validation or guidance on category selection

## Primary Concerns

### 1. Category Selection
**Problem**: User needs to determine which category their clothing belongs to.

**Solution Options**:

#### Option A: Category Dropdown (Recommended)
- Show a dropdown with all available categories for the selected activity
- Include category labels and brief descriptions:
  - "Top" - Shirts, jerseys, base layers, etc.
  - "Mid Layer" - Fleece, light puffy, etc. (for activities that have this)
  - "Outer Layer" - Jackets, shells, etc.
  - "Bottom" - Pants, shorts, tights, etc.
- **Pros**: Clear, explicit, no ambiguity
- **Cons**: Requires one extra step

#### Option B: Smart Category Detection
- Let user type clothing name, then suggest categories based on keywords
- Examples:
  - "Jacket" → suggests "Outer Layer"
  - "Fleece" → suggests "Mid Layer" or "Top"
  - "Tights" → suggests "Bottom"
- **Pros**: Faster for experienced users
- **Cons**: Ambiguous items (e.g., "Fleece" could be midLayer or top) need clarification anyway

#### Recommendation: **Option A (Category Dropdown)** with Option B as enhancement
- Primary: Category dropdown for clarity
- Enhancement: Auto-suggest category based on keywords, but require confirmation

### 2. Item Ordering/Placement

**Problem**: Where should the custom item appear in the category's option list?

**Solution Options**:

#### Option A: Add to End (Simplest)
- Always append custom items to the end of the category options
- **Pros**: Simple, predictable, no UI complexity
- **Cons**: Custom items might be "lost" in long lists, no logical grouping

#### Option B: Alphabetical Sorting
- Sort all items (default + custom) alphabetically
- **Pros**: Predictable, easy to find
- **Cons**: Breaks temperature/warmth grouping, might confuse users expecting defaults in a certain order

#### Option C: User-Specified Position
- Allow user to choose position when adding:
  - "Add at beginning"
  - "Add at end" (default)
  - "Add after: [dropdown of existing items]"
- **Pros**: Maximum flexibility
- **Cons**: More complex UI, users might not know where to place items

#### Option D: Temperature-Based Grouping (Advanced)
- Group items by warmth level, place custom item in appropriate group
- Requires user to specify warmth level (light/moderate/warm/heavy)
- **Pros**: Logical grouping, maintains temperature ordering
- **Cons**: Requires additional input, complex to implement

#### Option E: Recommendation-Based Placement (Intelligent - NEW)
- Place custom item relative to the currently recommended item for the temperature range
- When user adds custom item, check what the recommendation engine suggests for current conditions
- Place the custom item immediately after (or before) the recommended item
- **Logic**:
  - If custom item is similar warmth to recommended → place after recommended item
  - If custom item is warmer → place after warmer items in the list
  - If custom item is lighter → place before lighter items in the list
- **Pros**: 
  - Uses existing recommendation knowledge (no extra user input needed)
  - Provides context about where item fits in warmth hierarchy
  - Automatically maintains logical temperature ordering
  - Helps users understand their gear relative to defaults
- **Cons**: 
  - Requires recommendation engine to be available when adding item
  - May need to determine relative warmth (could use brand/model lookup)
  - Placement might change if user adds item in different weather conditions

**Example Flow**:
1. User is viewing recommendations for 5°C conditions
2. Recommendation engine suggests "Fleece" for midLayer
3. User adds custom item "Patagonia R1 Hoody"
4. System places "Patagonia R1 Hoody" right after "Fleece" in the list
5. Future users (or same user in similar conditions) see items in logical warmth order

**Enhanced Version**:
- If brand/model lookup is available, use warmness level to determine exact placement
- "Patagonia R1 Hoody" (moderate warmth) → place after "Fleece" (moderate warmth)
- "Arcteryx Atom LT" (warm) → place after "Heavy puffy" (warm)
- Falls back to "after recommended item" if warmness unknown

**Implementation Details**:
```typescript
async function addCustomClothingWithSmartPlacement(
  category: string,
  itemName: string,
  activity: ActivityType,
  currentWeather?: WeatherData
): Promise<void> {
  // Get recommended item for current conditions (if available)
  let recommendedItem: string | null = null;
  if (currentWeather) {
    const fallback = getFallbackRecommendation(currentWeather, [], activity);
    recommendedItem = fallback[category] || null;
  }
  
  // Get current category options
  const categories = getClothingCategories(activity);
  const categoryConfig = categories.find(c => c.key === category);
  const currentOptions = categoryConfig?.options || [];
  
  // Determine placement
  let insertIndex: number;
  if (recommendedItem) {
    const recommendedIndex = currentOptions.findIndex(
      opt => opt.toLowerCase() === recommendedItem!.toLowerCase()
    );
    if (recommendedIndex >= 0) {
      // Place after recommended item
      insertIndex = recommendedIndex + 1;
    } else {
      // Recommended item not in list, add to end
      insertIndex = currentOptions.length;
    }
  } else {
    // No recommendation available, add to end
    insertIndex = currentOptions.length;
  }
  
  // If brand/model lookup available, refine placement based on warmness
  const gearInfo = lookupGearItem(itemName);
  if (gearInfo?.warmnessLevel) {
    // Find items with similar warmness and place accordingly
    // (More sophisticated logic here)
  }
  
  // Save custom item (with position metadata if needed)
  await addCustomClothingOption(category, itemName, activity);
  
  // Note: Actual insertion into UI list would happen in ClothingPicker component
  // This function provides the intelligence for where to place it
}
```

**Considerations**:
- **Context-dependent**: Placement might vary if user adds item in different weather conditions
- **Solution**: Store placement relative to temperature range, or use warmness level (more stable)
- **User override**: Always allow user to manually reorder if placement isn't right
- **Visual feedback**: Show "Placed after [Recommended Item] based on current conditions" message

#### Recommendation: **Option E (Recommendation-Based Placement)** as primary, with Option A as fallback
- Primary: Use recommendation engine to intelligently place items
- Fallback: If recommendation unavailable, add to end
- Future: Combine with brand/model lookup for even smarter placement
- Rationale: Leverages existing recommendation knowledge, provides context, maintains logical ordering

### 3. Implementation Details

#### Data Storage
```typescript
interface AppSettings {
  // ... existing fields ...
  customClothingItems?: Record<ActivityType, CustomClothingCategory>;
}

interface CustomClothingCategory {
  [categoryKey: string]: string[]; // Array of custom item names
}

// Example:
// customClothingItems: {
//   running: {
//     tops: ['Custom Running Shirt', 'My Favorite Base Layer'],
//     shoes: ['Custom Trail Shoes']
//   },
//   hiking: {
//     midLayer: ['Patagonia R1 Hoody'],
//     outerLayer: ['Arcteryx Beta AR']
//   }
// }
```

#### UI Flow
1. **Add Button**: "Add Custom Item" button in Settings or clothing picker
2. **Modal/Dialog**:
   - Select Activity (if adding from Settings)
   - Select Category (dropdown with descriptions)
   - Enter Item Name (text input)
   - Optional: Add notes/description for personal reference
3. **Confirmation**: Show preview, confirm addition
4. **Storage**: Save to IndexedDB in AppSettings

#### Integration Points
- **ClothingPicker**: Merge custom items with default options
- **Recommendations**: Custom items participate in voting (treated like default items)
- **CSV Export/Import**: Include custom items in export, handle in import
- **Settings UI**: Show list of custom items, allow editing/removal

#### Edge Cases
- **Duplicate Names**: Warn if custom item name matches existing default item
- **Removing Defaults**: Can't remove default items, only custom ones
- **Activity-Specific**: Custom items are per-activity (running custom items don't appear for hiking)
- **Category Validation**: Ensure custom items only go in valid categories for that activity

### 4. User Experience Considerations

#### Discovery
- **Settings Page**: Dedicated section for "Custom Clothing Items"
- **Clothing Picker**: "Add Custom Item" button at bottom of picker
- **Inline Hint**: "Tap + to add your own items" in picker

#### Feedback
- Show count: "You have 3 custom items for Running"
- Highlight custom items in picker (e.g., asterisk or different styling)
- Allow bulk management: View all custom items across activities

#### Migration/Backup
- Include custom items in backup/export
- Handle gracefully if category is removed in app updates
- Version the data structure for future changes

### 5. Recommended MVP Approach

**Phase 1 (Simplest)**
1. Category dropdown (no smart detection)
2. Add to end of category list
3. Basic add/remove functionality
4. Store in AppSettings
5. Show in ClothingPicker

**Phase 2 (Enhancements)**
1. Smart category detection (suggestions)
2. Item reordering/positioning
3. Item notes/descriptions
4. Bulk import/export
5. Item usage statistics (which custom items are used most)

**Phase 3 (Advanced)**
1. Temperature/warmth grouping
2. Item sharing (export/import custom item lists)
3. Item images/photos
4. Replace default items (hide defaults, use only custom)

### 6. Alternative: Simplified Approach

If the above feels too complex, consider:

**"Favorites" Approach**:
- User can't add new items, but can "favorite" existing items
- Favorites appear at the top of each category
- Simpler implementation, less flexible

**"Custom Lists" Approach**:
- User creates named lists (e.g., "Winter Running Kit", "Summer Hiking")
- Select from list instead of individual items
- Still requires category selection, but groups items together

## 7. Brand/Model Lookup for Auto-Classification (Advanced)

### Concept
Allow users to enter brand and model information (e.g., "Patagonia R1 Hoody", "Arcteryx Beta AR", "Nike Dri-FIT Long Sleeve"), then use external databases/APIs to automatically determine:
1. **Category** (top, midLayer, outerLayer, etc.)
2. **Warmness level** (for intelligent ordering)
3. **Additional metadata** (material, features, use cases)

### Feasibility & Implementation Options

#### Option A: External APIs/Databases

**Potential Sources**:
1. **REI API** (if available) - Large outdoor gear database
2. **Backcountry API** (if available) - Outdoor gear specifications
3. **Manufacturer APIs** - Direct from Patagonia, Arcteryx, etc. (unlikely to have public APIs)
4. **Open Source Gear Databases** - Community-maintained databases
5. **Product Search APIs** - Google Shopping API, Bing Product API (limited specificity)

**Challenges**:
- Most retailers don't have public APIs for product specifications
- Would require API keys and rate limiting
- May not have detailed warmness/insulation specs
- Legal/ToS concerns with scraping

#### Option B: Local Knowledge Base (More Feasible)

**Approach**: Build a curated database of popular gear items
- Start with common items (Patagonia R1, Arcteryx Beta AR, etc.)
- Store: brand, model, category, warmness level
- Expand based on user submissions (crowdsourced)

**Implementation**:
```typescript
interface GearDatabaseEntry {
  brand: string;
  model: string;
  category: 'tops' | 'midLayer' | 'outerLayer' | 'bottoms' | 'etc';
  warmnessLevel: 'light' | 'moderate' | 'warm' | 'heavy';
  activityTypes?: ActivityType[]; // Some gear is activity-specific
  description?: string;
}

// Local JSON file or IndexedDB table
const GEAR_DATABASE: GearDatabaseEntry[] = [
  { brand: 'Patagonia', model: 'R1 Hoody', category: 'midLayer', warmnessLevel: 'moderate' },
  { brand: 'Arcteryx', model: 'Beta AR', category: 'outerLayer', warmnessLevel: 'heavy' },
  { brand: 'Nike', model: 'Dri-FIT Long Sleeve', category: 'tops', warmnessLevel: 'light' },
  // ... more entries
];
```

**User Flow**:
1. User types "Patagonia R1 Hoody"
2. System searches database (case-insensitive, partial match)
3. If found: Auto-selects category and warmness level
4. If not found: Falls back to manual category selection
5. Optional: "Not found? Help us improve" → User can submit entry

**Pros**:
- Works offline
- No API dependencies
- Fast and reliable
- Can be expanded over time
- No legal/ToS concerns

**Cons**:
- Requires manual curation (or crowdsourcing)
- Won't have every product
- Needs maintenance as new products release

#### Option C: Hybrid Approach (Recommended)

1. **Local database** for common/popular items (fast, offline)
2. **Fuzzy matching** for partial brand/model names
3. **Fallback to manual selection** if not found
4. **User submissions** to expand database (with moderation)
5. **Future enhancement**: Optional API integration for real-time lookups

**Example Implementation**:
```typescript
function lookupGearItem(input: string): GearDatabaseEntry | null {
  // Normalize input
  const normalized = input.toLowerCase().trim();
  
  // Try exact match first
  let match = GEAR_DATABASE.find(entry => 
    `${entry.brand} ${entry.model}`.toLowerCase() === normalized
  );
  
  // Try fuzzy match (contains)
  if (!match) {
    match = GEAR_DATABASE.find(entry => 
      normalized.includes(entry.brand.toLowerCase()) &&
      normalized.includes(entry.model.toLowerCase())
    );
  }
  
  // Try brand-only match (suggest options)
  if (!match) {
    const brandMatches = GEAR_DATABASE.filter(entry =>
      normalized.includes(entry.brand.toLowerCase())
    );
    if (brandMatches.length > 0) {
      // Show suggestions to user
      return { suggestions: brandMatches };
    }
  }
  
  return match || null;
}
```

### Warmness Level Classification

If we have warmness level from lookup, we can:
1. **Order items** within category by warmness (light → heavy)
2. **Group items** visually in picker (Light / Moderate / Warm / Heavy sections)
3. **Suggest placement** when user adds custom item ("This is a warm item, place after 'Fleece'?")

### Data Sources for Building Database

1. **Common gear lists** - Popular items from REI, Backcountry, etc.
2. **User submissions** - "Help improve our database" feature
3. **Manufacturer websites** - Manual curation (legal, public info)
4. **Community contributions** - If open-sourcing the database
5. **Existing gear databases** - Outdoor Gear Lab, etc. (with permission)

### Recommended Approach

**Phase 1**: Start with local database of ~100-200 popular items
- Focus on major brands (Patagonia, Arcteryx, Nike, Adidas, etc.)
- Cover common categories and warmness levels
- Ship with app (JSON file in codebase)

**Phase 2**: Add user submission system
- "Not in database? Submit this item" button
- User provides: brand, model, category, warmness
- Queue for manual review/addition

**Phase 3**: Consider API integration (if reliable sources become available)
- Keep local database as primary
- Use API as fallback/enhancement
- Cache API results locally

### UI/UX Considerations

1. **Auto-complete/suggestions** as user types
2. **Visual indicators** when item is recognized (checkmark icon)
3. **Preview** of auto-detected category/warmness before confirming
4. **Override option** - "This isn't right" → manual selection
5. **Learn from usage** - Track which items users correct

## Questions to Consider

1. **Scope**: Should custom items work in recommendations, or just be selectable?
   - Recommendation: Yes, they should participate in voting/feedback like defaults

2. **Validation**: Should we validate that custom items make sense for weather conditions?
   - Recommendation: No - trust the user (as stated in requirements)

3. **Limits**: Maximum number of custom items per category/activity?
   - Recommendation: No hard limit initially, but warn if > 20 items

4. **Naming**: Should custom items have different naming rules than defaults?
   - Recommendation: Allow any text, but warn about duplicates

5. **Mobile UX**: How to make category selection easy on mobile?
   - Recommendation: Full-screen modal with clear category cards/icons

6. **Brand/Model Lookup**: Should we implement automatic classification via lookup?
   - Recommendation: Yes, start with local database (Option C - Hybrid), expand over time

