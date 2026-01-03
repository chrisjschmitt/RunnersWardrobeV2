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

#### Recommendation: **Option A (Add to End)** initially, with Option C as future enhancement
- Start simple: always add custom items to the end
- Future: Allow reordering/positioning in settings
- Rationale: Users can find their custom items if they know they added them; can iterate based on feedback

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

