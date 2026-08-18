-- Trivia Night analytics schema (CockroachDB / Postgres wire-compatible)

CREATE TABLE IF NOT EXISTS games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  num_rounds      INT NOT NULL,
  winner_team_key TEXT,
  winner_team_name TEXT
);

CREATE TABLE IF NOT EXISTS game_teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       UUID NOT NULL REFERENCES games(id),
  team_key      TEXT NOT NULL,       -- t1, t2, ...
  team_name     TEXT NOT NULL,
  captain_name  TEXT,                -- null if the team never named a captain
  member_names  TEXT[] NOT NULL,
  final_score   INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS game_teams_game_id_idx ON game_teams (game_id);

-- Superseded by player_orders (kept so historical rows from earlier games still resolve).
CREATE TABLE IF NOT EXISTS lineup_choices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id),
  team_key        TEXT NOT NULL,
  team_name       TEXT NOT NULL,
  category_key    TEXT NOT NULL,
  category_title  TEXT NOT NULL,
  player_name     TEXT NOT NULL,
  mode            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS lineup_choices_game_id_idx ON lineup_choices (game_id);

-- One row per player per game: the fixed order (1-based position) that team set for
-- who gets called first, second, third, etc.
CREATE TABLE IF NOT EXISTS player_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       UUID NOT NULL REFERENCES games(id),
  team_key      TEXT NOT NULL,
  team_name     TEXT NOT NULL,
  position      INT NOT NULL,
  player_name   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS player_orders_game_id_idx ON player_orders (game_id);

-- One row per Easy/Medium/Hard pick made during play, tied to the person who made it.
CREATE TABLE IF NOT EXISTS difficulty_picks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      UUID NOT NULL REFERENCES games(id),
  team_key     TEXT NOT NULL,
  team_name    TEXT NOT NULL,
  player_name  TEXT NOT NULL,
  round_title  TEXT NOT NULL,
  difficulty   TEXT NOT NULL,        -- 'easy' | 'medium' | 'hard'
  picked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS difficulty_picks_game_id_idx ON difficulty_picks (game_id);
CREATE INDEX IF NOT EXISTS difficulty_picks_player_idx ON difficulty_picks (player_name);
