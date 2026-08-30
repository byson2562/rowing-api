#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "nokogiri"
require "open-uri"
require "optparse"
require "pathname"
require "set"
require "tempfile"
require "uri"

class JaraResultsUpdater
  BASE_URL = "https://www.jara.or.jp"
  RECORD_KEY_FIELDS = %w[
    year competition_name event_name final_group crew_name organization rank
  ].freeze
  TARGET_COMPETITION_KEYWORDS = [
    "全日本ローイング選手権",
    "全日本選手権",
    "全日本大学ローイング選手権",
    "全日本大学選手権",
    "全日本新人ローイング選手権",
    "全日本新人選手権",
    "全日本社会人ローイング選手権",
    "全日本社会人選手権",
    "全日本軽量級ローイング選手権",
    "全日本軽量級選手権"
  ].freeze
  ORGANIZATION_NORMALIZATION = { "慶応義塾大学" => "慶應義塾大学" }.freeze
  EVENT_NORMALIZATION = {
    "M1X" => "男子シングルスカル",
    "W1X" => "女子シングルスカル",
    "M8+" => "男子エイト",
    "W8+" => "女子エイト"
  }.freeze

  attr_reader :summary

  def initialize(year:, data_dir:, loader_path:, source_url: nil, allow_decrease: false, request_delay: 0.25)
    @year = Integer(year)
    @data_dir = Pathname(data_dir)
    @loader_path = Pathname(loader_path)
    @source_url = source_url || default_source_url
    @allow_decrease = allow_decrease
    @request_delay = Float(request_delay)
    @last_request_at = nil
    @summary = {
      "year" => @year,
      "source_url" => @source_url,
      "target_competitions" => 0,
      "event_pages" => 0,
      "final_races" => 0,
      "skipped_untimed_rows" => 0,
      "records" => 0,
      "added_records" => 0,
      "changed" => false
    }
  end

  def run!
    scraped_records = scrape_records
    existing_records = read_year_records

    if scraped_records.empty? && existing_records.empty?
      @summary["status"] = "no_published_results"
      return @summary
    end

    missing_keys = existing_records.map { |record| record_key(record) }.to_set -
      scraped_records.map { |record| record_key(record) }.to_set
    if missing_keys.any? && !@allow_decrease
      examples = missing_keys.first(3).map { |key| key.join(" | ") }.join("; ")
      raise "Refusing to remove #{missing_keys.length} existing #{@year} results (#{examples})"
    end

    merged_records = merge_with_stable_ids(scraped_records, existing_records)
    validate_year_records!(merged_records)
    year_content = JSON.generate(merged_records)
    index_content = build_index_content(merged_records)
    loader_content = build_loader_content

    changed_paths = []
    changed_paths << write_if_changed(@data_dir / "#{@year}.json", year_content)
    changed_paths << write_if_changed(@data_dir / "index.json", index_content)
    changed_paths << write_if_changed(@loader_path, loader_content)

    @summary["records"] = merged_records.length
    @summary["added_records"] = merged_records.length - existing_records.length
    @summary["changed"] = changed_paths.compact.any?
    @summary["changed_paths"] = changed_paths.compact.map(&:to_s)
    @summary["status"] = @summary["changed"] ? "updated" : "unchanged"
    @summary
  end

  private

  def default_source_url
    current_year = Time.now.getlocal("+09:00").year
    path = @year == current_year ? "/race/current/index.html" : "/race/#{@year}/index.html"
    URI.join(BASE_URL, path).to_s
  end

  def scrape_records
    records_by_key = {}
    target_count = 0

    competition_urls.each do |competition_url|
      competition_doc = fetch_html(competition_url)
      competition_name = text_at(competition_doc, "h1.title")
      next unless target_competition?(competition_name)

      target_count += 1
      event_urls_for_competition(competition_doc, competition_url).each do |event|
        @summary["event_pages"] += 1
        extract_event_rows(event.fetch(:url), competition_name, event.fetch(:name)).each do |record|
          key = record_key(record)
          existing = records_by_key[key]
          if existing && existing != record
            raise "Conflicting duplicate result: #{key.join(' | ')}"
          end

          records_by_key[key] = record
        end
      end
    end

    @summary["target_competitions"] = target_count
    records_by_key.values
  end

  def competition_urls
    doc = fetch_html(@source_url)
    source_uri = URI(@source_url)
    source_directory = File.dirname(source_uri.path)

    doc.css("table.table a[href]").filter_map do |link|
      next unless target_competition?(normalize_space(link.text))

      url = absolutize(@source_url, link["href"])
      uri = URI(url)
      next unless same_origin?(source_uri, uri)
      next unless File.dirname(uri.path) == source_directory
      next unless File.basename(uri.path).match?(/\A#{@year}[a-z0-9_-]*\.html\z/i)
      next if uri.path.match?(/_(tt|et)\.html\z/i)

      url
    rescue URI::InvalidURIError
      nil
    end.uniq
  end

  def event_urls_for_competition(doc, competition_url)
    competition_uri = URI(competition_url)
    result_panels = doc.css("div.panel.panel-info").select do |node|
      text_at(node, ".panel-heading").include?("レース結果")
    end

    result_panels.flat_map do |panel|
      panel.css("a[href]").filter_map do |link|
        name = normalize_space(link.text)
        next if name.empty? || name == "旧形式"

        url = absolutize(competition_url, link["href"])
        uri = URI(url)
        next unless same_origin?(competition_uri, uri)
        next unless uri.path.match?(/\.html\z/i)
        next if uri.path.match?(/_(tt|et)\.html\z/i)

        { url: url, name: name }
      rescue URI::InvalidURIError
        nil
      end
    end.uniq { |event| event.fetch(:url) }
  end

  def extract_event_rows(event_url, competition_name, event_name_hint)
    doc = fetch_html(event_url)
    event_name = normalize_event(event_name_hint)
    event_name = normalize_event(text_at(doc, "ol.race-breadcrumb li:last-child")) if event_name.empty?
    return [] if event_name.empty?
    return [] if ignored_university_oxford_eight?(competition_name, event_name)

    doc.css("div.panel.panel-default.race-result").flat_map do |panel|
      final_group = extract_final_group(text_at(panel, ".race-info .col-xs-6:last-child"))
      next [] unless final_group

      table = panel.at_css("table.table")
      raise "Final race table not found: #{event_url} (#{final_group})" unless table

      @summary["final_races"] += 1
      table.xpath("./tbody/tr | ./tr").filter_map do |row|
        cells = row.xpath("./td")
        next if cells.length < 5

        rank_text = normalize_space(cells[0].text)
        next unless rank_text.match?(/\A\d+\z/)

        crew_name, organization = split_crew_and_organization(cells[1].text)
        time_seconds = parse_time(normalize_space(cells[-3].text))
        unless time_seconds
          @summary["skipped_untimed_rows"] += 1
          next
        end
        next if crew_name.empty? || organization.empty?

        {
          "year" => @year,
          "competition_name" => competition_name,
          "event_name" => event_name,
          "final_group" => final_group,
          "crew_name" => crew_name,
          "organization" => normalize_organization(organization),
          "rank" => rank_text.to_i,
          "time_seconds" => time_seconds,
          "time_display" => format_time(time_seconds)
        }
      end
    end
  end

  def merge_with_stable_ids(scraped_records, existing_records)
    existing_by_key = existing_records.to_h { |record| [record_key(record), record] }
    scraped_by_key = scraped_records.to_h { |record| [record_key(record), record] }
    next_id = maximum_existing_id + 1

    preserved = existing_records.filter_map do |existing|
      scraped = scraped_by_key[record_key(existing)]
      next unless scraped

      { "id" => existing.fetch("id") }.merge(scraped)
    end

    new_records = scraped_records.reject { |record| existing_by_key.key?(record_key(record)) }
      .sort_by { |record| record_sort_key(record) }
      .map do |record|
        assigned = { "id" => next_id }.merge(record)
        next_id += 1
        assigned
      end

    preserved + new_records
  end

  def read_year_records
    path = @data_dir / "#{@year}.json"
    path.exist? ? JSON.parse(path.read) : []
  end

  def maximum_existing_id
    @data_dir.glob("[0-9][0-9][0-9][0-9].json").flat_map do |path|
      JSON.parse(path.read).map { |record| Integer(record.fetch("id")) }
    end.max || 0
  end

  def build_index_content(current_records)
    datasets = @data_dir.glob("[0-9][0-9][0-9][0-9].json").to_h do |path|
      year = path.basename(".json").to_s.to_i
      [year, year == @year ? current_records : JSON.parse(path.read)]
    end
    datasets[@year] = current_records

    JSON.generate(
      "years" => datasets.keys.sort,
      "total_count" => datasets.values.sum(&:length)
    )
  end

  def build_loader_content
    content = @loader_path.read
    return content if content.match?(/^\s*case #{@year}:\s*$/)

    default_line = /^([ \t]*)default:\s*$/
    matched = content.match(default_line)
    raise "Could not find importYear default case in #{@loader_path}" unless matched

    indent = matched[1]
    addition = <<~RUBY.chomp
      #{indent}case #{@year}:
      #{indent}  return (await import("../data/results/#{@year}.json")).default as ResultRecord[];
    RUBY
    content.sub(default_line, "#{addition}\n#{matched[0]}")
  end

  def validate_year_records!(records)
    ids = Set.new
    keys = Set.new
    records.each do |record|
      raise "Invalid year in generated record" unless record["year"] == @year
      raise "Duplicate generated ID: #{record['id']}" unless ids.add?(record.fetch("id"))
      raise "Duplicate generated result: #{record_key(record).join(' | ')}" unless keys.add?(record_key(record))
      raise "Invalid generated rank" unless record["rank"].is_a?(Integer) && record["rank"].positive?
      raise "Invalid generated time" unless record["time_seconds"].is_a?(Numeric) && record["time_seconds"].positive?
    end
  end

  def write_if_changed(path, content)
    return nil if path.exist? && path.read == content

    path.dirname.mkpath
    Tempfile.create([path.basename.to_s, ".tmp"], path.dirname.to_s) do |tempfile|
      tempfile.binmode
      tempfile.write(content)
      tempfile.flush
      tempfile.fsync
      # Tempfile は 0600 で作られる。rename でそのまま本ファイルになるため、
      # コンテナ外(CI の runner ユーザー)から読めるよう通常のパーミッションに戻す
      tempfile.chmod(0o644)
      File.rename(tempfile.path, path)
    end
    path
  end

  def target_competition?(name)
    TARGET_COMPETITION_KEYWORDS.any? { |keyword| name.include?(keyword) }
  end

  def extract_final_group(value)
    label = normalize_space(value).split(":").last.to_s.strip
    # 表記ゆれ: Final A / 決勝 / 決勝A(組) を最上位、Final B / 順決 / 順位決定 /
    # 決勝B(組) / 順決B(組) を第2グループとして扱う(社会人選手権は決勝A〜D組・
    # 順決B〜E組の多組形式。C組以下は「Final B以上」の収録方針に従い対象外)
    return "Final A" if label.match?(/\AFinal\s*A組?\z/i) || label == "決勝" || label.match?(/\A決勝A組?\z/)
    return "Final B" if label.match?(/\AFinal\s*B組?\z/i) || %w[順決 順位決定].include?(label) ||
      label.match?(/\A(?:決勝|順決)B組?\z/)

    nil
  end

  def split_crew_and_organization(value)
    text = normalize_space(value)
    matched = text.match(/\A(?<crew>.+?)\((?<organization>.+)\)\z/)
    return [matched[:crew].strip, matched[:organization].strip] if matched

    [text, text]
  end

  def normalize_organization(value)
    collapsed = value.strip.sub(/(?<=[一-龯ぁ-んァ-ヶー々〆〤0-9０-９])[[:space:]]*[A-ZＡ-Ｚ]\z/, "")
    ORGANIZATION_NORMALIZATION.fetch(collapsed, collapsed)
  end

  def normalize_event(value)
    normalized = normalize_space(value)
    normalized = EVENT_NORMALIZATION.fetch(normalized, normalized)
    # 表記ゆれの名寄せ（frontend/lib/results-data.ts の normalizeEventName と同一規則）
    normalized
      .gsub("舵手付き", "舵手つき")
      .gsub("舵手付", "舵手つき")
      .gsub("舵手なし", "")
      .gsub("クオドルプル", "クォドルプル")
  end

  def ignored_university_oxford_eight?(competition_name, event_name)
    competition_name.include?("全日本大学") &&
      competition_name.include?("オックスフォード盾") &&
      event_name.gsub(/[[:space:]]+/, "") == "オックスフォード盾エイト"
  end

  def parse_time(value)
    matched = value.match(/\A(?<minutes>\d+):(?<seconds>\d{2})[.:](?<centiseconds>\d{2})\z/)
    return nil unless matched

    matched[:minutes].to_i * 60 + matched[:seconds].to_i + matched[:centiseconds].to_i / 100.0
  end

  def format_time(seconds)
    centiseconds = (seconds * 100).round
    minutes, remainder = centiseconds.divmod(6_000)
    whole_seconds, fraction = remainder.divmod(100)
    format("%02d:%02d:%02d", minutes, whole_seconds, fraction)
  end

  def record_key(record)
    RECORD_KEY_FIELDS.map { |field| record.fetch(field) }
  end

  def record_sort_key(record)
    [
      record.fetch("competition_name"),
      record.fetch("event_name"),
      record.fetch("final_group"),
      record.fetch("rank"),
      record.fetch("crew_name"),
      record.fetch("organization")
    ]
  end

  def fetch_html(url, retries: 3)
    uri = URI(url)
    return Nokogiri::HTML.parse(File.binread(uri.path), nil, "UTF-8") if uri.scheme == "file"

    attempts = 0
    begin
      attempts += 1
      respect_request_delay
      html = URI.open(
        url,
        "User-Agent" => "RowingAPI results updater (+https://github.com/byson2562/rowing-api)",
        open_timeout: 20,
        read_timeout: 30,
        &:read
      )
      @last_request_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      Nokogiri::HTML.parse(html)
    rescue OpenURI::HTTPError, Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNREFUSED, SocketError
      raise if attempts >= retries

      sleep attempts
      retry
    end
  end

  def respect_request_delay
    return unless @last_request_at && @request_delay.positive?

    elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - @last_request_at
    sleep(@request_delay - elapsed) if elapsed < @request_delay
  end

  def absolutize(base, href)
    URI.join(base, href).to_s
  end

  def same_origin?(left, right)
    left.scheme == right.scheme && left.host == right.host && left.port == right.port
  end

  def text_at(node, selector)
    target = node.at_css(selector)
    target ? normalize_space(target.text) : ""
  end

  def normalize_space(value)
    value.to_s.gsub("\u00A0", " ").gsub(/[[:space:]]+/, " ").strip
  end
end

if $PROGRAM_NAME == __FILE__
  workspace = Pathname(ENV.fetch("WORKSPACE", Dir.pwd)).expand_path
  options = {
    year: Time.now.getlocal("+09:00").year,
    data_dir: workspace / "frontend/data/results",
    loader_path: workspace / "frontend/lib/results-data.ts",
    request_delay: 0.25,
    allow_decrease: false
  }

  OptionParser.new do |parser|
    parser.banner = "Usage: update_results.rb [options]"
    parser.on("--year YEAR", Integer, "JARA competition year") { |year| options[:year] = year }
    parser.on("--source-url URL", "Override JARA year index URL") { |url| options[:source_url] = url }
    parser.on("--data-dir PATH", "Results JSON directory") { |path| options[:data_dir] = Pathname(path) }
    parser.on("--loader-path PATH", "Next.js results loader path") { |path| options[:loader_path] = Pathname(path) }
    parser.on("--request-delay SECONDS", Float, "Delay between HTTP requests") { |seconds| options[:request_delay] = seconds }
    parser.on("--allow-decrease", "Allow the year record count to decrease") { options[:allow_decrease] = true }
  end.parse!

  updater = JaraResultsUpdater.new(**options)
  puts JSON.pretty_generate(updater.run!)
end
