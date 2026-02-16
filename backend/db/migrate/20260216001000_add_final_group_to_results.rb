class AddFinalGroupToResults < ActiveRecord::Migration[7.0]
  def change
    add_column :results, :final_group, :string
    add_index :results, :final_group
  end
end
