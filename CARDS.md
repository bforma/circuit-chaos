# RoboRally 2023 Card Reference

Complete reference for all cards in RoboRally 2023.

---

## Programming Cards

Each player has their own 20-card programming deck. These cards are used to program your robot's movements each round.

| Card | Copies | Effect |
|------|--------|--------|
| **Move 1** | 4 | Move your robot 1 space in the direction it is facing. |
| **Move 2** | 3 | Move your robot 2 spaces in the direction it is facing. |
| **Move 3** | 1 | Move your robot 3 spaces in the direction it is facing. |
| **Move Back** | 1 | Move your robot 1 space backwards. It does not change its facing. |
| **Rotate Left** | 4 | Rotate your robot 90 degrees to the left in its current space. |
| **Rotate Right** | 4 | Rotate your robot 90 degrees to the right in its current space. |
| **U-Turn** | 1 | Rotate your robot 180 degrees so it faces in the opposite direction in its current space. |
| **Power Up** | 1 | Advance your Energy Tracking Cube 1 space on your Energy Track. |
| **Again** | 1 | Repeat the programming in your previous register, as if that card were in this register. |

### Card Distribution Summary
- **Total cards per deck**: 20
- **Movement cards**: 9 (Move 1 x4, Move 2 x3, Move 3 x1, Move Back x1)
- **Rotation cards**: 9 (Rotate Left x4, Rotate Right x4, U-Turn x1)
- **Utility cards**: 2 (Power Up x1, Again x1)

### Special Rules

**Again Card**:
- If used after an upgrade or Haywire that allowed multiple programming cards, re-execute only the second card (the one resolved last).
- An Again card in Register 1 acts like SPAM: Discard it into your discard pile and replace it with the top card from your programming deck.

---

## Damage Cards

The damage deck contains 40 cards. When a robot takes damage, draw cards from this deck one at a time.

### SPAM

| Property | Value |
|----------|-------|
| **Type** | Damage |
| **Destination** | Your programming discard pile |

**Effect**: Place this card into the damage discard pile, and replace it with the top card of your programming deck.

**Details**:
- When you receive SPAM, it goes into your programming discard pile
- SPAM cards shuffle into your programming deck when you reshuffle
- SPAM cards in your hand are NOT discarded at end of Programming Phase
- When revealed in a register:
  1. Discard SPAM to the damage discard pile
  2. Draw top card from your programming deck
  3. Execute that card instead
- Programming SPAM is the only way to remove it from your deck (besides Shutdown)

---

### Haywire Cards

Haywire cards are placed face-down under the current register when drawn. They activate during the next round with unpredictable effects.

| Property | Value |
|----------|-------|
| **Type** | Damage |
| **Destination** | Face-down under current register |
| **Limit** | Maximum 1 Haywire per register |

**General Rules**:
- When drawn, place face-down under current register's programming card
- If you already have a Haywire in that register, discard extras to damage discard pile
- During next round, you cannot move or replace Haywire cards in registers
- After execution, discard face-up Haywire to damage discard pile
- Haywire effects may break normal game rules (card takes precedence)

#### Known Haywire Cards

| Card | Effect |
|------|--------|
| **Move 1, Rotate Right, Move 1** | Execute all three actions in sequence. |
| **Move 2 Left or Right** | Move 2 spaces to the left or right, without changing facing. |
| **Move 3, U-Turn** | Move 3 spaces forward, then rotate 180 degrees. |
| **Install a Permanent Upgrade** | Install a permanent upgrade from your collection of uninstalled upgrades at no Energy cost (even if it causes you to exceed 3 permanent upgrades). At end of round, place that card into the upgrade discard pile. |

*Note: The damage deck contains various Haywire cards with different effects. The above are examples from the rulebook.*

---

## Upgrade Cards

The upgrade deck contains 40 cards. Players can spend Energy to draw and install upgrades.

### Upgrade Basics

- **Draw**: Spend 1 Energy during Upgrade Phase to draw 1 upgrade card (max 1 per phase)
- **Install**: Pay the Energy cost shown on the card (max 1 install per phase)
- **Limits**: Maximum 3 permanent + 3 temporary upgrades installed at a time
- **Uninstall**: Discard any number of installed upgrades at any time during Upgrade Phase

---

## Permanent Upgrades (Yellow)

Permanent upgrades stay in play until uninstalled. Place on your player mat when installed.

### Brakes
| Cost | 2 Energy |
|------|----------|
| **Effect** | Move 1 cards in your registers may be treated as Move 0. |
| **Details** | The decision to brake is made after revealing a Move 1 card, but before you would activate the programming card. This does not apply to Again cards played after a Move 1, nor to Haywire cards with a Move 1 effect. |

---

### Chaos Theory
| Cost | 2 Energy |
|------|----------|
| **Effect** | When you reveal SPAM in Register 1, 2, or 3, gain 1 Energy. |
| **Details** | The card that replaces the SPAM enters your register face up, so drawing another SPAM does not trigger this effect again. |

---

### Crab Legs
| Cost | 5 Energy |
|------|----------|
| **Effect** | You may place a Move 1 card in the same register as a Rotate Left or Rotate Right card, and during that register your robot will move 1 space to the left or right, respectively, without rotating. |
| **Details** | The movement to the side is instead of, not in addition to, the normal Move 1 effect. If this upgrade is lost prior to resolving, it still works as described this round. |

---

### Deflector Shield
| Cost | 2 Energy |
|------|----------|
| **Effect** | When your robot would take damage from lasers and/or other weapons, you may pay 1 Energy to take no laser/weapon damage during this register. |
| **Details** | This does not prevent damage from falling into a pit or off the edge of the board. This does not prevent effects that do not (directly) do damage. This protects against robot and board lasers. |

---

### Double-Barrel Laser
| Cost | 2 Energy |
|------|----------|
| **Effect** | Your robot's main laser deals 1 additional damage to robots. |
| **Details** | This combines with Laser Kata and Rail Gun to deal extra damage to all targets that your robot hits. |

---

### Drifting
| Cost | 4 Energy |
|------|----------|
| **Effect** | After resolving a Rotate Left card, you may move 1 space forward. |

---

### Energy Conversion
| Cost | 3 Energy |
|------|----------|
| **Effect** | After your robot takes damage from a board laser, you may move 1 space forward or backward. |

---

### Firewall
| Cost | 1 Energy |
|------|----------|
| **Effect** | You do not draw any damage cards when Rebooting after falling into a pit. |
| **Details** | Does not protect against falling off the board edge. |

---

### Flash Drive
| Cost | 4 Energy |
|------|----------|
| **Effect** | Draw 1 additional programming card at the start of each Programming Phase. |
| **Details** | You draw to 10 cards instead of 9. |

---

### Hover Unit
| Cost | 1 Energy |
|------|----------|
| **Effect** | Your robot can pass over pits during your Programming Card Activation, but falls in if it ends its move on one. |
| **Details** | If your own programming card has your robot ending that move on a pit space or your robot ends up in a pit via other means, it falls in. Board edges are not pits. |

---

### Laser Kata
| Cost | 1 Energy |
|------|----------|
| **Effect** | After performing a U-Turn, your robot fires its main laser in all 4 directions during this register's Robot Weapon Activation. |
| **Details** | Triggers on any card that causes your robot to U-Turn, such as the Haywire card "Move 3, U-Turn." However, if a robot is "rotated to any facing" and it happens to be a U-Turn, that is not a "U-Turn maneuver." |

---

### Memory Cards
| Cost | 3 Energy |
|------|----------|
| **Effect** | At the end of the Programming Phase, you may place any number of non-damage cards from your hand onto this card. At the start of the Upgrade Phase, add all cards on this card to your hand. |
| **Details** | If this upgrade is lost while cards are on it, discard those cards into your discard pile. |

---

### Mini Howitzer
| Cost | 3 Energy |
|------|----------|
| **Effect** | Instead of firing your robot's main laser, you may pay 1 Energy to fire Mini Howitzer. If you do, deal 2 damage to the target robot, then push it 1 space in the direction of fire. |
| **Details** | If you have no Energy, you cannot choose to fire this weapon. You may pay a maximum of 1 Energy to deal 2 damage. The damage is drawn 1 card at a time as usual. |

---

### Modular Chassis
| Cost | 1 Energy |
|------|----------|
| **Effect** | After your robot pushes another robot during your Programming Card Activation, you may give that player this card, and take one of their installed upgrades. Both are immediately installed and active. |
| **Details** | Since the upgrade is gained after the event, any push effects of the new upgrade do not trigger this register. |

---

### Power Slide
| Cost | 4 Energy |
|------|----------|
| **Effect** | After resolving a Rotate Right card, you may move 1 space forward. |

---

### Pressor Beam
| Cost | 3 Energy |
|------|----------|
| **Effect** | Instead of firing your robot's main laser, you may fire Pressor Beam. If you do, push the target robot 1 space away from your robot. |
| **Details** | Note that any push can end up pushing more than one robot. |

---

### Rail Gun
| Cost | 2 Energy |
|------|----------|
| **Effect** | Your robot's main laser may shoot through any number of walls and/or robots. Each robot hit this way takes 1 damage. |

---

### Ramming Gear
| Cost | 2 Energy |
|------|----------|
| **Effect** | During your Programming Card Activation, if your robot pushes (or attempts to push) an adjacent robot, that robot takes 1 damage. |
| **Details** | If an upgrade or Board Element causes a robot to be pushed, that does not trigger Ramming Gear. Even if the push fails to move the other robot, it still takes 1 damage. |

---

### Rear Laser
| Cost | 2 Energy |
|------|----------|
| **Effect** | Your robot has a rear-firing laser in addition to its main laser. Both fire simultaneously. |
| **Details** | The rear-firing laser is not your robot's "main laser," so it does not deal increased damage via Double-Barrel Laser or combine with Rail Gun. |

---

### Scrambler
| Cost | 4 Energy |
|------|----------|
| **Effect** | Instead of firing your robot's main laser, you may fire Scrambler. If you do, replace the target's next register card with the top card from their programming deck. Cannot be used during Register 5. |
| **Details** | If the replaced card is damage, place it in the damage discard pile. If it is a regular programming card (or cards), place it into their discard pile. |

---

### Self-Diagnostics
| Cost | 2 Energy |
|------|----------|
| **Effect** | When your robot reaches a new Checkpoint, you may remove a card in your hand or discard pile from the game. |

---

### Spam Filter
| Cost | 3 Energy |
|------|----------|
| **Effect** | After refilling your hand at the start of the Programming Phase, flip the top card of your programming deck face up. |
| **Details** | You can see what card you'll draw next round if you don't shuffle. |

---

### Spiky
| Cost | 2 Energy |
|------|----------|
| **Effect** | When an adjacent robot moves into your robot's space or is pushed into your robot's space, that robot takes 1 damage. |
| **Details** | Note that a push occurs whether or not the adjacent robot actually moves your robot. Moving adjacent to the Spiky robot does not trigger Spiky. |

---

### Tractor Beam
| Cost | 3 Energy |
|------|----------|
| **Effect** | Instead of firing your robot's main laser, you may fire Tractor Beam. If you do, pull the target robot 1 space towards your robot. Cannot be used on adjacent robots. |

---

## Temporary Upgrades (Red)

Temporary upgrades are single-use cards. Place next to your player mat when installed. Discard to upgrade discard pile after use.

**When to Use**:
- **Movement Upgrades**: Immediately before or after your Programming Card Activation
- **All other temporary upgrades**: At any time

---

### Abort Switch
| Cost | 1 Energy |
|------|----------|
| **Effect** | Replace a register card you just revealed with the top card from your programming deck. |
| **Details** | If the replaced card is damage, place it in the damage discard pile. If it is a regular programming card, place it into your discard pile. |

---

### All Aboard
| Cost | 1 Energy |
|------|----------|
| **Type** | Movement Upgrade |
| **Effect** | Activate all conveyor belts, but only for your robot. Blue conveyors first, then green conveyors. |
| **Details** | The normal rules for conveyor belts still apply. This does not replace or prevent the normal conveyor belt activations. |

---

### Boink
| Cost | 1 Energy |
|------|----------|
| **Type** | Movement Upgrade |
| **Effect** | Move to an unoccupied adjacent space without changing facing. |

---

### Calibration Protocol
| Cost | 2 Energy |
|------|----------|
| **Effect** | Return all damage cards in your hand to the damage discard pile, then draw that many cards from your programming deck. |

---

### Displacing Blast
| Cost | 2 Energy |
|------|----------|
| **Effect** | Instead of firing your robot's main laser, you may fire Displacing Blast. If you do, relocate the target robot to the Reboot token on the board they occupy, without changing facing. |

---

### Lucky Booster
| Cost | 1 Energy |
|------|----------|
| **Effect** | Reveal and discard cards from the damage deck until you reveal Haywire. You may replace a register card you just revealed with that card or discard it to the damage discard pile. |
| **Details** | If the replaced card is damage, place it in the damage discard pile. If it is a regular programming card, place it into your discard pile. |

---

### Magnetic
| Cost | 1 Energy |
|------|----------|
| **Effect** | When an adjacent robot moves via a register card, you may move with them. |

---

### Memory Swap
| Cost | 2 Energy |
|------|----------|
| **Effect** | Draw 3 cards from your programming deck. Then choose 3 cards from your hand to put on top of your deck in any order you choose. |

---

### Overclocked
| Cost | 2 Energy |
|------|----------|
| **Type** | Movement Upgrade |
| **Effect** | Move 2. |

---

### Piercing Drill
| Cost | 1 Energy |
|------|----------|
| **Effect** | When your robot pushes another robot during your Programming Card Activation, they take 1 damage and you may rotate them to any facing. |

---

### Pressure Release
| Cost | 2 Energy |
|------|----------|
| **Type** | Movement Upgrade |
| **Effect** | Move Back 5 spaces, but stop if your robot would push another robot. |
| **Details** | Your robot will also stop if it hits a wall, or falls into a pit. |

---

### Re-Initialize
| Cost | 1 Energy |
|------|----------|
| **Effect** | Give the Priority Token to any player at the table (including yourself). |

---

### Recharge
| Cost | 0 Energy |
|------|----------|
| **Effect** | Gain 3 Energy. |

---

### Rewire
| Cost | 1 Energy |
|------|----------|
| **Effect** | Play only during the Upgrade Phase. Add all face-down Haywire cards in your registers to your hand. You must program all these Haywires this round, but you may place them where you wish. |

---

### Switch
| Cost | 2 Energy |
|------|----------|
| **Type** | Movement Upgrade |
| **Effect** | Swap places with an adjacent robot, without changing facing. |

---

### Zoop
| Cost | 1 Energy |
|------|----------|
| **Type** | Movement Upgrade |
| **Effect** | Rotate to face any direction. |

---

## Card Counts Summary

| Category | Count |
|----------|-------|
| Programming Cards (per player) | 20 |
| Programming Decks (total) | 6 (120 cards) |
| Damage Cards | 40 |
| Upgrade Cards | 40 |
| **Total Cards in Game** | **200** |

### Upgrade Distribution

| Type | Count | Cards |
|------|-------|-------|
| Permanent (Yellow) | 24 | Brakes, Chaos Theory, Crab Legs, Deflector Shield, Double-Barrel Laser, Drifting, Energy Conversion, Firewall, Flash Drive, Hover Unit, Laser Kata, Memory Cards, Mini Howitzer, Modular Chassis, Power Slide, Pressor Beam, Rail Gun, Ramming Gear, Rear Laser, Scrambler, Self-Diagnostics, Spam Filter, Spiky, Tractor Beam |
| Temporary (Red) | 16 | Abort Switch, All Aboard, Boink, Calibration Protocol, Displacing Blast, Lucky Booster, Magnetic, Memory Swap, Overclocked, Piercing Drill, Pressure Release, Re-Initialize, Recharge, Rewire, Switch, Zoop |

---

## Key Terms

| Term | Definition |
|------|------------|
| **Adjacent** | An orthogonal space next to your robot (left, right, front, back) that is not through a wall. |
| **Register Card** | A card in one of your registers, be it damage or a regular programming card. |
| **Target Robot** | The robot your robot's weapon will hit. This is the nearest robot in a straight line away from your robot in the direction in which your robot fires its weapon. All weapons fire forward only unless an upgrade specifically says otherwise. |
| **Unoccupied** | A space that is not occupied by a robot. Board Elements (such as walls, batteries, etc.) do not make a space "occupied." |
| **Main Laser** | Your robot's built-in weapon that fires forward. Some upgrades replace or enhance the main laser. |
| **Movement Upgrade** | A temporary upgrade that can be used immediately before or after your Programming Card Activation. |

---

*Card reference sourced from RoboRally 2023 Official Rulebook (Hasbro/Renegade Game Studios)*
