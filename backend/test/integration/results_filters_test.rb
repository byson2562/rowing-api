require "test_helper"

class ResultsFiltersTest < ActionDispatch::IntegrationTest
  setup do
    Result.delete_all

    @m1x_a = Result.create!(
      year: 2025,
      competition_name: "第103回全日本ローイング選手権大会",
      event_name: "男子シングルスカル",
      final_group: "Final A",
      crew_name: "Aクルー",
      organization: "明治大学",
      rank: 1,
      time_seconds: 500.0
    )

    @pr1 = Result.create!(
      year: 2025,
      competition_name: "第103回全日本ローイング選手権大会",
      event_name: "PR1 男子シングルスカル",
      final_group: "Final A",
      crew_name: "Bクルー",
      organization: "明治大学",
      rank: 2,
      time_seconds: 520.0
    )

    @other_competition = Result.create!(
      year: 2025,
      competition_name: "第52回全日本大学ローイング選手権大会／第65回オックスフォード盾レガッタ／第2回ジャパンオープンレガッタ",
      event_name: "男子シングルスカル",
      final_group: "Final B",
      crew_name: "Cクルー",
      organization: "早稲田大学",
      rank: 3,
      time_seconds: 530.0
    )

    @worker_team = Result.create!(
      year: 2025,
      competition_name: "第103回全日本ローイング選手権大会",
      event_name: "男子シングルスカル",
      final_group: "Final B",
      crew_name: "Dクルー",
      organization: "NTT東日本",
      rank: 4,
      time_seconds: 540.0
    )

    @abbr_student_mixed = Result.create!(
      year: 2025,
      competition_name: "第52回全日本大学ローイング選手権大会／第65回オックスフォード盾レガッタ／第2回ジャパンオープンレガッタ",
      event_name: "男子シングルスカル",
      final_group: "Final B",
      crew_name: "Eクルー",
      organization: "一橋大・東京大混成",
      rank: 5,
      time_seconds: 545.0
    )

    @rookie_competition = Result.create!(
      year: 2025,
      competition_name: "第66回全日本新人ローイング選手権大会",
      event_name: "男子シングルスカル",
      final_group: "Final A",
      crew_name: "Fクルー",
      organization: "関西電力",
      rank: 1,
      time_seconds: 515.0
    )

    @lightweight_competition = Result.create!(
      year: 2025,
      competition_name: "第47回全日本軽量級ローイング選手権大会",
      event_name: "男子シングルスカル",
      final_group: "Final A",
      crew_name: "Gクルー",
      organization: "戸田中央総合病院RC",
      rank: 1,
      time_seconds: 518.0
    )
  end

  test "event filter is exact match" do
    get "/api/v1/results", params: { event: "男子シングルスカル" }

    assert_response :success
    payload = JSON.parse(response.body)
    ids = payload["data"].map { |row| row["id"] }

    assert_includes ids, @m1x_a.id
    assert_includes ids, @other_competition.id
    assert_not_includes ids, @pr1.id
  end

  test "competition filter is exact match" do
    get "/api/v1/results", params: { competition: "第103回全日本ローイング選手権大会" }

    assert_response :success
    payload = JSON.parse(response.body)
    ids = payload["data"].map { |row| row["id"] }

    assert_includes ids, @m1x_a.id
    assert_includes ids, @pr1.id
    assert_not_includes ids, @other_competition.id
  end

  test "competition category filter works with sequence/name inference" do
    get "/api/v1/results", params: { competition_category: "全日本大学選手権" }
    assert_response :success
    university_ids = JSON.parse(response.body)["data"].map { |row| row["id"] }
    assert_includes university_ids, @other_competition.id
    assert_includes university_ids, @abbr_student_mixed.id
    assert_not_includes university_ids, @m1x_a.id

    get "/api/v1/results", params: { competition_category: "全日本新人選手権" }
    assert_response :success
    rookie_ids = JSON.parse(response.body)["data"].map { |row| row["id"] }
    assert_equal [@rookie_competition.id], rookie_ids

    get "/api/v1/results", params: { competition_category: "全日本軽量級選手権" }
    assert_response :success
    lightweight_ids = JSON.parse(response.body)["data"].map { |row| row["id"] }
    assert_equal [@lightweight_competition.id], lightweight_ids
  end

  test "organization filter is exact match" do
    get "/api/v1/results", params: { organization: "早稲田大学" }

    assert_response :success
    payload = JSON.parse(response.body)
    assert_equal [@other_competition.id], payload["data"].map { |row| row["id"] }
  end

  test "rank filter is exact match" do
    get "/api/v1/results", params: { rank: 2 }

    assert_response :success
    payload = JSON.parse(response.body)
    assert_equal [@pr1.id], payload["data"].map { |row| row["id"] }
  end

  test "affiliation type filter works for student and worker" do
    get "/api/v1/results", params: { affiliation_type: "学生" }
    assert_response :success
    student_ids = JSON.parse(response.body)["data"].map { |row| row["id"] }
    assert_includes student_ids, @m1x_a.id
    assert_includes student_ids, @pr1.id
    assert_includes student_ids, @other_competition.id
    assert_includes student_ids, @abbr_student_mixed.id
    assert_not_includes student_ids, @worker_team.id

    get "/api/v1/results", params: { affiliation_type: "社会人" }
    assert_response :success
    worker_ids = JSON.parse(response.body)["data"].map { |row| row["id"] }
    assert_includes worker_ids, @worker_team.id
    assert_includes worker_ids, @rookie_competition.id
    assert_not_includes worker_ids, @m1x_a.id
    assert_not_includes worker_ids, @abbr_student_mixed.id
  end

  test "filters endpoint returns affiliation types and competition categories options" do
    get "/api/v1/results/filters"
    assert_response :success

    payload = JSON.parse(response.body)
    assert_equal ["全日本大学選手権", "全日本選手権", "全日本軽量級選手権", "全日本新人選手権"], payload["competition_categories"]
    assert_equal ["学生", "社会人"], payload["affiliation_types"]
  end

  test "organization medal stats count only Final A" do
    get "/api/v1/results/stats", params: { group_by: "organization_medals" }
    assert_response :success
    medals = JSON.parse(response.body)["data"]

    meiji = medals.find { |row| row["label"] == "明治大学" }
    waseda = medals.find { |row| row["label"] == "早稲田大学" }

    assert_equal 2, meiji["value"]
    assert_nil waseda
  end

  test "organization gold stats count only Final A" do
    get "/api/v1/results/stats", params: { group_by: "organization_golds" }
    assert_response :success
    golds = JSON.parse(response.body)["data"]

    meiji = golds.find { |row| row["label"] == "明治大学" }
    assert_equal 1, meiji["value"]
  end

  test "winner time trend uses only Final A winners" do
    get "/api/v1/results/stats", params: { group_by: "winner_time_trend", year: 2025 }
    assert_response :success

    data = JSON.parse(response.body)["data"]
    point_2025 = data.find { |row| row["label"] == "2025" }

    # Final A rank=1 are 500.0, 515.0 and 518.0, Final B rank=1 (not included) are 530.0 and 540.0
    assert_in_delta 511.0, point_2025["value"], 0.001
  end

  test "results index returns pagination metadata" do
    get "/api/v1/results", params: { per_page: 2, page: 2 }
    assert_response :success

    payload = JSON.parse(response.body)
    pagination = payload["pagination"]

    assert_equal 2, pagination["page"]
    assert_equal 2, pagination["per_page"]
    assert_equal 7, pagination["total_count"]
    assert_equal 4, pagination["total_pages"]
    assert_equal 2, payload["data"].size
  end
end
