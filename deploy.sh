#!/bin/bash

# Quick deployment script for Speedometer

set -e

echo "🚀 Speedometer Deployment Script"
echo "=================================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed."; exit 1; }

echo "✅ Prerequisites check passed"

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

# Build and start services
echo ""
echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Health checks
echo ""
echo "🏥 Running health checks..."

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend failed to start"
fi

if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
    echo "📚 API docs available at http://localhost:8000/docs"
else
    echo "⚠️  Backend not running (this is OK if you're only deploying frontend)"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
echo "Access your application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
