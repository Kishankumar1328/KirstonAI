INSERT INTO simples (name, description, status)
VALUES ('Initial Simple Alpha', 'Primary test entry', 'active')
ON CONFLICT DO NOTHING;
