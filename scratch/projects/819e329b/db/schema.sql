CREATE TABLE IF NOT EXISTS simples (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO simples (name, description) VALUES ('Primary Simple Alpha', 'System verified record') ON CONFLICT DO NOTHING;
