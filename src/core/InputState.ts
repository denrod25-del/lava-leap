/** Frame input snapshot consumed by Player. `*Pressed` are edge-triggered (true only
 *  on the frame the action began); `jumpHeld` is level (true while held). Phaser-free. */
export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
  pausePressed: boolean;
  /** Autopilot steer target in world-x, or null when no steer pointer is active.
   *  Ignored by the manual movement path. */
  steerX: number | null;
}

export function emptyInput(): InputState {
  return { left: false, right: false, jumpHeld: false, jumpPressed: false, dashPressed: false, pausePressed: false, steerX: null };
}

/** A source of input — implemented by KeyboardInput and TouchSteerInput. */
export interface InputSource {
  /** Compute this frame's state. Implementations handle their own edge detection. */
  sample(): InputState;
}
