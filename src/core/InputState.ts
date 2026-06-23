/** Frame input snapshot consumed by Player. `*Pressed` are edge-triggered (true only
 *  on the frame the action began); `jumpHeld` is level (true while held). Phaser-free. */
export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
  pausePressed: boolean;
  /** Horizontal run intent in [-1, 1] (-1 = full left, +1 = full right, 0 = idle).
   *  Keyboard sets ±1 from left/right; the touch run-joystick sets analog values. */
  runAxis: number;
}

export function emptyInput(): InputState {
  return { left: false, right: false, jumpHeld: false, jumpPressed: false, dashPressed: false, pausePressed: false, runAxis: 0 };
}

/** A source of input — implemented by KeyboardInput and TouchSteerInput. */
export interface InputSource {
  /** Compute this frame's state. Implementations handle their own edge detection. */
  sample(): InputState;
}
