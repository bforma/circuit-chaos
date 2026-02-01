# RoboRally 2023 Rules Summary

This document summarizes the rules from RoboRally 2023 (Hasbro/Renegade edition) that Circuit Chaos aims to implement.

## Game Overview

RoboRally is a racing game where players program robots to navigate a hazardous factory floor. The goal is to reach all checkpoints in numerical order before your opponents. 2-6 players, ages 12+, 45-90 minutes.

## Components

- **Game Boards**: 4 double-sided factory gameboards + 1 double-sided Docking Bay
- **Robots**: 6 pre-painted robot figures with matching player mats
- **Programming Decks**: Each player has their own 20-card deck
- **Damage Cards**: 40 cards (SPAM and Haywire types)
- **Upgrade Cards**: 40 cards (permanent/yellow and temporary/red)
- **Energy Tracking Cubes**: 8 cubes for tracking energy (0-10 per player)
- **Checkpoints**: 6 plastic checkpoint markers with stickers
- **Reboot Tokens**: 6 tokens for respawn locations
- **Archive Tokens**: 6 tokens for dynamic archiving variant
- **Priority Token**: 1 token to determine turn order

## Game Structure

Each round consists of three phases:

### Phase 1: Upgrade Phase

All players may perform these actions simultaneously in any order:

- **Draw a New Upgrade**: Spend 1 Energy to draw 1 upgrade card (max 1 per phase)
- **Install 1 Upgrade**: Pay the Energy cost shown on the card (max 1 per phase)
- **Uninstall Upgrades**: Discard any number of installed upgrades

**Upgrade Limits**:
- Maximum 3 permanent upgrades installed at a time
- Maximum 3 temporary upgrades installed at a time
- No limit on uninstalled upgrades in your collection

### Phase 2: Programming Phase

All players program simultaneously:

1. Draw cards from your programming deck until you have 9 cards in hand
2. If your deck runs out, shuffle your discard pile to replenish it
3. Select 5 cards and place them face-down on registers 1-5 (in order)
4. Discard remaining non-damage cards (keep damage cards in hand!)

**Important**: Once the priority player reveals their first card, no changes allowed!

### Phase 3: Activation Phase

Registers are activated one at a time (1 through 5). For each register:

**A. Programming Card Activation**
1. All players reveal their programmed card
2. Priority player executes first, then clockwise around the table
3. Robots can push other robots during movement

**B. Board Element Activation (in order 1-5) and Robot Weapons (6)**

| Order | Element | Effect |
|-------|---------|--------|
| 1 | Blue Conveyor Belts | Move robots 1 space, then 1 more if still on blue belt |
| 2 | Green Conveyor Belts | Move robots 1 space |
| 3 | Push Panels | Push robots 1 space (only on matching register numbers) |
| 4 | Gears | Rotate robots 90° (red=left, green=right) |
| 5 | Board Lasers | Fire from wall pointers, hit nearest robot only |
| 6 | Robot Weapons | Each robot fires laser in facing direction |

**C. End of Register Activation (in order 7-8)**

| Order | Element | Effect |
|-------|---------|--------|
| 7 | Batteries | Gain 1 Energy if on battery space (max 10) |
| 8 | Checkpoints | Claim checkpoint if on correct next checkpoint |

### End of Round

1. Pass Priority Token to the left
2. Discard face-up damage cards from registers to damage discard pile
3. Discard face-up programming cards from registers to your discard pile
4. Leave face-down cards (Haywire) in registers
5. Return to Upgrade Phase (unless race has ended)

## Priority System

- The player with the Priority Token goes first
- Other players follow in clockwise order
- Priority Token passes to the left at the end of each round

## Programming Cards

Each player's 20-card deck contains:

| Card | Copies | Effect |
|------|--------|--------|
| **Move 1** | 4 | Move forward 1 space |
| **Move 2** | 3 | Move forward 2 spaces |
| **Move 3** | 1 | Move forward 3 spaces |
| **Move Back** | 1 | Move backward 1 space (don't change facing) |
| **Rotate Left** | 4 | Rotate 90° counter-clockwise |
| **Rotate Right** | 4 | Rotate 90° clockwise |
| **U-Turn** | 1 | Rotate 180° |
| **Power Up** | 1 | Gain 1 Energy |
| **Again** | 1 | Repeat previous register's programming |

**Again Card Special Rule**: If programmed in Register 1, treat it like SPAM (discard and draw replacement from deck).

## Board Elements

### Conveyor Belts

- **Blue (Express)**: Move robots 2 spaces total (1 + 1 if still on blue)
- **Green (Normal)**: Move robots 1 space
- **Curved Sections**: Rotate robot 90° when conveyed onto curved space
- **Conveyors do NOT push**: If destination is occupied, robot stops
- **Simultaneous Movement**: All robots on same color belt move together

### Push Panels

- Push robots 1 space away from the wall housing the panel
- Only activate on specific register numbers (marked on panel: 1/3/5 or 2/4)
- Can chain-push multiple robots

### Gears

- Rotate robots 90° in indicated direction
- Red gears rotate left, green gears rotate right

### Board Lasers

- Fire from red/white pointers attached to walls
- Hit only the nearest robot in line of sight
- Cannot fire through walls
- Each beam deals 1 damage (draw from damage deck)

### Batteries

- If robot ends register on battery space, gain 1 Energy
- Maximum 10 Energy per robot

### Checkpoints

- Must be reached in numerical order (1, 2, 3, etc.)
- Robot must be on checkpoint at end of a register to claim it
- Checkpoints do not obstruct movement or lasers
- Board elements under checkpoints are inactive

### Pits and Board Edges

- Falling into a pit or off the board causes immediate Reboot
- Board edges are NOT walls (robots can move/fire through black borders)

### Walls

- Block all movement and lasers
- Spaces on opposite sides of a wall are not adjacent

## Damage System

When a robot takes damage, draw cards from the damage deck one at a time.

### SPAM Cards

- Placed into your programming discard pile
- When revealed in a register during Activation:
  1. Discard SPAM to damage discard pile
  2. Draw top card from your programming deck as replacement
  3. Execute the replacement card
- SPAM cards stay in your hand between rounds (not discarded)

### Haywire Cards

- Placed face-down under the current register's programming card
- Maximum 1 Haywire per register (extras go to damage discard)
- Revealed and executed during the next round
- Often have powerful but unpredictable effects
- After execution, discarded face-up to damage discard pile

## Shutdown

If your robot has too much damage, you may declare "I am shutting down!" after programming but before Register 1 reveals:

1. Robot immediately shuts down for the round
2. Reveal all cards in your registers
3. Discard ALL damage cards (SPAM and Haywire) to damage discard pile
4. Discard all regular programming cards to your discard pile
5. Robot stays on board but doesn't execute programming
6. Robot is still affected by Board Elements, pushing, and lasers
7. Robot cannot collect Energy or reach Checkpoints while shut down

## Rebooting

A robot must Reboot when it falls into a pit or off the board edge:

1. Remove robot from board (returns next round)
2. Cancel all remaining registers for this round
3. Discard all cards in registers and hand:
   - SPAM goes to your discard pile
   - Haywire goes to damage discard pile
4. Draw 2 damage cards (1 at a time)
   - SPAM goes to your discard pile
   - Haywire goes face-down in current register slot

### Re-entering Play

1. Program registers as usual during next Programming Phase
2. When your priority comes up in Register 1:
   - Place robot on Reboot Token of the board where you fell
   - Choose any facing direction
   - If Reboot space is occupied, push that robot 1 space in token's arrow direction
3. Execute your Register 1 card as normal

**Note**: Upgrades remain installed when rebooting.

## Robot Interactions

### Pushing

- Moving into another robot's space pushes them
- Chain pushing is allowed (push multiple robots in a line)
- Robots cannot push through walls (both stop)
- Pushed robots can fall into pits or off the board
- Pushed robots do not change facing
- Conveyors do NOT cause pushes (robot stops instead)

### Robot Lasers

- Fire in the direction the robot is facing
- Unlimited range, stops at first robot or wall
- Deal 1 damage (1 SPAM card)
- Fire after all Board Elements activate

## Upgrade Cards

### Permanent Upgrades (Yellow)

Stay in play until uninstalled. Examples:
- **Brakes** (2): Move 1 cards may be treated as Move 0
- **Deflector Shield** (2): Pay 1 Energy to ignore laser damage this register
- **Double-Barrel Laser** (2): Main laser deals +1 damage
- **Hover Unit** (1): Pass over pits (still fall if ending on one)
- **Mini Howitzer** (3): Pay 1 Energy for 2 damage + push instead of main laser
- **Ramming Gear** (2): Pushing deals 1 damage
- **Rear Laser** (2): Fire laser backwards in addition to main laser

### Temporary Upgrades (Red)

Single use, then discarded. Examples:
- **Abort Switch** (1): Replace just-revealed register card with top of deck
- **Boink** (1): Move to adjacent unoccupied space
- **Recharge** (0): Gain 3 Energy
- **Zoop** (1): Rotate to face any direction
- **Memory Swap** (2): Draw 3, put 3 from hand on top of deck

## Winning the Game

The first robot to end a register on the final checkpoint wins immediately!

## Variant Rules

### A Lighter Game
- Remove all upgrades, Energy tracking, and battery spaces

### A Less Deadly Game
- Board edges act as invisible walls (no falling off)

### A Less SPAM-Y Game
- Discard SPAM cards from hand at end of Programming Phase

### Dynamic Archiving
- Robots archive when ending on a Checkpoint or Battery
- Reboot at Archive Token location instead of Reboot Token

### Act Fast Mode
- 2-3 minute timer for Programming Phase
- Empty registers filled randomly from shuffled hand

---

## Implementation Notes for Circuit Chaos

### Key Differences from 2016 Edition

1. **Priority System**: Uses Priority Token passed clockwise (not proximity to antenna)
2. **Damage Cards**: Only SPAM and Haywire (no Trojan Horse, Worm, Virus)
3. **Shutdown**: Players can voluntarily shutdown to clear all damage
4. **Haywire**: Face-down damage that activates next round with wild effects
5. **Archive Tokens**: Optional variant for dynamic respawn locations
6. **Energy**: Starts at 3, gained from batteries and Power Up card

### Currently Implemented
- [x] Basic programming cards (Move 1/2/3, Move Back, Rotate Left/Right, U-Turn)
- [x] Programming phase with registers
- [x] Board elements: Conveyors, Gears, Pits, Lasers, Checkpoints, Walls
- [x] Robot pushing
- [x] Robot lasers
- [x] Damage tracking
- [x] Basic respawn system
- [x] AI players

### To Be Implemented (2023 Rules)
- [ ] Priority Token system (clockwise turn order)
- [ ] Energy system (0-10 tracking, batteries, Power Up card)
- [ ] Upgrade cards (permanent and temporary)
- [ ] Again card
- [ ] SPAM damage cards (discard and replace mechanic)
- [ ] Haywire damage cards (face-down next round activation)
- [ ] Shutdown mechanic
- [ ] Proper Reboot mechanics with Reboot Tokens
- [ ] Push panels (register-specific activation)
- [ ] Curved conveyor belt rotation
- [ ] Blue conveyor double movement

---

*Rules sourced from RoboRally 2023 Official Rulebook (Hasbro/Renegade Game Studios)*
