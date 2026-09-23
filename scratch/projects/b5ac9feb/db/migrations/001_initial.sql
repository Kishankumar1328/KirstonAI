-- Classic Snake Game & Leaderboard — PostgreSQL Schema
CREATE TABLE IF NOT EXISTS scores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player      VARCHAR(100) NOT NULL,
    score       INT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
