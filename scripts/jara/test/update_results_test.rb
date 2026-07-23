# frozen_string_literal: true

require "fileutils"
require "json"
require "minitest/autorun"
require "pathname"
require "tmpdir"
require_relative "../update_results"
require_relative "../validate_results"

class JaraResultsUpdaterTest < Minitest::Test
  FIXTURES = Pathname(__dir__).join("fixtures").expand_path

  def setup
    @tmpdir = Pathname(Dir.mktmpdir)
    @data_dir = @tmpdir / "frontend/data/results"
    @loader_path = @tmpdir / "frontend/lib/results-data.ts"
    @data_dir.mkpath
    @loader_path.dirname.mkpath

    baseline = [record(id: 10, year: 2026, crew: "既存選手")]
    (@data_dir / "2026.json").write(JSON.generate(baseline))
    (@data_dir / "index.json").write(JSON.generate("years" => [2026], "total_count" => 1))
    @loader_path.write(loader_for(2026))
  end

  def teardown
    FileUtils.remove_entry(@tmpdir)
  end

  def test_updates_new_year_with_stable_ids_and_is_idempotent
    first = updater(2027).run!
    records = JSON.parse((@data_dir / "2027.json").read)

    assert_equal "updated", first.fetch("status")
    assert_equal 3, first.fetch("records")
    assert_equal 1, first.fetch("target_competitions")
    assert_equal 2, first.fetch("final_races")
    assert_equal 1, first.fetch("skipped_untimed_rows")
    assert_equal [11, 12, 13], records.map { |row| row.fetch("id") }
    assert_equal "慶應義塾大学", records.find { |row| row["final_group"] == "Final B" }.fetch("organization")
    assert_equal "早稲田大学", records.find { |row| row["rank"] == 1 && row["final_group"] == "Final A" }.fetch("organization")
    assert_equal "単独チーム", records.find { |row| row["rank"] == 2 }.fetch("organization")
    assert_includes @loader_path.read, "case 2027:"

    snapshot = [(@data_dir / "2027.json").read, (@data_dir / "index.json").read, @loader_path.read]
    second = updater(2027).run!

    assert_equal "unchanged", second.fetch("status")
    assert_equal snapshot, [(@data_dir / "2027.json").read, (@data_dir / "index.json").read, @loader_path.read]
    validation = ResultsDatasetValidator.new(data_dir: @data_dir, loader_path: @loader_path).validate!
    assert_equal 4, validation.fetch("total_count")
    assert_equal 13, validation.fetch("max_id")
  end

  def test_refuses_missing_natural_key_even_when_record_count_is_unchanged
    updater(2027).run!
    records = JSON.parse((@data_dir / "2027.json").read)
    records[-1] = record(id: records[-1].fetch("id"), year: 2027, crew: "消失予定の選手")
    (@data_dir / "2027.json").write(JSON.generate(records))

    error = assert_raises(RuntimeError) { updater(2027).run! }
    assert_includes error.message, "Refusing to remove 1 existing 2027 results"
  end

  def test_allows_missing_natural_key_only_with_explicit_override
    updater(2027).run!
    records = JSON.parse((@data_dir / "2027.json").read)
    records[-1] = record(id: records[-1].fetch("id"), year: 2027, crew: "消失予定の選手")
    (@data_dir / "2027.json").write(JSON.generate(records))

    result = updater(2027, allow_decrease: true).run!

    assert_equal "updated", result.fetch("status")
    refute JSON.parse((@data_dir / "2027.json").read).any? { |row| row["crew_name"] == "消失予定の選手" }
  end

  def test_targets_society_championship_names_old_and_new
    instance = updater(2027)
    assert instance.send(:target_competition?, "第75回全日本社会人ローイング選手権大会")
    assert instance.send(:target_competition?, "第70回全日本社会人選手権大会")
    refute instance.send(:target_competition?, "全日本マスターズレガッタ")
  end

  def test_maps_multi_group_final_labels_by_letter
    instance = updater(2027)
    assert_equal "Final A", instance.send(:extract_final_group, "組別: 決勝A組")
    assert_equal "Final A", instance.send(:extract_final_group, "組別: 決勝A")
    assert_equal "Final B", instance.send(:extract_final_group, "組別: 決勝B")
    assert_equal "Final B", instance.send(:extract_final_group, "組別: 順決B組")
    assert_nil instance.send(:extract_final_group, "組別: 決勝C")
    assert_nil instance.send(:extract_final_group, "組別: 順決E組")
    assert_nil instance.send(:extract_final_group, "組別: 予選A組")
  end

  def test_does_not_create_empty_year_before_results_are_published
    result = updater(2028).run!

    assert_equal "no_published_results", result.fetch("status")
    refute (@data_dir / "2028.json").exist?
    refute_includes @loader_path.read, "case 2028:"
  end

  def test_validator_rejects_duplicate_ids
    duplicate = [record(id: 10, year: 2027, crew: "別選手")]
    (@data_dir / "2027.json").write(JSON.generate(duplicate))
    (@data_dir / "index.json").write(JSON.generate("years" => [2026, 2027], "total_count" => 2))
    @loader_path.write(loader_for(2026, 2027))

    error = assert_raises(RuntimeError) do
      ResultsDatasetValidator.new(data_dir: @data_dir, loader_path: @loader_path).validate!
    end
    assert_includes error.message, "Duplicate ID 10"
  end

  private

  def updater(year, allow_decrease: false)
    JaraResultsUpdater.new(
      year: year,
      data_dir: @data_dir,
      loader_path: @loader_path,
      source_url: (FIXTURES / year.to_s / "index.html").then { |path| "file://#{path}" },
      allow_decrease: allow_decrease,
      request_delay: 0
    )
  end

  def record(id:, year:, crew:)
    {
      "id" => id,
      "year" => year,
      "competition_name" => "テスト大会",
      "event_name" => "男子シングルスカル",
      "final_group" => "Final A",
      "crew_name" => crew,
      "organization" => "テスト大学",
      "rank" => 1,
      "time_seconds" => 420.12,
      "time_display" => "07:00:12"
    }
  end

  def loader_for(*years)
    cases = years.map do |year|
      <<~CASE
            case #{year}:
              return (await import("../data/results/#{year}.json")).default as ResultRecord[];
      CASE
    end.join
    <<~TYPESCRIPT
      async function importYear(year: number): Promise<ResultRecord[]> {
        switch (year) {
      #{cases}    default:
            return [];
        }
      }
    TYPESCRIPT
  end
end
