# The Design System: Heritage Chic & The Digital Vault

## 1. Overview & Creative North Star
This design system is built upon the North Star of **"The Digital Curator."** Unlike standard utility apps that feel cold or transactional, this system treats every interaction as an act of preservation. We move away from the "template" look by embracing **Intentional Asymmetry** and **Tonal Depth**. 

The layout should feel like a high-end editorial spread or a modern museum exhibition—where white space (or "dark space") is a luxury, and content is elevated through sophisticated layering rather than rigid grids. We avoid "boxed-in" designs, opting instead for overlapping elements and high-contrast typography scales that guide the eye with authoritative grace.

---

## 2. Color Theory: "The No-Line Rule"
The palette is rooted in organic, earth-toned permanence. To maintain a premium, seamless feel, we implement the following mandates:

*   **The "No-Line" Rule:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a sophisticated edge without the visual noise of a stroke.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers of fine paper or polished stone. Use the `surface-container` tiers (Lowest to Highest) to create "nested" depth. An inner card should use a slightly higher tier than its parent container to signify importance.
*   **The "Glass & Gradient" Rule:** Floating elements (modals, navigation bars) should utilize **Glassmorphism**. Use semi-transparent versions of `surface` colors with a `24px` backdrop-blur to allow the rich browns and oranges to bleed through, softening the interface.
*   **Signature Textures:** For primary CTAs and hero backgrounds, use a subtle linear gradient (135°) from `primary` (#ffb59a) to `primary_container` (#ff6b2c). This adds "soul" and a sense of illuminated history that flat colors cannot replicate.

---

## 3. Typography: The Storied Voice
The typography system balances the precision of modern UI with the character of a printed archive.

*   **Display & Headlines (Epilogue):** This is our "Storied" face. Use `display-lg` to `headline-sm` for editorial moments. The slightly wider stance of Epilogue feels authoritative yet human. 
*   **Body & Labels (Manrope):** Our "Utility" face. Manrope is used for all functional text, ensuring high legibility across all age ranges.
*   **The Hierarchy Goal:** Use extreme scale contrast. A `display-md` header paired with a `body-md` description creates an "Editorial" look that feels curated, not just "inputted."

---

## 4. Elevation & Depth: Tonal Layering
In this design system, shadows are a last resort; **Tonal Layering** is the standard.

*   **The Layering Principle:** Stack `surface-container-lowest` cards on `surface-container-low` sections to create a natural, soft lift.
*   **Ambient Shadows:** If an element must float (e.g., a FAB or a floating menu), use a "Sunken Shadow."
    *   *Blur:* 40px - 60px
    *   *Opacity:* 4% - 8%
    *   *Color:* Use a tinted version of `on_surface` (deep brown) rather than pure black to keep the light feeling natural.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline_variant` token at **15% opacity**. A 100% opaque border is considered a failure of the "Heritage Chic" aesthetic.

---

## 5. Components: Principles of the Vault

### Buttons & Actions
*   **Primary:** Uses the Signature Gradient (`primary` to `primary_container`). Corners are set to `xl` (1.5rem) to feel friendly and tactile.
*   **Secondary:** No background. Use `outline-variant` at 20% opacity with `primary` text.
*   **Tertiary:** Purely text-based using `label-md` in `primary` color, used for low-emphasis actions.

### Cards & Content Blocks
*   **Card Styling:** Forbid the use of divider lines within cards. Use `3.5 (1.2rem)` vertical spacing to separate a header from a body. 
*   **Roundedness:** Use `xl` (1.5rem) for main content cards and `lg` (1rem) for nested items. This "Radii Nesting" (larger outside, smaller inside) creates visual harmony.

### Input Fields
*   **Text Inputs:** Use `surface_container_highest` for the field background. Instead of a bottom line, use a subtle background shift on focus. Labels must always use `label-md` to maintain the "Modern Museum" precision.

### Specialized Components
*   **The "Artifact Card":** A specialized card for cultural items. It uses a `surface_container_low` background with an asymmetrical image placement (e.g., the image breaking the top boundary of the card) to create a high-end, non-standard layout.
*   **The "Time-Line" Indicator:** A vertical progress element using `primary` orange, but instead of a line, use a series of staggered `surface_variant` shapes that glow when active.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 24px on the left, 40px on the right) for header sections to create an editorial feel.
*   **Do** embrace "Long-Scroll" storytelling, using large `20 (7rem)` spacing blocks between major sections to let the content breathe.
*   **Do** use the `primary_container` (#FF6B2C) for meaningful interaction—it is the "heartbeat" of the app.

### Don’t:
*   **Don’t** use pure black (#000000) or pure white (#FFFFFF). Only use the tokens provided (`surface` and `on_background`) to maintain the "warmth" of the heritage brand.
*   **Don’t** use standard "Drop Shadows" (0, 4, 10, 0). They feel cheap. Use the "Ambient Shadow" rule.
*   **Don’t** use dividers or lines to separate list items. Use the `surface-container` shifts or vertical white space from the Spacing Scale.