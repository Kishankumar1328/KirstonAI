-- Task Manager Seed Data
INSERT INTO projects (name, description) VALUES ('KirstonAI Platform', 'Main product development project') ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, status, priority, assigned_to) VALUES
  ('Design system architecture', 'done', 'high', 'Alice'),
  ('Implement authentication', 'in_progress', 'high', 'Bob'),
  ('Write unit tests', 'todo', 'medium', 'Carol')
ON CONFLICT DO NOTHING;
