namespace :data do
  desc "Scrape JARA year pages and import final race results"
  task import_jara_year: :environment do
    year = ENV.fetch("YEAR")
    base_url = ENV.fetch("BASE_URL", "https://www.jara.or.jp")
    csv_path = ENV.fetch("OUTPUT_CSV", Rails.root.join("data/source/jara_#{year}.csv").to_s)

    require Rails.root.join("lib/scrapers/jara_year_results_scraper")
    require Rails.root.join("lib/importers/results_csv_importer")

    scraper = Scrapers::JaraYearResultsScraper.new(year: year, base_url: base_url, output_csv_path: csv_path)
    scraped = scraper.scrape_to_csv!

    importer = Importers::ResultsCsvImporter.new(path: csv_path)
    imported = importer.import!

    puts "Scraped #{scraped} rows and imported #{imported} rows for #{year}"
    puts "CSV: #{csv_path}"
  end
end
