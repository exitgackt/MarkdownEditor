#!/usr/bin/env python
"""Entry point script to start the FastAPI application."""
import sys
import os

print("=== Markdown Editor Backend Startup ===")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'not set')}")
print(f"PORT: {os.environ.get('PORT', '8080')}")
print()

try:
    print("Testing Python imports...")
    import fastapi
    print(f"FastAPI version: {fastapi.__version__}")
    import uvicorn
    print(f"Uvicorn version: {uvicorn.__version__}")
    from app.main import app
    print("FastAPI app imported successfully")
    print()

    print("Running database migrations...")
    try:
        from alembic.config import Config
        from alembic.command import upgrade

        alembic_cfg = Config("/app/alembic.ini")
        upgrade(alembic_cfg, "head")
        print("Database migration completed successfully")
    except Exception as migration_error:
        print(f"WARNING: Database migration encountered an issue: {migration_error}")
        print("Continuing startup anyway...")
    print()

    print("Starting uvicorn server...")
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
