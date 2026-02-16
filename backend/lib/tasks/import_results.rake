namespace :data do
  desc "Import rowing results from CSV"
  task import_results: :environment do
    path = ENV.fetch("CSV_PATH", Rails.root.join("data/source/results_sample.csv").to_s)

    require Rails.root.join("lib/importers/results_csv_importer")

    importer = Importers::ResultsCsvImporter.new(path: path)
    count = importer.import!

    puts "Imported #{count} rows from #{path}"
  end
end
