INSERT INTO apis (name, description, status)
VALUES ('Initial Api Alpha', 'Primary test entry', 'active')
ON CONFLICT DO NOTHING;
