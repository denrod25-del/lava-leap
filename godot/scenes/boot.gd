extends Control
## Phase 0 placeholder boot scene. Confirms the project opens and runs, the
## input actions registered, and the ported RNG produces the reference sequence.
## Replaced by the real Boot → Menu flow in later phases.

@onready var _label: Label = $Label

func _ready() -> void:
	var rng := Rng.new(123)
	var sample := "%f, %f, %f" % [rng.next(), rng.next(), rng.next()]
	var actions := "move_left/right, jump, dash, fast_fall, pause"
	_label.text = "LAVA LEAP — Godot port\nPhase 0 scaffold\n\nRNG(123): %s\nInput actions: %s" % [sample, actions]
	print("[Lava Leap/Godot] Phase 0 boot OK. RNG(123) first: ", sample)
	print("[Lava Leap/Godot] Gameplay input actions registered: ",
		InputMap.has_action("jump") and InputMap.has_action("dash"))
