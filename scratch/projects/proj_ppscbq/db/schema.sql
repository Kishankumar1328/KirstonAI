CREATE TABLE IF NOT EXISTS scores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name VARCHAR(255) NOT NULL,
    score       INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO scores (player_name, score) VALUES ('AI Champion', 250) ON CONFLICT DO NOTHING;
