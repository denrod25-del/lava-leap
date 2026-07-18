extends GdUnitTestSuite
## Unit tests for core/rng.gd — mirrors tests/rng.test.ts, PLUS a cross-engine
## parity test that locks the Godot RNG to the exact JS sequence (so the daily
## challenge stays identical on every platform).

func test_is_deterministic_for_a_given_seed() -> void:
	var a := Rng.new(123)
	var b := Rng.new(123)
	assert_array([a.next(), a.next(), a.next()]).is_equal([b.next(), b.next(), b.next()])

func test_returns_values_in_unit_interval() -> void:
	var r := Rng.new(7)
	for i in 100:
		var v := r.next()
		assert_float(v).is_greater_equal(0.0)
		assert_float(v).is_less(1.0)

func test_differs_across_seeds() -> void:
	assert_float(Rng.new(1).next()).is_not_equal(Rng.new(2).next())

## Parity with the JS mulberry32 (values captured from src/core/rng.ts).
## If this ever fails, the RNG has diverged from the web build and daily-seed
## runs will no longer match across platforms.
func test_matches_reference_js_sequence() -> void:
	var r := Rng.new(123)
	var expected := [
		0.7872516233474016,
		0.1785435655619949,
		0.49531551403924823,
		0.23136196262203157,
		0.375791602069512,
	]
	for e in expected:
		assert_float(r.next()).is_equal_approx(e, 1e-12)

func test_range_float_bounds() -> void:
	var r := Rng.new(42)
	for i in 200:
		var v := r.range_float(10.0, 20.0)
		assert_float(v).is_greater_equal(10.0)
		assert_float(v).is_less(20.0)
