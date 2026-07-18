extends GdUnitTestSuite
## Tests for core/level_generator.gd. The critical property is REACH-VALIDITY:
## every generated platform must be reachable from the previous one and fully
## on-screen — otherwise the climb becomes impossible. Mirrors the spirit of the
## web build's generator tests.

const SAMPLE := 400

func test_first_is_wide_static_and_centered() -> void:
	var g := LevelGenerator.new(1)
	var f := g.first()
	assert_str(f.type).is_equal("static")
	assert_float(f.width).is_equal(Reach.MAX_PLATFORM_WIDTH)
	assert_float(f.y).is_equal(Tuning.GROUND_Y)
	# centered under the spawn
	assert_float(f.x + f.width / 2.0).is_equal_approx(Tuning.PLAYER_START_X, 1.0)

func test_is_deterministic_for_a_seed() -> void:
	var a := LevelGenerator.new(12345)
	var b := LevelGenerator.new(12345)
	a.first(); b.first()
	for i in SAMPLE:
		var pa := a.next()
		var pb := b.next()
		assert_float(pa.x).is_equal(pb.x)
		assert_float(pa.y).is_equal(pb.y)
		assert_float(pa.width).is_equal(pb.width)
		assert_str(pa.type).is_equal(pb.type)

func test_every_platform_is_reach_valid_and_on_screen() -> void:
	# Run several seeds so we don't pass by luck.
	for seed in [1, 2, 7, 99, 4242]:
		var g := LevelGenerator.new(seed)
		var prev := g.first()
		for i in SAMPLE:
			var p := g.next()
			# On-screen horizontally.
			assert_float(p.x).is_greater_equal(0.0)
			assert_float(p.x + p.width).is_less_equal(float(Tuning.WIDTH))
			# Width within budget.
			assert_float(p.width).is_between(Reach.MIN_PLATFORM_WIDTH - 1.0, Reach.MAX_PLATFORM_WIDTH + 1.0)
			# Always climbs (strictly higher = smaller y).
			assert_float(p.y).is_less(prev.y)
			# Vertical gap within the jumpable budget.
			var v_gap := prev.y - p.y
			assert_float(v_gap).is_between(Reach.MIN_VERTICAL_GAP - 1.0, Reach.MAX_VERTICAL_GAP + 1.0)
			# Horizontal edge gap within reach (0 if the spans overlap).
			var edge_gap := _edge_gap(prev, p)
			assert_float(edge_gap).is_less_equal(Reach.MAX_HORIZONTAL_EDGE_GAP + 1.0)
			# Moving invariant: type=="moving" => real travel range.
			if p.type == "moving":
				assert_float(p.move_range).is_greater(0.0)
			prev = p

func test_moving_platforms_stay_on_screen() -> void:
	var g := LevelGenerator.new(808)
	g.first()
	for i in SAMPLE:
		var p := g.next()
		if p.is_moving():
			# Extremes must remain fully on-screen.
			assert_float(p.x - p.move_range).is_greater_equal(-0.5)
			assert_float(p.x + p.width + p.move_range).is_less_equal(float(Tuning.WIDTH) + 0.5)

## Edge-to-edge horizontal gap between two platforms (0 if their spans overlap).
func _edge_gap(a: PlatformDesc, b: PlatformDesc) -> float:
	if b.x > a.x + a.width:
		return b.x - (a.x + a.width)
	if a.x > b.x + b.width:
		return a.x - (b.x + b.width)
	return 0.0
