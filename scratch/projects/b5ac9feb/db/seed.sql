-- Snake Game Seed Data
INSERT INTO scores (player, score) VALUES ('Alice', 250), ('Bob', 180), ('Carol', 140) ON CONFLICT DO NOTHING;
