from app.repositories.user_repository import UserRepository
from app.repositories.conversation_repository import ConversationRepository
from app.services.conversation_service import ConversationService

def test_user_repository(db):
    repo = UserRepository(db)
    user = repo.create(email="test@antigravity.ai", password="secretpassword")
    assert user.id is not None
    assert user.email == "test@antigravity.ai"

    fetched = repo.get_by_email("test@antigravity.ai")
    assert fetched is not None
    assert fetched.id == user.id

def test_conversation_service(db):
    user_repo = UserRepository(db)
    user = user_repo.create(email="conv_user@antigravity.ai")
    
    service = ConversationService(db)
    conv = service.create_conversation(user_id=user.id, title="Unit Test Conv")
    assert conv.title == "Unit Test Conv"
    
    fetched = service.get_conversation(thread_id=conv.id, user_id=user.id)
    assert fetched.id == conv.id
    
    updated = service.update_conversation(thread_id=conv.id, user_id=user.id, title="Renamed Conv")
    assert updated.title == "Renamed Conv"
    
    service.delete_conversation(thread_id=conv.id, user_id=user.id)
    items, total = service.list_conversations(user_id=user.id)
    assert total == 0
