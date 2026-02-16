Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :results, only: [:index] do
        collection do
          get :events
          get :filters
          get :stats
        end
      end
    end
  end

  get "/health", to: proc { [200, {}, ["ok"]] }
end
