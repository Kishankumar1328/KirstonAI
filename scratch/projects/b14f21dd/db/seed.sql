INSERT INTO classics (name, description, status)
VALUES ('Initial Classic Alpha', 'Primary test entry', 'active')
ON CONFLICT DO NOTHING;
