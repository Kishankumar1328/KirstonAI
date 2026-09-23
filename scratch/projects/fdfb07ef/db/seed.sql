-- Seed Data
INSERT INTO items (id, name, status)
VALUES
  ('1', 'Initial Feature Task', 'active'),
  ('2', 'Automated Validation', 'passed')
ON CONFLICT (id) DO NOTHING;
