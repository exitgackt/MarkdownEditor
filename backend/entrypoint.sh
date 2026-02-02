#!/bin/bash
set -e

echo "=== Markdown Editor Backend Startup ==="
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "PYTHONPATH: ${PYTHONPATH}"
echo "PATH: ${PATH}"
echo "PORT: ${PORT:-8080}"
echo ""

echo "Testing Python imports..."
python -c "import fastapi; print(f'FastAPI version: {fastapi.__version__}')"
python -c "import uvicorn; print(f'Uvicorn version: {uvicorn.__version__}')"
python -c "from app.main import app; print('FastAPI app imported successfully')"
echo ""

echo "Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
