# Heritage AI - Design System Implementation Guide

## Overview
This document outlines the implementation of the "Heritage Chic" design system inspired by Google Stitch designs. The design philosophy is "The Curated Sunlight" - creating a warm, editorial experience that feels like a modern gallery at golden hour.

## ✅ Completed Updates

### 1. Color Palette (`frontend/src/theme/colors.ts`)
**Status:** ✅ Complete

Updated both dark and light themes to warm, earthy tones:

#### Dark Theme (Heritage Chic)
- **Background:** `#0A0603` - Deep warm brown (gallery floor)
- **Surface:** `#1A120C` - Primary surface (warm dark brown)
- **Surface Alt:** `#2A1D14` - Elevated surface
- **Orange Accent:** `#FF6B2C` - Vibrant red-orange (primary CTA color)
- **Text:** `#F5E6D3` - Warm cream
- **Text Secondary:** `#C9B499` - Muted tan
- **Text Muted:** `#8B7355` - Warm gray

#### Light Theme (Heritage Chic)
- **Background:** `#FFF8F0` - Warm off-white
- **Surface:** `#FFFFFF` - Pure white
- **Surface Alt:** `#FFF3DC` - Warm cream
- **Orange Accent:** `#FF6B2C` - Vibrant red-orange
- **Text:** `#2C1810` - Deep brown
- **Text Secondary:** `#5C4A38` - Medium brown

**New Features:**
- Added `surfaceContainerLow` and `surfaceContainerHighest` for tonal layering
- Added `warning` color for message states
- Removed cold blue tones entirely
- All colors follow warm, earthy palette

### 2. Typography System (`frontend/src/theme/fonts.ts`)
**Status:** ✅ Complete

Implemented custom font loading with Epilogue and Manrope:

#### Font Families
- **Epilogue:** Display & headlines (bold, authoritative, editorial)
  - Used for: Hero titles, section headers, page titles
  - Weights: Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)

- **Manrope:** Body text & labels (readable, functional)
  - Used for: Body content, buttons, labels, metadata
  - Weights: Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)

#### Typography Scale
```typescript
displayLarge: { fontFamily: Epilogue Bold, fontSize: 57, lineHeight: 64 }
displayMedium: { fontFamily: Epilogue Bold, fontSize: 45, lineHeight: 52 }
displaySmall: { fontFamily: Epilogue Bold, fontSize: 36, lineHeight: 44 }
headlineLarge: { fontFamily: Epilogue Bold, fontSize: 32, lineHeight: 40 }
headlineMedium: { fontFamily: Epilogue SemiBold, fontSize: 28, lineHeight: 36 }
headlineSmall: { fontFamily: Epilogue SemiBold, fontSize: 24, lineHeight: 32 }
titleLarge: { fontFamily: Manrope SemiBold, fontSize: 22, lineHeight: 28 }
titleMedium: { fontFamily: Manrope SemiBold, fontSize: 18, lineHeight: 24 }
titleSmall: { fontFamily: Manrope Medium, fontSize: 16, lineHeight: 20 }
bodyLarge: { fontFamily: Manrope Regular, fontSize: 16, lineHeight: 24 }
bodyMedium: { fontFamily: Manrope Regular, fontSize: 14, lineHeight: 20 }
bodySmall: { fontFamily: Manrope Regular, fontSize: 12, lineHeight: 16 }
labelLarge: { fontFamily: Manrope SemiBold, fontSize: 14, lineHeight: 20 }
labelMedium: { fontFamily: Manrope SemiBold, fontSize: 12, lineHeight: 16 }
labelSmall: { fontFamily: Manrope SemiBold, fontSize: 11, lineHeight: 16 }
```

**Font Loading** (App.tsx):
- Added `useFonts` hook to load custom fonts before rendering
- Shows loading screen with Heritage AI branding while fonts load
- Prevents FOUT (Flash of Unstyled Text)

### 3. Component Updates

#### Sidebar (`frontend/src/components/Sidebar.tsx`)
**Status:** ✅ Complete

**Key Changes:**
- ✅ Removed hard `borderRightWidth` - now uses tonal background shift
- ✅ Increased border radius: 10-12px for nav items, 12px for buttons
- ✅ Logo icon uses `surfaceAlt` background for tonal depth
- ✅ Navigation items use `activeNav` background color (no borders)
- ✅ Profile section uses `surfaceAlt` background instead of border
- ✅ Applied Epilogue font to logo, Manrope to navigation labels
- ✅ Increased spacing throughout (32px logo margin, 28px contribute margin)
- ✅ Mode toggle uses tonal background, no border

#### HomeScreen (`frontend/src/screens/HomeScreen.tsx`)
**Status:** ✅ Complete

**Key Changes:**
- ✅ Hero section: Removed border, uses pure surface color
- ✅ Secondary button uses `surfaceAlt` instead of border
- ✅ Story list: Alternating backgrounds (`surface` / `surfaceContainerLow`) instead of divider lines
- ✅ Analytics card: Uses `surfaceAlt` background with tonal layering
- ✅ Quote box: Uses `surfaceContainerLow` for nested depth
- ✅ Stats: Removed borders, pure surface backgrounds
- ✅ Applied Epilogue to titles, Manrope to body text and labels
- ✅ Increased border radius: 16px for hero, 14px for cards, 12px for buttons
- ✅ Generous spacing: 28px between sections, 24px padding

#### DialectsScreen (`frontend/src/screens/DialectsScreen.tsx`)
**Status:** ✅ Complete

**Key Changes:**
- ✅ Increased border radius: 12px for buttons, 14px for text areas
- ✅ Removed `fontWeight` from styles (now applied in JSX with font families)
- ✅ Dropdown uses tonal backgrounds
- ✅ Dialect note card: Increased padding and border radius
- ✅ Added fonts import for future typography updates

#### App.tsx (Main Layout)
**Status:** ✅ Complete

**Key Changes:**
- ✅ Top bar: Removed `borderBottomWidth` - uses tonal background
- ✅ Removed `fontWeight` from topBarLabel style
- ✅ Increased padding: 24px horizontal
- ✅ Splash screen uses warm brown background (`#0A0603`)
- ✅ Loading indicator uses new orange color (`#FF6B2C`)

## 📋 Remaining Implementation Tasks

### Heritage VaultScreen
**File:** `frontend/src/screens/HeritageVaultScreen.tsx`

**TODO:**
- [ ] Import `fonts` from `../theme/fonts`
- [ ] Update filter tabs: Remove border, use `activeNav` background color
- [ ] Story cards: Remove borders, use tonal layering (`surface` on alternating rows)
- [ ] Tags/chips: Use `surfaceAlt` backgrounds
- [ ] Apply Epilogue to section titles
- [ ] Apply Manrope to body text, labels, tags
- [ ] Increase border radius: 14px for cards, 12px for buttons, 8px for chips
- [ ] Increase spacing between sections

**Example Pattern:**
```typescript
// Before (hard border)
<View style={[styles.card, { borderColor: C.border }]}>

// After (tonal background)
<View style={[styles.card, { backgroundColor: C.surface }]}>

// Styles - Before
card: { borderWidth: 1, borderRadius: 10 }

// Styles - After
card: { borderRadius: 14 }
```

### Cultural Guide Screen
**File:** `frontend/src/screens/CulturalGuideScreen.tsx`

**TODO:**
- [ ] Import `fonts` from `../theme/fonts`
- [ ] Chat bubbles: Use tonal backgrounds (`surfaceAlt` for user, `surfaceContainerLow` for AI)
- [ ] Remove borders from message containers
- [ ] Input field: Use `surfaceContainerHighest` background
- [ ] Focus state: Apply ghost border (2px at 40% opacity of `orange`)
- [ ] Apply Manrope Regular to chat messages
- [ ] Apply Epilogue SemiBold to screen title
- [ ] Increase border radius: 12-14px for chat bubbles
- [ ] Increase padding in chat messages

### Recording Screen
**File:** `frontend/src/screens/RecordingScreen.tsx`

**TODO:**
- [ ] Import `fonts` from `../theme/fonts`
- [ ] Tabs: Remove bottom border, use color shifts (`orange` for active)
- [ ] Input fields: Use `surfaceContainerLow` backgrounds
- [ ] Focus state: Ghost border (2px at 40% opacity of `orange`)
- [ ] Record button: Increase size, use gradient if possible (or solid `orange`)
- [ ] Apply Epilogue Bold to tab labels
- [ ] Apply Manrope to form labels and inputs
- [ ] Increase border radius: 12px for inputs, 14px for cards
- [ ] File upload card: Remove border, use tonal background

### Auth Screen
**File:** `frontend/src/screens/AuthScreen.tsx`

**TODO:**
- [ ] Import `fonts` from `../theme/fonts`
- [ ] Form inputs: Use `surfaceContainerLow` backgrounds
- [ ] Focus state: Ghost border (2px at 40% opacity of `orange`)
- [ ] Remove hard borders from input fields
- [ ] Primary button: Use `orange` background, increase border radius to 12px
- [ ] Secondary button: Use `surfaceAlt` background (no border)
- [ ] Apply Epilogue Bold to screen title
- [ ] Apply Manrope SemiBold to button text
- [ ] Apply Manrope Regular to labels and hints
- [ ] Increase spacing between form fields

### Story View Screen
**File:** `frontend/src/screens/StoryViewScreen.tsx`

**TODO:**
- [ ] Import `fonts` from `../theme/fonts`
- [ ] Content cards: Remove borders, use tonal backgrounds
- [ ] Video player: Increase border radius to 16px
- [ ] Metadata sections: Use `surfaceAlt` backgrounds
- [ ] Tags: Use `surfaceContainerLow` backgrounds, no borders
- [ ] Apply Epilogue Bold to story title
- [ ] Apply Manrope SemiBold to section headers
- [ ] Apply Manrope Regular to body content
- [ ] Increase padding in content sections
- [ ] Back button: Use `surfaceAlt` background

### Profile Screen
**File:** `frontend/src/screens/ProfileScreen.tsx`

**TODO:**
- [ ] Import `fonts` from `../theme/fonts`
- [ ] Profile card: Remove border, use `surface` background on `bg`
- [ ] Stats cards: Use tonal layering
- [ ] Story list: Alternating backgrounds instead of dividers
- [ ] Sign out button: Use `surfaceAlt` background (not red border)
- [ ] Apply Epilogue Bold to user name
- [ ] Apply Manrope SemiBold to section headers
- [ ] Apply Manrope Regular to metadata and stats
- [ ] Increase border radius: 14-16px for cards

### Moderation & Admin Screens
**Files:**
- `frontend/src/screens/ModerationScreen.tsx`
- `frontend/src/screens/AdminScreen.tsx`

**TODO:**
- [ ] Import `fonts` from `../theme/fonts`
- [ ] Data tables: Alternating row backgrounds instead of borders
- [ ] Action buttons: Increase border radius to 10-12px
- [ ] Remove hard borders from all containers
- [ ] Apply appropriate typography hierarchy
- [ ] Use tonal backgrounds for panels
- [ ] Status badges: Use appropriate color backgrounds

## Design System Principles

### The "No-Line Rule"
**Core Principle:** 1px solid borders are prohibited for sectioning. Use background color shifts instead.

**Implementation:**
```typescript
// ❌ Wrong - Hard border
<View style={{ borderWidth: 1, borderColor: C.border }}>

// ✅ Correct - Tonal layering
<View style={{ backgroundColor: C.surface }}>  // On C.bg background
<View style={{ backgroundColor: C.surfaceAlt }}>  // On C.surface background
<View style={{ backgroundColor: C.surfaceContainerLow }}>  // Nested depth
```

### Ghost Borders (When Necessary)
For accessibility or input field focus states, use ghost borders:

```typescript
// Focus state with ghost border
<TextInput
  style={[
    styles.input,
    {
      backgroundColor: C.surfaceContainerLow,
      borderWidth: 2,
      borderColor: isFocused ? `${C.orange}66` : 'transparent', // 40% opacity
    }
  ]}
/>
```

### Surface Hierarchy (Tonal Layering)
Think of the UI as physical layers:

- **`bg`** - Gallery floor (base layer)
- **`surface`** - Primary cards/containers (on bg)
- **`surfaceAlt`** - Elevated sections (on surface)
- **`surfaceContainerLow`** - Nested elements (deeper)
- **`surfaceContainerHighest`** - Pulled forward (highest elevation)

**Example:**
```typescript
// Page background
<View style={{ backgroundColor: C.bg }}>
  {/* Card on background */}
  <View style={{ backgroundColor: C.surface, borderRadius: 14 }}>
    {/* Nested section in card */}
    <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10 }}>
      <Text>Nested content with visual depth</Text>
    </View>
  </View>
</View>
```

### Border Radius Scale
- **Large cards/panels:** 14-16px
- **Medium cards/buttons:** 10-12px
- **Small chips/tags:** 6-8px
- **Icons/avatars:** 50% (circular)

### Spacing Scale
Use generous spacing to let content "breathe":

- **Section gaps:** 24-32px
- **Card padding:** 20-24px
- **Element gaps:** 12-16px
- **Tight spacing:** 8-10px

### Typography Usage

#### Headlines & Titles
```typescript
// Page title
<Text style={{ fontFamily: fonts.epilogue.bold, fontSize: 36, lineHeight: 44, color: C.text }}>
  Heritage Vault
</Text>

// Section header
<Text style={{ fontFamily: fonts.epilogue.semibold, fontSize: 24, lineHeight: 32, color: C.text }}>
  Recent Stories
</Text>

// Card title
<Text style={{ fontFamily: fonts.manrope.semibold, fontSize: 18, lineHeight: 24, color: C.text }}>
  Story Title
</Text>
```

#### Body & Labels
```typescript
// Body text
<Text style={{ fontFamily: fonts.manrope.regular, fontSize: 14, lineHeight: 20, color: C.textSub }}>
  Story description or body content goes here.
</Text>

// Label/metadata
<Text style={{ fontFamily: fonts.manrope.semibold, fontSize: 12, lineHeight: 16, color: C.textMuted }}>
  METADATA LABEL
</Text>

// Button text
<Text style={{ fontFamily: fonts.manrope.bold, fontSize: 15, color: '#FFF' }}>
  Submit Story
</Text>
```

### Button Styles

#### Primary Button
```typescript
<TouchableOpacity
  style={{
    backgroundColor: C.orange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  }}
>
  <Text style={{ fontFamily: fonts.manrope.bold, fontSize: 15, color: '#FFF' }}>
    Primary Action
  </Text>
</TouchableOpacity>
```

#### Secondary Button
```typescript
<TouchableOpacity
  style={{
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  }}
>
  <Text style={{ fontFamily: fonts.manrope.semibold, fontSize: 15, color: C.text }}>
    Secondary Action
  </Text>
</TouchableOpacity>
```

### List/Card Alternating Backgrounds
```typescript
{items.map((item, index) => (
  <View
    key={item.id}
    style={{
      backgroundColor: index % 2 === 0 ? C.surface : C.surfaceContainerLow,
      padding: 16,
      borderRadius: 12,
    }}
  >
    <Text>{item.title}</Text>
  </View>
))}
```

## Testing Checklist

After implementing remaining screens, test:

- [ ] Dark mode → Light mode transitions are smooth
- [ ] All text is legible (meets WCAG AA contrast standards)
- [ ] No hard borders visible (only tonal shifts)
- [ ] Border radius is consistent (14-16px for cards, 10-12px for buttons)
- [ ] Custom fonts load correctly (no FOUT)
- [ ] Typography hierarchy is clear (Epilogue for headers, Manrope for body)
- [ ] Colors feel warm and cohesive (no cold blues)
- [ ] Spacing feels generous (not cramped)
- [ ] Interactive elements have appropriate hover/active states
- [ ] Focus states on inputs use ghost borders

## Migration Pattern

For each remaining screen, follow this pattern:

1. **Import fonts:**
   ```typescript
   import { fonts } from '../theme/fonts';
   ```

2. **Update JSX - Add font families to inline styles:**
   ```typescript
   // Before
   <Text style={[styles.title, { color: C.text }]}>Title</Text>

   // After
   <Text style={[styles.title, { color: C.text, fontFamily: fonts.epilogue.bold }]}>
     Title
   </Text>
   ```

3. **Update StyleSheet - Remove fontWeight, increase border radius, remove borders:**
   ```typescript
   // Before
   title: { fontSize: 20, fontWeight: 'bold' },
   card: { borderRadius: 10, borderWidth: 1, padding: 16 },

   // After
   title: { fontSize: 22 },  // fontWeight removed, added to JSX
   card: { borderRadius: 14, padding: 20 },  // border removed, larger radius
   ```

4. **Replace borders with tonal backgrounds:**
   ```typescript
   // Before
   <View style={[styles.card, { borderColor: C.border }]}>

   // After
   <View style={[styles.card, { backgroundColor: C.surface }]}>
   ```

5. **Test both themes** to ensure colors work in light and dark modes.

## Quick Reference

### Color Tokens
```typescript
C.bg                      // Page background
C.surface                 // Primary cards/containers
C.surfaceAlt              // Elevated sections
C.surfaceContainerLow     // Nested low
C.surfaceContainerHighest // Highest elevation
C.orange                  // Primary CTA (#FF6B2C)
C.orangeGlow              // Orange with low opacity
C.text                    // Primary text
C.textSub                 // Secondary text
C.textMuted               // Tertiary text
C.border                  // Ghost borders only
```

### Font Tokens
```typescript
fonts.epilogue.bold       // Display & major headlines
fonts.epilogue.semibold   // Section headers
fonts.manrope.bold        // Button labels, badges
fonts.manrope.semibold    // Card titles, prominent labels
fonts.manrope.medium      // Interactive text
fonts.manrope.regular     // Body text
```

### Size Tokens
```typescript
// Border Radius
16px  // Large cards
14px  // Medium cards
12px  // Buttons, inputs
10px  // Small elements
8px   // Chips, tags

// Spacing
32px  // Large section gaps
24px  // Medium section gaps
20px  // Card padding
16px  // Element gaps
12px  // Tight spacing
```

## Summary

The Heritage AI design system has been successfully updated to reflect the "Heritage Chic" aesthetic with warm, earthy tones, custom typography (Epilogue + Manrope), and tonal layering instead of hard borders. The core infrastructure (colors, fonts, main screens) is complete. The remaining screens need similar updates following the established patterns documented above.

**Estimated Completion:**
- Core infrastructure: ✅ 100% complete
- Main screens (Home, Sidebar, Dialects, App): ✅ 100% complete
- Remaining screens: 📋 0% complete (documented patterns above)

By following the migration patterns and design principles outlined in this document, the remaining screens can be updated consistently with the established design system.
