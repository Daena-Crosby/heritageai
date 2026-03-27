# Design System Specification

## 1. Overview & Creative North Star: "The Curated Sunlight"

This design system is built to evoke the atmosphere of a high-end, modern gallery at golden hour. We are moving away from the cold, sterile "SaaS blue" aesthetic in favor of a warm, editorial experience that feels both historic and cutting-edge.

**The Creative North Star** for this system is **"The Curated Sunlight."**

This means every interface should feel like an intentional composition. We break the "template" look by utilizing intentional asymmetry, generous white space (treated as "breathable light"), and a sophisticated layering of warm tones. We do not use rigid lines to separate ideas; we use light, shadow, and tonal shifts to guide the eye, creating a digital environment that feels physical, tactile, and premium.

---

## 2. Colors: Tonal Depth & Warmth

The palette is rooted in Earthy Terracotta and Burnt Orange, supported by a foundation of warm creams. We avoid pure white (`#FFFFFF`) in the main UI to prevent eye strain and maintain the "gallery" warmth.

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders are prohibited for sectioning.** Boundaries between content blocks must be defined solely through background color shifts. For example, a content area using `surface-container-low` (`#f9f3eb`) sitting on a `surface` (`#fff8f1`) background. This creates a soft, organic transition rather than a digital "box."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine heavy-weight paper.
* **Base:** `surface` (`#fff8f1`) is your gallery floor.
* **Secondary Sections:** Use `surface-container` (`#f4ede5`) for large content blocks.
* **Interactive Elements:** Use `surface-container-highest` (`#e8e1da`) to pull critical information forward.
* **Deep Nesting:** If a card lives inside a container, the card should be `surface-container-lowest` (`#ffffff`) to create a "pop" of brightness that draws the user's attention.

### The "Glass & Gradient" Rule
For floating elements (modals, dropdowns, navigation bars), use **Glassmorphism**. Apply `surface` with 80% opacity and a `backdrop-blur` of 20px. This allows the sunlit colors of the background to bleed through.
* **Signature Gradients:** For main CTAs and Hero backgrounds, use a subtle linear gradient from `primary` (`#a83900`) to `primary-container` (`#ff6b2c`). This adds "soul" and depth that static flat colors lack.

---

## 3. Typography: The Editorial Voice

Our typography is a conversation between the bold, character-rich **Epilogue** and the functional, modern **Manrope**.

* **Display & Headlines (Epilogue):** These are our "Gallery Placards." Use `display-lg` through `headline-sm` to create an authoritative, sophisticated hierarchy. Epilogue’s bold weights should be used to anchor the page, often with tighter letter-spacing (-0.02em) for a more "custom" look.
* **Body & Titles (Manrope):** This is our "Curatorial Text." Manrope provides exceptional readability across all ages. Use `body-lg` for primary reading and `label-md` for metadata.
* **Intentional Contrast:** Always pair a large Epilogue headline with a significantly smaller Manrope sub-headline to create a high-fashion, editorial contrast.

---

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through "Tonal Layering" rather than traditional heavy shadows or structural lines.

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. Placing a `surface-container-lowest` element on top of a `surface-container-low` background creates a natural lift. This mimics the way light hits different planes in a physical space.

### Ambient Shadows
When a "floating" effect is necessary (e.g., a primary action card), use **Ambient Shadows**:
* **Blur:** Large (30px–60px).
* **Opacity:** Extremely low (4%–8%).
* **Color:** Do not use black. Use a tinted version of `on-surface` (`#1e1b17`). This mimics natural light bouncing off the warm surfaces.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use a **Ghost Border**. Use the `outline-variant` (`#e2bfb3`) at 20% opacity. This provides a "suggestion" of a boundary without breaking the soft aesthetic.

---

## 5. Components

### Buttons: The Tactile Touchpoints
* **Primary:** A gradient of `primary` to `primary-container`. Text is `on-primary` (`#ffffff`). Use `DEFAULT` roundness (0.5rem).
* **Secondary:** `secondary-container` (`#eeddc9`) background with `on-secondary-container` (`#6d6151`) text. No border.
* **Tertiary:** Ghost style. No background, `primary` text. Use for less critical actions.

### Cards & Lists: Organic Grouping
* **Forbid Dividers:** Do not use horizontal lines to separate list items. Use the **Spacing Scale** (e.g., `spacing-4` or `1.4rem`) to create "visual air" or alternate background shades between `surface` and `surface-container-low`.
* **Cards:** Use `surface-container-low` with a `DEFAULT` (0.5rem) corner radius.

### Input Fields: Soft Clarity
* **Surface:** Use `surface-container-lowest` (`#ffffff`) to make inputs feel clean and ready for interaction.
* **State:** On focus, use a 2px "Ghost Border" of `primary` at 40% opacity. This maintains warmth while signaling activity.

### Chips: The Gallery Tags
* Use `secondary-fixed-dim` (`#d4c4b1`) for a muted, stone-like feel. Text should be `on-secondary-fixed` (`#231a0e`).

---

## 6. Do’s and Don’ts

### Do:
* **Embrace Asymmetry:** Offset images and text blocks to create a custom, "designed" feel.
* **Prioritize Breathing Room:** Use the `spacing-12` and `spacing-16` tokens generously between major sections.
* **Maintain Contrast:** Ensure all text on warm backgrounds meets WCAG AA standards by using the `on-surface` and `on-background` tokens strictly.

### Don’t:
* **Don't use 100% Black:** It is too harsh for this system. Use `on-surface` (`#1e1b17`) for all "black" text.
* **Don't use hard-edged shadows:** Avoid the "drop shadow" look. If it looks like a shadow from 1995, it’s too heavy.
* **Don't use pure white borders:** Use background color shifts to define areas. If a border is needed, refer to the "Ghost Border" rule.

---

*Director's Final Note: Remember, we are not building a generic dashboard. We are building a heritage experience. Treat every screen like a page in a high-end art book.*


# The Design System: Heritage Chic & The Digital Vault

## 1. Overview & Creative North Star
This design system is built upon the North Star of **"The Digital Curator."** Unlike standard utility apps that feel cold or transactional, this system treats every interaction as an act of preservation. We move away from the "template" look by embracing **Intentional Asymmetry** and **Tonal Depth**.

The layout should feel like a high-end editorial spread or a modern museum exhibition—where white space (or "dark space") is a luxury, and content is elevated through sophisticated layering rather than rigid grids. We avoid "boxed-in" designs, opting instead for overlapping elements and high-contrast typography scales that guide the eye with authoritative grace.

---

## 2. Color Theory: "The No-Line Rule"
The palette is rooted in organic, earth-toned permanence. To maintain a premium, seamless feel, we implement the following mandates:

* **The "No-Line" Rule:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a sophisticated edge without the visual noise of a stroke.
* **Surface Hierarchy & Nesting:** Treat the UI as physical layers of fine paper or polished stone. Use the `surface-container` tiers (Lowest to Highest) to create "nested" depth. An inner card should use a slightly higher tier than its parent container to signify importance.
* **The "Glass & Gradient" Rule:** Floating elements (modals, navigation bars) should utilize **Glassmorphism**. Use semi-transparent versions of `surface` colors with a `24px` backdrop-blur to allow the rich browns and oranges to bleed through, softening the interface.
* **Signature Textures:** For primary CTAs and hero backgrounds, use a subtle linear gradient (135°) from `primary` (#ffb59a) to `primary_container` (#ff6b2c). This adds "soul" and a sense of illuminated history that flat colors cannot replicate.

---

## 3. Typography: The Storied Voice
The typography system balances the precision of modern UI with the character of a printed archive.

* **Display & Headlines (Epilogue):** This is our "Storied" face. Use `display-lg` to `headline-sm` for editorial moments. The slightly wider stance of Epilogue feels authoritative yet human.
* **Body & Labels (Manrope):** Our "Utility" face. Manrope is used for all functional text, ensuring high legibility across all age ranges.
* **The Hierarchy Goal:** Use extreme scale contrast. A `display-md` header paired with a `body-md` description creates an "Editorial" look that feels curated, not just "inputted."

---

## 4. Elevation & Depth: Tonal Layering
In this design system, shadows are a last resort; **Tonal Layering** is the standard.

* **The Layering Principle:** Stack `surface-container-lowest` cards on `surface-container-low` sections to create a natural, soft lift.
* **Ambient Shadows:** If an element must float (e.g., a FAB or a floating menu), use a "Sunken Shadow."
* *Blur:* 40px - 60px
* *Opacity:* 4% - 8%
* *Color:* Use a tinted version of `on_surface` (deep brown) rather than pure black to keep the light feeling natural.
* **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline_variant` token at **15% opacity**. A 100% opaque border is considered a failure of the "Heritage Chic" aesthetic.

---

## 5. Components: Principles of the Vault

### Buttons & Actions
* **Primary:** Uses the Signature Gradient (`primary` to `primary_container`). Corners are set to `xl` (1.5rem) to feel friendly and tactile.
* **Secondary:** No background. Use `outline-variant` at 20% opacity with `primary` text.
* **Tertiary:** Purely text-based using `label-md` in `primary` color, used for low-emphasis actions.

### Cards & Content Blocks
* **Card Styling:** Forbid the use of divider lines within cards. Use `3.5 (1.2rem)` vertical spacing to separate a header from a body.
* **Roundedness:** Use `xl` (1.5rem) for main content cards and `lg` (1rem) for nested items. This "Radii Nesting" (larger outside, smaller inside) creates visual harmony.

### Input Fields
* **Text Inputs:** Use `surface_container_highest` for the field background. Instead of a bottom line, use a subtle background shift on focus. Labels must always use `label-md` to maintain the "Modern Museum" precision.

### Specialized Components
* **The "Artifact Card":** A specialized card for cultural items. It uses a `surface_container_low` background with an asymmetrical image placement (e.g., the image breaking the top boundary of the card) to create a high-end, non-standard layout.
* **The "Time-Line" Indicator:** A vertical progress element using `primary` orange, but instead of a line, use a series of staggered `surface_variant` shapes that glow when active.

---

## 6. Do’s and Don’ts

### Do:
* **Do** use asymmetrical margins (e.g., 24px on the left, 40px on the right) for header sections to create an editorial feel.
* **Do** embrace "Long-Scroll" storytelling, using large `20 (7rem)` spacing blocks between major sections to let the content breathe.
* **Do** use the `primary_container` (#FF6B2C) for meaningful interaction—it is the "heartbeat" of the app.

### Don’t:
* **Don’t** use pure black (#000000) or pure white (#FFFFFF). Only use the tokens provided (`surface` and `on_background`) to maintain the "warmth" of the heritage brand.
* **Don’t** use standard "Drop Shadows" (0, 4, 10, 0). They feel cheap. Use the "Ambient Shadow" rule.
* **Don’t** use dividers or lines to separate list items. Use the `surface-container` shifts or vertical white space from the Spacing Scale.