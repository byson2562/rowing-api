class Result < ApplicationRecord
  validates :year, :competition_name, :event_name, :final_group, :crew_name, :organization, :rank, :time_seconds, presence: true

  scope :by_year, ->(year) { where(year: year) if year.present? }
  scope :by_gender, lambda { |gender|
    if gender.present?
      where("event_name LIKE ?", "#{gender}%")
    end
  }
  scope :by_event, ->(event_name) { where(event_name: event_name) if event_name.present? }
  scope :by_final_group, ->(final_group) { where(final_group: final_group) if final_group.present? }
  scope :by_organization, ->(organization) { where(organization: organization) if organization.present? }
  scope :by_rank, ->(rank) { where(rank: rank.to_i) if rank.present? }
  scope :by_affiliation_type, lambda { |affiliation_type|
    next unless affiliation_type.present?

    student_org_pattern = student_organization_pattern
    student_mixed_pattern = student_mixed_abbrev_pattern
    student_condition_sql = <<~SQL.squish
      organization REGEXP :student_org
      OR (organization LIKE '%混成%' AND organization REGEXP :student_mixed_abbrev)
    SQL
    student_condition_binds = {
      student_org: student_org_pattern,
      student_mixed_abbrev: student_mixed_pattern
    }

    case affiliation_type
    when "学生"
      where(student_condition_sql, student_condition_binds)
    when "社会人"
      where.not([student_condition_sql, student_condition_binds])
    end
  }
  scope :by_competition, ->(competition_name) { where(competition_name: competition_name) if competition_name.present? }
  scope :by_rank_range, lambda { |rank_from, rank_to|
    relation = all
    rank_column = arel_table[:rank]
    relation = relation.where(rank_column.gteq(rank_from.to_i)) if rank_from.present?
    relation = relation.where(rank_column.lteq(rank_to.to_i)) if rank_to.present?
    relation
  }
  scope :by_time_range, lambda { |time_from, time_to|
    relation = all
    relation = relation.where("time_seconds >= ?", time_from.to_f) if time_from.present?
    relation = relation.where("time_seconds <= ?", time_to.to_f) if time_to.present?
    relation
  }
  scope :search_text, lambda { |query|
    if query.present?
      where(
        "competition_name LIKE :q OR event_name LIKE :q OR crew_name LIKE :q OR organization LIKE :q",
        q: "%#{query}%"
      )
    end
  }

  def time_display
    total_seconds = time_seconds.to_f
    minutes = (total_seconds / 60).floor
    seconds = (total_seconds % 60).floor
    centiseconds = ((total_seconds - total_seconds.floor) * 100).round

    if centiseconds == 100
      centiseconds = 0
      seconds += 1
    end

    if seconds == 60
      seconds = 0
      minutes += 1
    end

    format("%02d:%02d:%02d", minutes, seconds, centiseconds)
  end

  class << self
    def competition_category_for(competition_name)
      name = competition_name.to_s
      rule = competition_category_rules.find do |category_rule|
        category_rule[:keywords].any? { |keyword| name.include?(keyword) }
      end
      rule&.fetch(:label, nil)
    end

    def filter_by_competition_category(relation, competition_category)
      return relation unless competition_category.present?

      matched_names = relation
        .distinct
        .pluck(:competition_name)
        .select { |name| competition_category_for(name) == competition_category }

      relation.where(competition_name: matched_names)
    end

    def available_competition_categories(relation)
      categories = relation
        .distinct
        .pluck(:competition_name)
        .map { |name| competition_category_for(name) }
        .compact
        .uniq

      competition_categories.select { |category| categories.include?(category) }
    end

    def competition_categories
      competition_category_rules.map { |rule| rule[:label] }
    end

    def competition_category_rules
      @competition_category_rules ||= begin
        rules = Rails.application.config_for(:competition_category_rules)
        categories = rules["categories"] || rules[:categories]

        Array(categories).filter_map do |row|
          label = (row["label"] || row[:label]).to_s
          keywords = Array(row["keywords"] || row[:keywords]).map(&:to_s).reject(&:blank?)
          next if label.blank? || keywords.empty?

          { label: label, keywords: keywords }
        end
      end
    end

    def affiliation_rules
      @affiliation_rules ||= begin
        rules = Rails.application.config_for(:affiliation_rules)
        student_keywords = rules["student_keywords"] || rules[:student_keywords]
        student_mixed_abbrev_keywords = rules["student_mixed_abbrev_keywords"] || rules[:student_mixed_abbrev_keywords]
        {
          student_keywords: Array(student_keywords).map(&:to_s).reject(&:blank?),
          student_mixed_abbrev_keywords: Array(student_mixed_abbrev_keywords).map(&:to_s).reject(&:blank?)
        }
      end
    end

    def student_organization_pattern
      to_regexp_pattern(affiliation_rules[:student_keywords])
    end

    def student_mixed_abbrev_pattern
      to_regexp_pattern(affiliation_rules[:student_mixed_abbrev_keywords])
    end

    private

    def to_regexp_pattern(values)
      return "$^" if values.empty?

      values.map { |value| Regexp.escape(value.to_s) }.join("|")
    end
  end
end
