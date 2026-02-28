# syntax=docker/dockerfile:1.7
FROM ruby:3.1.1

RUN apt-get update -qq && apt-get install -y --no-install-recommends build-essential libsqlite3-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile Gemfile.lock* ./
RUN --mount=type=cache,target=/usr/local/bundle/cache bundle install

COPY . .

RUN chmod +x /app/bin/docker-entrypoint

EXPOSE 3000

ENTRYPOINT ["/app/bin/docker-entrypoint"]
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3000"]
