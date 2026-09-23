INSERT INTO completes (name, description, status)
VALUES ('Initial Complete Alpha', 'Primary test entry', 'active')
ON CONFLICT DO NOTHING;
