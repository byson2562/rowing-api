module Api
  module V1
    class ResultsController < ApplicationController
      def index
        relation = Result
          .by_year(params[:year])
          .by_gender(params[:gender])
          .by_affiliation_type(params[:affiliation_type])
          .by_event(params[:event])
          .by_final_group(params[:final_group])
          .by_competition(params[:competition])
          .by_organization(params[:organization])
          .by_rank(params[:rank])
          .by_rank_range(params[:rank_from], params[:rank_to])
          .by_time_range(params[:time_from], params[:time_to])
          .search_text(params[:q])
        relation = apply_competition_category_filter(relation)
        relation = relation.order(year: :desc, competition_name: :asc, event_name: :asc, final_group: :asc, rank: :asc)

        page = [params[:page].presence&.to_i || 1, 1].max
        per_page = params[:per_page].presence&.to_i || 50
        per_page = [[per_page, 1].max, 200].min
        total_count = relation.count
        total_pages = (total_count.to_f / per_page).ceil
        offset = (page - 1) * per_page
        paged = relation.offset(offset).limit(per_page)

        render json: {
          data: paged.as_json(methods: [:time_display]),
          pagination: {
            page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: total_pages
          }
        }
      end

      def events
        filtered = Result
          .by_year(params[:year])
          .by_competition(params[:competition])
        filtered = apply_competition_category_filter(filtered)

        data = filtered.distinct.order(:event_name).pluck(:event_name)
        render json: { data: data }
      end

      def filters
        base = Result.all

        final_groups_relation = base
          .by_year(params[:year])
          .by_gender(params[:gender])
          .by_affiliation_type(params[:affiliation_type])
          .by_competition(params[:competition])
          .by_event(params[:event])
          .by_organization(params[:organization])
        final_groups_relation = apply_competition_category_filter(final_groups_relation)

        competitions_relation = base
          .by_year(params[:year])
          .by_gender(params[:gender])
          .by_affiliation_type(params[:affiliation_type])
          .by_event(params[:event])
          .by_final_group(params[:final_group])
          .by_organization(params[:organization])
        competitions_relation = apply_competition_category_filter(competitions_relation)

        events_relation = base
          .by_year(params[:year])
          .by_gender(params[:gender])
          .by_affiliation_type(params[:affiliation_type])
          .by_competition(params[:competition])
          .by_final_group(params[:final_group])
          .by_organization(params[:organization])
        events_relation = apply_competition_category_filter(events_relation)

        organizations_relation = base
          .by_year(params[:year])
          .by_gender(params[:gender])
          .by_affiliation_type(params[:affiliation_type])
          .by_competition(params[:competition])
          .by_event(params[:event])
          .by_final_group(params[:final_group])
        organizations_relation = apply_competition_category_filter(organizations_relation)

        affiliation_types_relation = base
          .by_year(params[:year])
          .by_gender(params[:gender])
          .by_competition(params[:competition])
          .by_event(params[:event])
          .by_final_group(params[:final_group])
          .by_organization(params[:organization])
        affiliation_types_relation = apply_competition_category_filter(affiliation_types_relation)

        competition_categories_relation = base
          .by_year(params[:year])
          .by_gender(params[:gender])
          .by_affiliation_type(params[:affiliation_type])
          .by_competition(params[:competition])
          .by_event(params[:event])
          .by_final_group(params[:final_group])
          .by_organization(params[:organization])

        render json: {
          years: base.distinct.order(year: :desc).pluck(:year),
          genders: base
            .by_year(params[:year])
            .by_competition(params[:competition])
            .by_event(params[:event])
            .by_final_group(params[:final_group])
            .by_organization(params[:organization])
            .distinct
            .pluck(:event_name)
            .map { |event_name| event_name.start_with?("男子") ? "男子" : (event_name.start_with?("女子") ? "女子" : nil) }
            .compact
            .uniq
            .sort,
          competition_categories: Result.available_competition_categories(competition_categories_relation),
          final_groups: final_groups_relation.distinct.order(:final_group).pluck(:final_group),
          competitions: competitions_relation.distinct.order(:competition_name).pluck(:competition_name),
          events: events_relation.distinct.order(:event_name).pluck(:event_name),
          organizations: organizations_relation.distinct.order(:organization).pluck(:organization),
          affiliation_types: affiliation_types_relation.yield_self do |relation|
            options = []
            options << "学生" if relation.by_affiliation_type("学生").exists?
            options << "社会人" if relation.by_affiliation_type("社会人").exists?
            options
          end
        }
      end

      def stats
        filtered = Result
          .by_year(params[:year])
          .by_gender(params[:gender])
          .by_affiliation_type(params[:affiliation_type])
          .by_event(params[:event])
          .by_final_group(params[:final_group])
          .by_competition(params[:competition])
          .by_organization(params[:organization])
          .by_rank(params[:rank])
          .by_rank_range(params[:rank_from], params[:rank_to])
          .by_time_range(params[:time_from], params[:time_to])
          .search_text(params[:q])
        filtered = apply_competition_category_filter(filtered)

        case params[:group_by]
        when "year_count"
          data = filtered.group(:year).order(:year).count.map { |year, count| { label: year.to_s, value: count } }
        when "organization_medals"
          medals = filtered.where(final_group: "Final A", rank: [1, 2, 3]).group(:organization).order(Arel.sql("COUNT(*) DESC")).limit(10).count
          data = medals.map { |organization, count| { label: organization, value: count } }
        when "organization_golds"
          golds = filtered.where(final_group: "Final A", rank: 1).group(:organization).order(Arel.sql("COUNT(*) DESC")).limit(10).count
          data = golds.map { |organization, count| { label: organization, value: count } }
        when "event_count"
          events = filtered.group(:event_name).order(Arel.sql("COUNT(*) DESC")).limit(10).count
          data = events.map { |event_name, count| { label: event_name, value: count } }
        when "winner_time_trend"
          winners = filtered.where(final_group: "Final A", rank: 1)
          data = winners.group(:year).order(:year).average(:time_seconds).map do |year, avg_time|
            { label: year.to_s, value: avg_time.to_f.round(2) }
          end
        else
          return render json: { error: "group_by must be one of: year_count, organization_medals, organization_golds, event_count, winner_time_trend" }, status: :unprocessable_entity
        end

        render json: { group_by: params[:group_by], data: data }
      end

      private

      def apply_competition_category_filter(relation)
        Result.filter_by_competition_category(relation, params[:competition_category])
      end
    end
  end
end
