#!/usr/bin/env python
"""Entry point script to start the FastAPI application."""
import sys
import os
import subprocess

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
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd="/app"
    )
    if result.returncode != 0:
        print("WARNING: Database migration had issues, but continuing startup...")
    print("Database migration completed")
    print()

    print("Starting uvicorn server...")
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
