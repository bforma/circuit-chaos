# Sound Design Plan - Circuit Chaos

## Overview

This document outlines the sound effects to be added to Circuit Chaos. Sounds are categorized by when they trigger.

---

## 1. Robot Movement Sounds

### `robot_move` - Robot Movement
- **When:** Robot moves one tile
- **Character:** Mechanical servo motor, metallic footsteps
- **Duration:** ~200ms
- **Variations:** 2-3 variations to avoid repetition

### `robot_rotate` - Robot Rotation
- **When:** Robot rotates (left, right, u-turn)
- **Character:** Servo motor whirr, mechanical pivot
- **Duration:** ~150ms
- **Variations:** Different for cw/ccw/uturn

### `robot_pushed` - Robot Pushed
- **When:** Robot is pushed by another robot
- **Character:** Metal collision, impact thud
- **Duration:** ~200ms

### `robot_destroyed` - Robot Destroyed
- **When:** Robot falls in pit, off board, or destroyed by damage
- **Character:** Explosion, mechanical failure, falling
- **Duration:** ~500ms
- **Variations:** Different for pit (falling) vs explosion

---

## 2. Board Element Sounds

### `conveyor_move` - Conveyor Belt
- **When:** Conveyor moves robots
- **Character:** Industrial belt movement, mechanical rumble
- **Duration:** ~300ms

### `gear_rotate` - Gear Rotation
- **When:** Gear rotates a robot
- **Character:** Gear clicking, mechanical cog sound
- **Duration:** ~200ms

### `laser_fire` - Laser Fire
- **When:** Lasers fire during laser phase
- **Character:** Sci-fi laser beam, energy discharge
- **Duration:** ~300ms

### `laser_hit` - Laser Hit
- **When:** Laser hits a robot
- **Character:** Electric zap, damage impact
- **Duration:** ~200ms

---

## 3. Achievement Sounds

### `checkpoint_reached` - Checkpoint
- **When:** Robot reaches next checkpoint
- **Character:** Positive chime, achievement sound
- **Duration:** ~400ms

### `energy_gained` - Energy Pickup
- **When:** Robot gains energy from battery/power-up
- **Character:** Power-up sound, energy charge
- **Duration:** ~300ms

### `game_win` - Victory
- **When:** Player wins the game
- **Character:** Triumphant fanfare, celebration
- **Duration:** ~1500ms

---

## 4. UI Sounds

### `card_place` - Card Placement
- **When:** Card placed in register
- **Character:** Card snap, click
- **Duration:** ~100ms

### `card_remove` - Card Removed
- **When:** Card removed from register
- **Character:** Soft click, unsnap
- **Duration:** ~80ms

### `submit_program` - Submit Program
- **When:** Player submits their program
- **Character:** Confirmation beep, ready sound
- **Duration:** ~200ms

### `game_start` - Game Start
- **When:** Host starts the game
- **Character:** Start horn, engine rev
- **Duration:** ~500ms

### `register_start` - Register Execution
- **When:** New register begins executing
- **Character:** Brief notification beep
- **Duration:** ~150ms

### `button_click` - Generic Button
- **When:** Any UI button clicked
- **Character:** Soft click
- **Duration:** ~50ms

### `error` - Error Sound
- **When:** Invalid action attempted
- **Character:** Negative buzz
- **Duration:** ~200ms

---

## 5. Implementation Notes

### Audio Format
- Use **WebM/Opus** for modern browsers (smaller files)
- Fallback to **MP3** for compatibility
- Keep files small (<50KB each)

### Volume Levels
- SFX: 70% default
- Music/Ambient: 30% default (if added)
- User should be able to mute/adjust

### Spatial Audio (optional)
- Pan sounds based on robot position on board
- Robots on left side of screen = left speaker, etc.

### Performance
- Preload all sounds on game start
- Use Web Audio API for low-latency playback
- Pool audio instances for frequently used sounds

---

## 6. File Structure

```
packages/client/src/
├── audio/
│   ├── sounds/           # Sound files
│   │   ├── robot-move.webm
│   │   ├── robot-rotate.webm
│   │   ├── robot-pushed.webm
│   │   ├── robot-destroyed.webm
│   │   ├── conveyor.webm
│   │   ├── gear.webm
│   │   ├── laser-fire.webm
│   │   ├── laser-hit.webm
│   │   ├── checkpoint.webm
│   │   ├── energy.webm
│   │   ├── card-place.webm
│   │   ├── submit.webm
│   │   ├── game-start.webm
│   │   ├── game-win.webm
│   │   └── click.webm
│   ├── SoundManager.ts   # Audio playback manager
│   └── useSounds.ts      # React hook for sounds
```

---

## 7. Sound Generation

Example sounds can be generated using:
1. **Web Audio API synthesis** - For simple tones and beeps
2. **sfxr/jsfxr** - Retro game sound generator
3. **Audacity** - For editing/combining sounds
4. **Free sound libraries** - freesound.org, mixkit.co
