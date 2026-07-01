# Pink Background Design

## Summary

Change the full-page background of the Tetris app from near-black (`bg-gray-900`) to deep rose (`bg-pink-900`).

## Change

**File:** `src/App.jsx`

Replace `bg-gray-900` with `bg-pink-900` on the outermost `div`. All other styles, components, and game logic are unchanged.

## Why `bg-pink-900`

Deep rose stays dark enough to preserve readability of the white/gray stat text and overlays, while giving the page a clear pink hue. Lighter pinks (200–500) would require auditing text contrast across all panels.
