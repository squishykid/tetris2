# Tetris Game — Design Spec
Date: 2026-06-29

## Overview

A complete, playable Tetris game built as a React component, scaffolded with Vite + React + Tailwind CSS. Single-page app, no backend, no persistence. Intended as a self-contained runnable demo.

---

## Project Structure

```
tetris2/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css              # Tailwind directives
    ├── constants.js           # Board dims, colors, piece defs, scoring table
    ├── tetrominoes.js         # Shape matrices + rotation states for all 7 pieces
    ├── gameReducer.js         # Pure reducer: all state transitions
    ├── hooks/
    │   ├── useGameLoop.js     # setInterval gravity tick
    │   └── useInput.js        # keydown handler → dispatch
    └── components/
        ├── Tetris.jsx         # Root: wires reducer + hooks, renders layout
        ├── Board.jsx          # 10×20 grid + active piece + ghost piece overlay
        ├── NextPiece.jsx      # 4×4 preview grid
        └── Sidebar.jsx        # Score / level / lines / controls legend
```

---

## Architecture

**Pattern:** `useReducer` monolith. All game state lives in a single reducer with pure state transition functions. No side effects inside the reducer. Two thin hooks (`useGameLoop`, `useInput`) connect the outside world (timers, keyboard) to the reducer via `dispatch`.

**Why this pattern:** Tetris logic is deeply intertwined — gravity triggers line clears which update score which updates level which updates gravity speed. Splitting this across custom hooks introduces awkward cross-hook dependencies. A single reducer makes every transition explicit and testable.

---

## State Shape

```js
{
  board: number[][],        // 10×20, 0=empty, 1-7=locked piece color index
  activePiece: {
    type: string,           // 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
    rotation: number,       // 0-3
    x: number,              // column of bounding-box top-left
    y: number,              // row of bounding-box top-left
  },
  ghostY: number,           // precomputed drop row for active piece
  bag: string[],            // remaining pieces in current 7-bag
  nextPiece: string,        // type of next piece to spawn
  score: number,
  level: number,
  lines: number,
  phase: 'idle' | 'playing' | 'paused' | 'gameover'
}
```

---

## Reducer Actions

| Action | Trigger |
|---|---|
| `START` | R key |
| `TICK` | Gravity interval |
| `MOVE_LEFT` / `MOVE_RIGHT` | Left / Right arrow |
| `SOFT_DROP` | Down arrow |
| `HARD_DROP` | Spacebar |
| `ROTATE` | Up arrow or X |
| `PAUSE` | P key |

---

## Game Logic

### Piece Definitions & Rotation
Each tetromino stored as 4 rotation states — arrays of `[row, col]` offsets from bounding-box origin. Standard SRS matrices for all 7 pieces. Rotation is `(rotation + 1) % 4`.

### Wall Kicks
SRS offset tables used (I-piece and JLSTZ have different tables). On rotate: try base position, then up to 4 kick offsets in order. First non-colliding position wins; if none, rotation is rejected.

### 7-Bag Randomizer
`bag` is a shuffled array of all 7 piece types. Spawn pops from the end. When empty, refill and shuffle. `nextPiece` is always `bag[bag.length - 1]` before the pop.

### Line Clearing
After lock: scan rows bottom-to-top, collect full rows, remove them, prepend equal count of empty rows at top. Update `lines` count, recompute `level = Math.floor(lines / 10) + 1`, compute score delta.

### Scoring (standard)
| Lines cleared | Points |
|---|---|
| 1 | 100 × level |
| 2 | 300 × level |
| 3 | 500 × level |
| 4 (Tetris) | 800 × level |

### Gravity
`delay = Math.max(100, 1000 - (level - 1) * 90)` ms. Starts at 1000ms, bottoms out at 100ms near level 10. `useGameLoop` re-creates the interval when `level` or `phase` changes.

### Game Over
Detected at spawn: if the newly spawned piece immediately collides with locked cells, dispatch `GAMEOVER`.

### Ghost Piece
After computing active piece position, drop it as far as possible without collision — that row is `ghostY`. Rendered as outlined, low-opacity cells in `Board.jsx`.

---

## UI & Styling

**Layout:** Dark background (`bg-gray-900`). Centered flex row: `[Left Sidebar] [Board] [Right Sidebar]`. Left holds score/level/lines. Right holds Next Piece preview and controls legend.

**Board:** Each cell is `28×28px`. Empty = `bg-gray-800` with subtle border. Locked/active cells use piece color classes. Ghost cells = colored border + transparent fill at ~30% opacity.

**Piece colors:**
| Piece | Tailwind class |
|---|---|
| I | `bg-cyan-400` |
| O | `bg-yellow-400` |
| T | `bg-purple-500` |
| S | `bg-green-500` |
| Z | `bg-red-500` |
| J | `bg-blue-600` |
| L | `bg-orange-500` |

**Overlays (centered on board):**
- Idle: "TETRIS" + "Press R to start"
- Paused: "PAUSED" + "Press P to resume"
- Game Over: "GAME OVER" + final score + "Press R to restart"

---

## Controls

| Key | Action |
|---|---|
| Left / Right arrows | Move |
| Down arrow | Soft drop |
| Up arrow or X | Rotate |
| Spacebar | Hard drop |
| P | Pause / Resume |
| R | Restart |

---

## Out of Scope
- Hold piece
- High score persistence
- Mobile / touch controls
- Sound effects
- Multiplayer
