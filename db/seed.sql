-- KirstonAI Seed Data for Local Development

-- Default Demo User (password: Password123!)
INSERT INTO users (id, email, hashed_password, full_name, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@kirstonai.com',
    '$2b$12$EixZaYVK1fsbw1ZfbX3HlNe.32bytesdefaultdemoencoder12345',
    'Demo Engineer',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Initial Conversation
INSERT INTO conversations (id, user_id, title, is_pinned)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Welcome to KirstonAI',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Initial Welcome Message
INSERT INTO messages (id, conversation_id, role, content, model, tokens_used)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'assistant',
    'Welcome to KirstonAI! I am your agentic AI engineering and multimodal RAG platform powered by NVIDIA Nemotron.',
    'nvidia/nemotron-3.5-lightning-30b-a3b',
    42
) ON CONFLICT (id) DO NOTHING;
