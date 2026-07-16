#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "optparse"
require "pathname"
require "set"

class ResultsDatasetValidator
  REQUIRED_STRING_FIELDS = %w[
    competition_name event_name final_group crew_name organization time_display
  ].freeze
  RECORD_KEY_FIELDS = %w[
    year competition_name event_name final_group crew_name organization rank
  ].freeze

  def initialize(data_dir:, loader_path:)
    @data_dir = Pathname(data_dir)
    @loader_path = Pathname(loader_path)
  end

  def validate!
    year_paths = @data_dir.glob("[0-9][0-9][0-9][0-9].json").sort
    raise "No yearly result files found in #{@data_dir}" if year_paths.empty?

    ids = Set.new
    natural_keys = Set.new
    years = []
    total_count = 0

    year_paths.each do |path|
      year = Integer(path.basename(".json").to_s)
      records = JSON.parse(path.read)
      raise "Year file must contain an array: #{path}" unless records.is_a?(Array)

      records.each_with_index do |record, index|
        context = "#{path}:record #{index}"
        validate_record!(record, year, context)
        raise "Duplicate ID #{record['id']} at #{context}" unless ids.add?(record.fetch("id"))

        key = RECORD_KEY_FIELDS.map { |field| record.fetch(field) }
        raise "Duplicate result #{key.join(' | ')} at #{context}" unless natural_keys.add?(key)
      end

      years << year
      total_count += records.length
    end

    validate_index!(years, total_count)
    validate_loader!(years)

    { "years" => years, "total_count" => total_count, "max_id" => ids.max }
  end

  private

  def validate_record!(record, expected_year, context)
    raise "Record must be an object at #{context}" unless record.is_a?(Hash)
    raise "Invalid id at #{context}" unless record["id"].is_a?(Integer) && record["id"].positive?
    raise "Invalid year at #{context}" unless record["year"] == expected_year
    raise "Invalid rank at #{context}" unless record["rank"].is_a?(Integer) && record["rank"].positive?
    unless record["time_seconds"].is_a?(Numeric) && record["time_seconds"].positive?
      raise "Invalid time_seconds at #{context}"
    end
    unless %w[Final\ A Final\ B].include?(record["final_group"])
      raise "Invalid final_group at #{context}"
    end

    REQUIRED_STRING_FIELDS.each do |field|
      value = record[field]
      raise "Invalid #{field} at #{context}" unless value.is_a?(String) && !value.strip.empty?
    end
    unless record["time_display"].match?(/\A\d{2}:\d{2}:\d{2}\z/)
      raise "Invalid time_display at #{context}"
    end
  end

  def validate_index!(years, total_count)
    index_path = @data_dir / "index.json"
    index = JSON.parse(index_path.read)
    raise "index.json years do not match year files" unless index["years"] == years
    raise "index.json total_count does not match year files" unless index["total_count"] == total_count
  end

  def validate_loader!(years)
    loader_years = @loader_path.read.scan(/^\s*case (\d{4}):\s*$/).flatten.map(&:to_i).sort
    raise "Loader years do not match year files" unless loader_years == years
  end
end

if $PROGRAM_NAME == __FILE__
  workspace = Pathname(ENV.fetch("WORKSPACE", Dir.pwd)).expand_path
  options = {
    data_dir: workspace / "frontend/data/results",
    loader_path: workspace / "frontend/lib/results-data.ts"
  }

  OptionParser.new do |parser|
    parser.on("--data-dir PATH", "Results JSON directory") { |path| options[:data_dir] = Pathname(path) }
    parser.on("--loader-path PATH", "Next.js results loader path") { |path| options[:loader_path] = Pathname(path) }
  end.parse!

  puts JSON.pretty_generate(ResultsDatasetValidator.new(**options).validate!)
end
