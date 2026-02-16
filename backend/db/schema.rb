# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2026_02_16_001000) do
  create_table "results", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "year", null: false
    t.string "competition_name", null: false
    t.string "event_name", null: false
    t.string "crew_name", null: false
    t.string "organization", null: false
    t.integer "rank", null: false
    t.float "time_seconds", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "final_group"
    t.index ["event_name"], name: "index_results_on_event_name"
    t.index ["final_group"], name: "index_results_on_final_group"
    t.index ["organization"], name: "index_results_on_organization"
    t.index ["rank"], name: "index_results_on_rank"
    t.index ["year"], name: "index_results_on_year"
  end

end
