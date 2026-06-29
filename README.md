# Tetris

A complete, playable Tetris game built with Vite + React + Tailwind CSS.

![Tetris game screenshot](https://github.com/elizabethsiegle/tetris2/blob/main/screenshot.png?raw=true)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and press **R** to start.

## Controls

| Key | Action |
|-----|--------|
| ← / → | Move left / right |
| ↓ | Soft drop |
| ↑ or X | Rotate |
| Space | Hard drop |
| P | Pause / Resume |
| R | Start / Restart |

## Features

- All 7 tetrominoes (I, O, T, S, Z, J, L) with standard colors
- 7-bag randomizer — every 7 pieces contains one of each type
- SRS rotation with wall kicks
- Ghost piece showing where the current piece will land
- Line clearing — single, double, triple, and Tetris (4 lines)
- Gravity that speeds up as you level up
- Next piece preview
- Score, level, and lines-cleared display
- Pause and game over states

## Scoring

| Lines cleared | Points |
|---------------|--------|
| 1 | 100 × level |
| 2 | 300 × level |
| 3 | 500 × level |
| 4 (Tetris) | 800 × level |

Soft drop awards 1 point per row. Hard drop awards 2 points per row. Level increases every 10 lines.

## Tech Stack

- **Vite 5** — build tool and dev server
- **React 18** — UI with `useReducer` for game state
- **Tailwind CSS 3** — styling
- **Vitest** — unit tests for game logic

## Project Structure

```
src/
├── constants.js          # Board dimensions, colors, scoring table
├── tetrominoes.js        # Piece shapes, SRS wall kicks, helper functions
├── gameReducer.js        # Pure state machine — all game logic
├── hooks/
│   ├── useGameLoop.js    # Gravity timer
│   └── useInput.js       # Keyboard handler
└── components/
    ├── Tetris.jsx         # Root component
    ├── Board.jsx          # 10×20 grid with ghost piece
    ├── NextPiece.jsx      # Preview grid
    └── Sidebar.jsx        # Next piece + controls legend
```

## Development

```bash
npm test        # Run unit tests (27 tests)
npm run build   # Production build
```
