#!/usr/bin/env python3
"""
Test script to verify PostgreSQL compatibility
Run this with a test PostgreSQL DATABASE_URL to ensure everything works
"""

import os
from sqlalchemy import create_engine, text
from app.database import Base
from app.models import User, CloudAccount, Policy, PolicyEvaluation, Notification


def test_postgresql_connection():
    """Test PostgreSQL connection and table creation"""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")

    if not database_url.startswith("postgresql"):
        print("⚠️  Warning: Not testing with PostgreSQL. Set DATABASE_URL to a PostgreSQL connection string.")
        return False

    try:
        # Test connection
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL connection successful!")
            print(f"Database version: {version}")

        # Test table creation
        print("🔄 Testing table creation...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")

        # Test that all models are compatible
        models = [User, CloudAccount, Policy, PolicyEvaluation, Notification]
        for model in models:
            table_name = model.__tablename__
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT count(*) FROM {table_name}"))
                count = result.fetchone()[0]
                print(f"✅ Table '{table_name}' is accessible (current rows: {count})")

        print("🎉 PostgreSQL compatibility test passed!")
        return True

    except Exception as e:
        print(f"❌ PostgreSQL test failed: {e}")
        return False


if __name__ == "__main__":
    test_postgresql_connection()