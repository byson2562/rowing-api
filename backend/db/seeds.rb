require Rails.root.join("lib/importers/results_csv_importer")

if Result.exists?
  puts "Skip seeding: results table already has data."
  exit
end

csv_path = Rails.root.join("data/source/results_sample.csv")
count = Importers::ResultsCsvImporter.new(path: csv_path).import!

puts "Seeded #{count} results from #{csv_path}"
