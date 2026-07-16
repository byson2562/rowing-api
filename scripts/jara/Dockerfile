FROM ruby:3.3-slim AS gems

WORKDIR /app

RUN apt-get update \
    && apt-get install --yes --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY Gemfile Gemfile.lock ./
RUN bundle install

FROM ruby:3.3-slim

WORKDIR /app
ENV BUNDLE_GEMFILE=/app/Gemfile

COPY --from=gems /usr/local/bundle /usr/local/bundle

COPY . ./

ENTRYPOINT ["bundle", "exec", "ruby", "/app/update_results.rb"]
