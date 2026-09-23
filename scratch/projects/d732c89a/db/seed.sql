INSERT INTO adds (name, description, status)
VALUES ('Initial Add Alpha', 'Primary test entry', 'active')
ON CONFLICT DO NOTHING;
