extends Control
## Phase 1: boot straight into the gameplay vertical slice. (Kept as the main
## scene so we don't have to edit project.godot; the real Boot → Menu flow lands
## in a later phase.)

func _ready() -> void:
	get_tree().change_scene_to_file.call_deferred("res://scenes/game.tscn")
