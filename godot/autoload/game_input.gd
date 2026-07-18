extends Node
## Registers Lava Leap's gameplay input actions at startup, each bound to
## keyboard + gamepad so controller support "just works". Touch is handled by
## on-screen controls in the HUD scene (Phase 2). UI navigation reuses Godot's
## built-in ui_* actions (keyboard + gamepad by default), so we only define the
## six gameplay actions here.
##
## Ported concept: src/entities/input/KeyboardInput.ts + core/InputState.ts.
## The gameplay layer reads these via Input.get_axis / is_action_* and produces
## the same InputState the ported logic expects.

const STICK_DEADZONE := 0.35

func _ready() -> void:
	_action("move_left", [KEY_A, KEY_LEFT], [JOY_BUTTON_DPAD_LEFT], JOY_AXIS_LEFT_X, -1.0)
	_action("move_right", [KEY_D, KEY_RIGHT], [JOY_BUTTON_DPAD_RIGHT], JOY_AXIS_LEFT_X, 1.0)
	_action("jump", [KEY_SPACE, KEY_W, KEY_UP], [JOY_BUTTON_A])
	_action("dash", [KEY_SHIFT, KEY_K], [JOY_BUTTON_X])
	_action("fast_fall", [KEY_S, KEY_DOWN], [JOY_BUTTON_DPAD_DOWN], JOY_AXIS_LEFT_Y, 1.0)
	_action("pause", [KEY_P, KEY_ESCAPE], [JOY_BUTTON_START])

## Create (or reset) an action bound to the given keys, joypad buttons, and an
## optional analog-stick axis direction (axis + sign).
func _action(name: StringName, keys: Array, buttons: Array,
		axis: int = -1, axis_value: float = 0.0) -> void:
	if InputMap.has_action(name):
		InputMap.erase_action(name)
	InputMap.add_action(name, STICK_DEADZONE)
	for k in keys:
		var ev := InputEventKey.new()
		ev.physical_keycode = k
		InputMap.action_add_event(name, ev)
	for b in buttons:
		var ev := InputEventJoypadButton.new()
		ev.button_index = b
		InputMap.action_add_event(name, ev)
	if axis >= 0:
		var ev := InputEventJoypadMotion.new()
		ev.axis = axis
		ev.axis_value = axis_value
		InputMap.action_add_event(name, ev)
