require "csv"
require "nokogiri"
require "open-uri"
require "fileutils"

module Scrapers
  class JaraResultsScraper
    HEADERS = %w[year competition_name event_name crew_name organization rank time].freeze

    def initialize(source_url:, output_csv_path:)
      @source_url = source_url
      @output_csv_path = output_csv_path
    end

    def scrape_to_csv!
      html = load_html(@source_url)
      doc = Nokogiri::HTML.parse(html)
      rows = extract_rows(doc)

      raise "No rows found in source: #{@source_url}" if rows.empty?

      FileUtils.mkdir_p(File.dirname(@output_csv_path))
      CSV.open(@output_csv_path, "w", write_headers: true, headers: HEADERS) do |csv|
        rows.each { |row| csv << row }
      end

      rows.length
    end

    private

    def extract_rows(doc)
      parsed = []

      doc.css("table tr").each do |tr|
        cells = tr.css("th,td").map { |node| node.text.to_s.strip.gsub(/\s+/, " ") }
        next if cells.length < 7
        next unless cells[0].match?(/\A\d{4}\z/)

        parsed << cells.first(7)
      end

      parsed
    end

    def load_html(source)
      if source.start_with?("file://")
        return File.read(source.delete_prefix("file://"))
      end

      return File.read(source) if File.exist?(source)

      URI.open(source, &:read)
    end
  end
end
