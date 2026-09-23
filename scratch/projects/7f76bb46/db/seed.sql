-- Comments Management Platform Seed Data
INSERT INTO comments (name, description, status) VALUES
  ('Example Comment A', 'First example', 'active'),
  ('Example Comment B', 'Second example', 'inactive')
ON CONFLICT DO NOTHING;
