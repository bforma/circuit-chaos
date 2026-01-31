# RoboRally 2016 Rules Summary

This document summarizes the rules from RoboRally 2016 (Avalon Hill / Renegade edition) that Circuit Chaos aims to implement.

## Game Overview

RoboRally is a racing game where players program robots to navigate a factory floor filled with hazards. The goal is to reach all checkpoints in numerical order before your opponents.

## Components

- **Game Boards**: Double-sided modular boards that connect to form racing courses
- **Robots**: 6 robot figures with matching player mats
- **Programming Decks**: Each player has their own 20-card deck
- **Damage Cards**: SPAM, Trojan Horse, Worm, and Virus cards
- **Energy Cubes**: Currency for purchasing upgrades
- **Upgrade Cards**: Permanent (yellow) and temporary (red) ability cards
- **Checkpoints**: Numbered flags that must be reached in order
- **Priority Antenna**: Determines turn order based on robot proximity

## Game Structure

Each round consists of three phases:

### Phase 1: Upgrade Phase

Players may purchase upgrades using energy cubes in priority order (closest to the priority antenna goes first).

- **Permanent Upgrades** (yellow): Stay in play until destroyed
- **Temporary Upgrades** (red): Single use, then discarded
- Maximum of 3 permanent and 3 temporary upgrades per robot

### Phase 2: Programming Phase

All players program simultaneously:

1. Draw cards from your programming deck until you have 9 cards in hand
2. Select 5 cards and place them face-down on registers 1-5 (in order)
3. Discard remaining cards

**Timer Rule**: When the first player finishes programming, they flip the 30-second timer. Players who don't finish in time must randomly draw cards from their deck to fill remaining registers.

### Phase 3: Activation Phase

Registers are activated one at a time (1 through 5). For each register:

1. All players reveal their programmed card
2. Players execute their cards in **priority order** (closest to antenna first)
3. Board elements activate in sequence
4. Robots fire lasers
5. Checkpoints are touched

## Priority Order

Turn order is determined by distance from the Priority Antenna:

1. Count spaces from the antenna by row first, then column
2. Tied robots use an imaginary line clockwise from the antenna
3. Priority is recalculated before each register

## Programming Cards

Each player's 20-card deck contains:

| Card | Effect |
|------|--------|
| **Move 1** | Move forward 1 space |
| **Move 2** | Move forward 2 spaces |
| **Move 3** | Move forward 3 spaces |
| **Back Up** | Move backward 1 space (don't change facing) |
| **Turn Left** | Rotate 90° counter-clockwise |
| **Turn Right** | Rotate 90° clockwise |
| **U-Turn** | Rotate 180° |
| **Power Up** | Take 1 energy cube from the bank |
| **Again** | Repeat previous register's card (cannot be in register 1) |

### Special Programming Cards

Obtained through certain upgrades, these cycle through your deck:

- **Speed Routine**: Move 3 spaces forward
- **Weasel Routine**: Choose Turn Left, Turn Right, or U-Turn
- **Sandbox Routine**: Choose any basic move or rotation
- **Energy Routine**: Gain 1 energy cube
- **Spam Folder**: Permanently discard 1 SPAM card
- **Repeat Routine**: Same as Again card

## Board Elements

Board elements activate in this specific order after all robots move:

### 1. Blue Conveyor Belts (Express)

- Move robots 2 spaces in the arrow direction
- Activate twice per register (once at speed 2, once at speed 1)

### 2. Green Conveyor Belts (Normal)

- Move robots 1 space in the arrow direction
- Curved conveyors also rotate robots

### 3. Push Panels

- Push robots 1 space in the direction the panel faces
- Only activate on specific register numbers (marked on panel)

### 4. Gears

- Rotate robots 90° in the direction indicated (clockwise or counter-clockwise)

### 5. Board Lasers

- Fire from wall-mounted emitters
- Cannot shoot through walls or the priority antenna
- Hit only the first robot in their path
- Deal 1 SPAM damage per laser

### 6. Robot Lasers

- Each robot fires a laser in the direction it's facing
- Unlimited range, but stops at first robot or wall
- Deal 1 SPAM damage

### 7. Energy Spaces

- If a robot ends a register on an energy space with a cube, take the cube
- Cubes respawn at round end

### 8. Checkpoints

- Must be reached in numerical order (1, 2, 3, etc.)
- Robot must be on checkpoint at the **end of a register** to claim it
- Take a checkpoint token to track progress

## Damage System

When a robot takes damage, the controlling player draws damage cards:

### SPAM Cards

- Basic damage from lasers
- When programmed: Execute the card (move forward 1), then discard it and draw a replacement from your deck
- Clogs up your programming deck

### Trojan Horse

- When programmed: Take 2 additional SPAM cards immediately

### Worm

- When programmed: Immediately reboot your robot

### Virus

- When programmed: All robots within 6 spaces must take a Virus card

## Rebooting

A robot reboots when:
- It falls off the board
- It falls into a pit
- It is forced to by a Worm card

### Reboot Process

1. Take 2 SPAM damage cards (add to discard pile)
2. Cancel all remaining registers for this round
3. Discard all unplayed programming cards
4. Place robot on your reboot token, facing any direction
5. Robot cannot shoot or use upgrades while rebooting
6. Robot can still be shot or pushed by other robots

**Note**: Checkpoint progress is preserved when rebooting. The robot respawns at the reboot token location (not at the last checkpoint).

## Pits

- Falling into a pit immediately triggers a reboot
- The current register's activation ends for that robot

## Walls

- Block all movement (robots, lasers, conveyors)
- Located on tile edges between spaces

## Robot Interactions

### Pushing

- When a robot would move into a space occupied by another robot, it pushes that robot
- Chain pushing is allowed (push multiple robots in a line)
- Robots cannot push through walls
- Pushed robots can fall into pits or off the board

### Shooting

- Robots automatically fire lasers at the end of each register
- Lasers fire in the direction the robot faces
- First robot hit takes 1 SPAM damage

## Winning the Game

The first robot to touch all checkpoints **in order** wins immediately. The game ends as soon as a robot ends a register on the final checkpoint.

## Optional Rules

### Beginner Mode

- Skip the upgrade phase
- Don't use the timer during programming

### Advanced Mode

- Keep unplayed programming cards in hand instead of discarding
- Draw only enough cards to reach 9 each round

---

## Implementation Notes for Circuit Chaos

### Currently Implemented
- [x] Basic programming cards (Move 1/2/3, Back Up, Turn Left/Right, U-Turn)
- [x] Programming phase with registers
- [x] Board elements: Conveyors, Gears, Pits, Lasers, Checkpoints, Walls
- [x] Robot pushing
- [x] Robot lasers
- [x] Damage tracking
- [x] Basic respawn system
- [x] AI players

### To Be Implemented
- [ ] Priority Antenna (turn order based on proximity)
- [ ] Energy cubes and Power Up card
- [ ] Upgrade cards (permanent and temporary)
- [ ] Again card
- [ ] Damage card types (SPAM, Trojan Horse, Worm, Virus)
- [ ] Proper reboot tokens and reboot mechanics
- [ ] Push panels (register-specific activation)
- [ ] Timer for programming phase
- [ ] Individual programming decks per player

---

*Rules sourced from [RoboRally 2016 Official Rulebook](https://renegadegamestudios.com/content/File%20Storage%20for%20site/Rulebooks/Robo%20Rally/RoboRally_Rulebook_WEB.pdf), [UltraBoardGames](https://ultraboardgames.com/robo-rally/game-rules.php), and [Wikipedia](https://en.wikipedia.org/wiki/RoboRally).*
