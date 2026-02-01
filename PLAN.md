# RoboRally 2023 Implementation Plan

Converting Circuit Chaos from 2016 to 2023 RoboRally rules.

## Progress Overview

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Priority Token | `[x]` | Clockwise turn order instead of card priority |
| 2. Personal Decks | `[x]` | Each player has own 20-card deck |
| 3. Energy System | `[x]` | Energy 0-10, batteries, Power Up card |
| 4. Damage Cards | `[x]` | SPAM and Haywire cards |
| 5. Shutdown/Reboot | `[ ]` | Voluntary shutdown, reboot tokens (future) |
| 6. Upgrade Cards | `[ ]` | Permanent/temporary upgrades (future) |

---

## Phase 1: Priority Token System

**Goal**: Replace card-priority execution with clockwise turn order using a Priority Token.

### Changes Required

**Types** (`packages/shared/src/types/`):
- [x] `game-state.ts`: Add `priorityPlayerId: string`

**Server** (`packages/server/src/game/`):
- [x] `GameManager.ts`: Initialize priority token to first player
- [x] `GameManager.ts`: Pass token left at end of round (`advancePriorityToken()`)
- [x] `executor.ts`: Sort by player order (clockwise from priority holder) instead of card priority

**Client** (`packages/client/src/`):
- [x] `components/PlayerList.tsx`: Show priority token indicator ("1st" badge)
- [ ] Show execution order during activation phase (optional enhancement)

### Testing
- [x] Unit test: clockwise execution order
- [x] Unit test: priority token respected

---

## Phase 2: Personal Programming Decks

**Goal**: Each player has their own 20-card deck instead of shared pool.

### Card Distribution (per player)
| Card | Count |
|------|-------|
| Move 1 | 4 |
| Move 2 | 3 |
| Move 3 | 1 |
| Move Back | 1 |
| Rotate Left | 4 |
| Rotate Right | 4 |
| U-Turn | 1 |
| Power Up | 1 |
| Again | 1 |
| **Total** | **20** |

### Changes Required

**Types** (`packages/shared/src/types/`):
- [x] `card.ts`: Add `'powerUp'` and `'again'` to CardType
- [x] `card.ts`: Add labels/icons for new cards
- [x] `player.ts`: Add `deck: Card[]` and `discardPile: Card[]`

**Constants** (`packages/shared/src/constants.ts`):
- [x] Add `PERSONAL_DECK_DISTRIBUTION` with 2023 card counts

**Server** (`packages/server/src/game/`):
- [x] `deck.ts`: Add `createPersonalDeck(): Card[]`
- [ ] `deck.ts`: Add `shuffleDiscardIntoDeck(player)` (future: when deck runs out)
- [x] `GameManager.ts`: Initialize personal deck per player at game start
- [x] `GameManager.ts`: Draw from personal deck, not shared
- [x] `executor.ts`: Handle Power Up card (grant 1 energy)
- [x] `executor.ts`: Handle Again card (repeat previous register)

**Client** (`packages/client/src/`):
- [x] `components/ProgrammingPanel.tsx`: Icons for Power Up (⚡) and Again (🔄)
- [ ] Show deck/discard counts (optional enhancement)

### Testing
- [x] Unit test: deck has exactly 20 cards with correct distribution
- [ ] Unit test: Again in register 1 acts like SPAM (draw replacement) (future)
- [x] Unit test: Power Up grants 1 energy

---

## Phase 3: Energy System

**Goal**: Players have energy (0-10, start at 3), gained from batteries and Power Up.

### Changes Required

**Types** (`packages/shared/src/types/`):
- [x] `robot.ts`: Add `energy: number` (0-10)
- [x] `tile.ts`: Add `'battery'` tile type

**Constants** (`packages/shared/src/constants.ts`):
- [x] Add `STARTING_ENERGY = 3`
- [x] Add `MAX_ENERGY = 10`

**Server** (`packages/server/src/game/`):
- [x] `robot.ts`: Initialize `robot.energy = STARTING_ENERGY`
- [x] `executor.ts`: Add `executeBatteries()` - gain 1 energy if on battery at end of register

**Client** (`packages/client/src/`):
- [x] `components/PlayerHUD.tsx`: Display energy (0-10)
- [x] `assets/themes/*/`: Add battery tile SVG for all 10 themes
- [x] `game/GameBoard.tsx`: Add battery tile rendering support

**Boards**:
- [ ] Add battery tiles to sample boards (optional)

### Testing
- [x] Unit test: energy starts at 3 (via createRobot)
- [x] Unit test: battery grants 1 energy
- [x] Unit test: energy caps at 10 (via MAX_ENERGY in executor)
- [x] Unit test: Power Up card grants 1 energy

---

## Phase 4: Damage Cards (SPAM/Haywire) `[COMPLETE]`

**Goal**: Replace damage counter system with actual damage cards from shared deck.

### Implementation

**Types** (`packages/shared/src/types/`):
- [x] `card.ts`: Add damage card types (spam, haywireMove1RotateMove1, haywireMove2Sideways, haywireMove3Uturn)
- [x] `card.ts`: Add `isDamageCard()` and `isHaywireCard()` helper functions
- [x] `player.ts`: Add `haywireRegisters` for face-down Haywire cards
- [x] `game-state.ts`: Add `damageDeck` and `damageDiscardPile`

**Constants** (`packages/shared/src/constants.ts`):
- [x] Add `DAMAGE_DECK_DISTRIBUTION` (30 SPAM, 10 Haywire variants)

**Server** (`packages/server/src/game/`):
- [x] `deck.ts`: Add `createDamageDeck()` function
- [x] `executor.ts`: Add `dealDamageToPlayer()` - draws from damage deck
- [x] `executor.ts`: Handle SPAM execution (discard + replace from programming deck)
- [x] `executor.ts`: Handle Haywire execution (special movement patterns)
- [x] `executor.ts`: Haywire cards in `haywireRegisters` take precedence
- [x] `executor.ts`: Lasers deal damage cards instead of incrementing counter
- [x] `executor.ts`: Reboot draws 2 damage cards

**Testing**:
- [x] SPAM card replacement test
- [x] Haywire execution tests
- [x] Face-down Haywire precedence test

---

## Future Phases

### Phase 5: Shutdown/Reboot
- Voluntary shutdown to clear all damage
- Reboot tokens for respawn locations
- Draw 2 damage on reboot

### Phase 6: Upgrade Cards
- 40 upgrade cards (24 permanent, 16 temporary)
- Upgrade Phase before Programming Phase
- Energy cost to draw (1) and install (varies)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `packages/shared/src/types/card.ts` | Card types, labels, icons |
| `packages/shared/src/types/player.ts` | Player state (hand, deck, energy) |
| `packages/shared/src/types/game-state.ts` | Game state (priority token) |
| `packages/shared/src/constants.ts` | Card distribution, energy constants |
| `packages/server/src/game/deck.ts` | Deck creation and shuffling |
| `packages/server/src/game/GameManager.ts` | Game session management |
| `packages/server/src/game/executor.ts` | Turn execution logic |
| `packages/client/src/components/ProgrammingPanel.tsx` | Card selection UI |
| `packages/client/src/components/PlayerHUD.tsx` | Player status display |

---

## Implementation Order

1. **Phase 1** first - Priority system is foundational
2. **Phase 2** next - Personal decks with new cards
3. **Phase 3** last - Energy system (needed for future upgrades)

Each phase should be committed separately for easy rollback.
