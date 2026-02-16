require "csv"

module Importers
  class ResultsCsvImporter
    ORGANIZATION_NORMALIZATION = {
      "慶応義塾大学" => "慶應義塾大学"
    }.freeze

    EVENT_NORMALIZATION = {
      "M1X" => "男子シングルスカル",
      "W1X" => "女子シングルスカル",
      "M8+" => "男子エイト",
      "W8+" => "女子エイト"
    }.freeze

    def initialize(path:)
      @path = path
    end

    def import!
      raise ArgumentError, "CSV file not found: #{@path}" unless File.exist?(@path)

      imported_count = 0

      CSV.foreach(@path, headers: true, encoding: "UTF-8") do |row|
        attrs = map_row(row)

        record = Result.find_or_initialize_by(
          year: attrs[:year],
          competition_name: attrs[:competition_name],
          event_name: attrs[:event_name],
          final_group: attrs[:final_group],
          crew_name: attrs[:crew_name],
          organization: attrs[:organization],
          rank: attrs[:rank]
        )

        record.time_seconds = attrs[:time_seconds]
        record.save!
        imported_count += 1
      end

      imported_count
    end

    private

    def map_row(row)
      {
        year: row.fetch("year").to_i,
        competition_name: row.fetch("competition_name").strip,
        event_name: normalize_event(row.fetch("event_name")),
        final_group: row["final_group"].to_s.strip.presence || "Final A",
        crew_name: row.fetch("crew_name").strip,
        organization: normalize_organization(row.fetch("organization")),
        rank: row.fetch("rank").to_i,
        time_seconds: parse_time_to_seconds(row.fetch("time"))
      }
    end

    def normalize_organization(name)
      trimmed = name.to_s.strip
      normalized = ORGANIZATION_NORMALIZATION.fetch(trimmed, trimmed)
      collapse_suffix_variant(normalized)
    end

    def normalize_event(event_name)
      trimmed = event_name.to_s.strip
      EVENT_NORMALIZATION.fetch(trimmed, trimmed)
    end

    def collapse_suffix_variant(name)
      # Examples:
      # - 早稲田大学A -> 早稲田大学
      # - 日本大学B   -> 日本大学
      # - 立教大学 C  -> 立教大学
      # - 〇〇大学D 以降も統合対象
      # Keep labels like TeamSSP intact by only collapsing suffixes after Japanese/number endings.
      name.sub(/(?<=[一-龯ぁ-んァ-ヶー々〆〤0-9０-９])[[:space:]]*[A-ZＡ-Ｚ]\z/, "")
    end

    def parse_time_to_seconds(value)
      raw = value.to_s.strip
      return raw.to_f if raw.match?(/\A\d+(\.\d+)?\z/)

      minute_second = raw.match(/\A(?<minute>\d+):(?<second>\d+(?:\.\d+)?)\z/)
      return (minute_second[:minute].to_i * 60) + minute_second[:second].to_f if minute_second

      raise ArgumentError, "Unsupported time format: #{value.inspect}"
    end
  end
end
