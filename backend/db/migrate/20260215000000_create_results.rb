class CreateResults < ActiveRecord::Migration[7.0]
  def change
    create_table :results do |t|
      t.integer :year, null: false
      t.string :competition_name, null: false
      t.string :event_name, null: false
      t.string :crew_name, null: false
      t.string :organization, null: false
      t.integer :rank, null: false
      t.float :time_seconds, null: false

      t.timestamps
    end

    add_index :results, :year
    add_index :results, :event_name
    add_index :results, :organization
    add_index :results, :rank
  end
end
