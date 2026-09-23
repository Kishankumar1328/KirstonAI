INSERT INTO notess (name, description, status)
VALUES ('Initial Notes Alpha', 'Primary test entry', 'active')
ON CONFLICT DO NOTHING;
