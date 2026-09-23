from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.database.base import Base

connect_args = {}
db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    **(
        {
            "pool_size": 10,
            "max_overflow": 20,
            "pool_timeout": 30,
            "pool_recycle": 1800,
        }
        if not db_url.startswith("sqlite")
        else {}
    )
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Auto-migration: ensure newly added columns exist in object_3d_generations table
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            is_postgres = "postgresql" in engine.url.drivername or "postgres" in str(engine.url)
            is_sqlite = "sqlite" in engine.url.drivername or "sqlite" in str(engine.url)

            cols_to_add = [
                ("accuracy_score", "INTEGER DEFAULT 100"),
                ("accuracy_metrics", "JSONB" if is_postgres else "JSON"),
                ("topology_health", "JSONB" if is_postgres else "JSON"),
                ("dimensions_meters", "JSONB" if is_postgres else "JSON"),
            ]

            for col_name, col_type in cols_to_add:
                try:
                    if is_postgres:
                        conn.execute(text(f"ALTER TABLE object_3d_generations ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                    elif is_sqlite:
                        # SQLite doesn't support IF NOT EXISTS on ADD COLUMN
                        conn.execute(text(f"ALTER TABLE object_3d_generations ADD COLUMN {col_name} {col_type};"))
                except Exception:
                    pass
    except Exception as e:
        from app.utils.logging import logger
        logger.warning(f"Database schema auto-migration notice: {e}")
