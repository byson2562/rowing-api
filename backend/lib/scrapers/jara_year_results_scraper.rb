require "csv"
require "nokogiri"
require "open-uri"
require "uri"
require "fileutils"

module Scrapers
  class JaraYearResultsScraper
    HEADERS = %w[year competition_name event_name final_group crew_name organization rank time].freeze

    def initialize(year:, output_csv_path:, base_url: "https://www.jara.or.jp")
      @year = year.to_i
      @base_url = base_url
      @year_url = URI.join(@base_url, "/race/#{@year}/").to_s
      @output_csv_path = output_csv_path
    end

    def scrape_to_csv!
      rows = []

      competition_urls.each do |competition_url|
        competition_doc = fetch_html(competition_url)
        competition_name = text_at(competition_doc, "h1.title")

        event_urls_for_competition(competition_doc, competition_url).each do |event_url|
          rows.concat(extract_event_rows(event_url, competition_name))
        end
      end

      write_csv(rows)
      rows.length
    end

    private

    def competition_urls
      doc = fetch_html(@year_url)
      urls = doc.css("table.table a[href]").map { |a| absolutize(@year_url, a["href"]) }
      urls.select { |url| url.match?(/\/race\/#{@year}\/[a-z0-9_-]+\.html\z/i) }
        .reject { |url| url.match?(/_(tt|et)\.html\z/i) }
        .uniq
    end

    def event_urls_for_competition(competition_doc, competition_url)
      panel = competition_doc.css("div.panel.panel-info").find do |node|
        text_at(node, ".panel-heading").include?("レース結果")
      end
      return [] unless panel

      panel.css("a[href]").map { |a| absolutize(competition_url, a["href"]) }
        .select { |url| url.match?(/\.html\z/i) }
        .reject { |url| url.match?(/_(tt|et)\.html\z/i) }
        .uniq
    end

    def extract_event_rows(event_url, competition_name)
      doc = fetch_html(event_url)
      event_name = text_at(doc, "ol.race-breadcrumb li:last-child")
      return [] if event_name.empty?

      rows = []

      doc.css("div.panel.panel-default.race-result").each do |panel|
        race_group = text_at(panel, ".race-info .col-xs-6:last-child")
        final_group = extract_final_group(race_group)
        next if final_group.nil?

        table = panel.at_css("table.table")
        next unless table

        table.css("tr").each do |tr|
          next if tr["class"].to_s.include?("collapse")

          tds = tr.css("td")
          next if tds.length < 5

          rank_text = normalize_space(tds[0].text)
          next unless rank_text.match?(/\A\d+\z/)

          crew_text_raw = tds[1].text
          crew_name, organization = split_crew_and_organization(crew_text_raw)
          next if crew_name.empty? || organization.empty?

          time_text = normalize_space(tds[-3].text)
          next if time_text.empty?

          rows << [
            @year,
            competition_name,
            event_name,
            final_group,
            crew_name,
            organization,
            rank_text,
            time_text
          ]
        end
      end

      rows
    rescue OpenURI::HTTPError, Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNREFUSED, SocketError
      []
    end

    def split_crew_and_organization(raw_text)
      text = normalize_space(raw_text)
      return ["", ""] if text.empty?

      matched = text.match(/\A(?<crew>.+?)\((?<org>.+)\)\z/)
      return [matched[:crew].strip, matched[:org].strip] if matched

      # Team boat pages often show organization only in the crew column.
      # In that case we keep both fields as the same label so the record is retained.
      [text, text]
    end

    def extract_final_group(race_group)
      normalized = normalize_space(race_group)
      # Examples:
      # - "組別: Final A組"
      # - "組別: SemiFinalA組"
      # We only accept exact Final A/B groups.
      group_label = normalized.split(":").last.to_s.strip
      return nil unless group_label.match?(/\AFinal\s*[AB]組?\z/i)

      group_label.match?(/\AFinal\s*A組?\z/i) ? "Final A" : "Final B"
    end

    def write_csv(rows)
      FileUtils.mkdir_p(File.dirname(@output_csv_path))

      CSV.open(@output_csv_path, "w", write_headers: true, headers: HEADERS) do |csv|
        rows.each { |row| csv << row }
      end
    end

    def fetch_html(url, retries: 3)
      attempts = 0
      begin
        attempts += 1
        html = URI.open(url, open_timeout: 20, read_timeout: 30, &:read)
        Nokogiri::HTML.parse(html)
      rescue Net::OpenTimeout, Net::ReadTimeout, OpenURI::HTTPError
        raise if attempts >= retries

        sleep 1.0 * attempts
        retry
      end
    end

    def absolutize(base, href)
      URI.join(base, href).to_s
    rescue URI::InvalidURIError
      href.to_s
    end

    def text_at(node, selector)
      target = node.at_css(selector)
      target ? normalize_space(target.text) : ""
    end

    def normalize_space(text)
      text.to_s.gsub(/\u00A0/, " ").gsub(/[[:space:]]+/, " ").strip
    end
  end
end
