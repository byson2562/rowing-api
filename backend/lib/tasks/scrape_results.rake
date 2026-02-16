namespace :data do
  desc "Scrape rowing result page and export rows as CSV"
  task scrape_results: :environment do
    source_url = ENV.fetch("SOURCE_URL")
    output_csv_path = ENV.fetch("OUTPUT_CSV", Rails.root.join("data/source/scraped_results.csv").to_s)

    require Rails.root.join("lib/scrapers/jara_results_scraper")

    scraper = Scrapers::JaraResultsScraper.new(source_url: source_url, output_csv_path: output_csv_path)
    count = scraper.scrape_to_csv!

    puts "Scraped #{count} rows from #{source_url} -> #{output_csv_path}"
  end
end
