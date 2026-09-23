CREATE TABLE IF NOT EXISTS apps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO apps (name, description) VALUES ('Primary App Alpha', 'System verified record') ON CONFLICT DO NOTHING;
