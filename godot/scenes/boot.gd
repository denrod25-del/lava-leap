extends Control
## Boot splash: hand straight off to the title menu. (Kept as the main scene so
## we don't churn project.godot's run/main_scene; a longer branded splash can
## live here later.)

func _ready() -> void:
	get_tree().change_scene_to_file.call_deferred("res://scenes/menu.tscn")
