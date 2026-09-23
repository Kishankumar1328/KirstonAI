-- Resumes Management Platform Seed Data
INSERT INTO resumes (name, description, status) VALUES
  ('Example Resume A', 'First example', 'active'),
  ('Example Resume B', 'Second example', 'inactive')
ON CONFLICT DO NOTHING;
