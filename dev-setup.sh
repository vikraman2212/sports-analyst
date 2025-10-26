#!/bin/bash

# Development Setup Helper Script for Speedometer
# This script helps configure common development scenarios

set -e

echo "🏏 Speedometer Development Setup Helper"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

cd frontend

echo "What would you like to set up?"
echo ""
echo "1) Run dev server on port 3001"
echo "2) Run dev server with HTTPS (for mobile testing)"
echo "3) Enable mock camera (no physical camera needed)"
echo "4) Create .env.local with common dev settings"
echo "5) Install all dependencies"
echo "6) Kill process on port 3001"
echo "7) Run tests"
echo "8) Show debug tips"
echo "0) Exit"
echo ""
read -p "Enter choice [0-8]: " choice

case $choice in
    1)
        print_info "Starting dev server on port 3001..."
        PORT=3001 pnpm dev
        ;;
    
    2)
        print_info "Checking for HTTPS certificates..."
        
        if [ ! -f "localhost+2-key.pem" ]; then
            print_warning "HTTPS certificates not found. Generating with mkcert..."
            
            # Check if mkcert is installed
            if ! command -v mkcert &> /dev/null; then
                print_warning "mkcert not found. Installing..."
                
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    # macOS
                    brew install mkcert
                elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                    # Linux - user needs to install manually
                    echo "Please install mkcert:"
                    echo "  Ubuntu/Debian: sudo apt install mkcert"
                    echo "  Or download from: https://github.com/FiloSottile/mkcert"
                    exit 1
                else
                    echo "Please install mkcert from: https://github.com/FiloSottile/mkcert"
                    exit 1
                fi
            fi
            
            # Install local CA
            mkcert -install
            
            # Generate certificates
            mkcert localhost 127.0.0.1 ::1
            
            print_success "Certificates generated!"
        fi
        
        # Check if package.json has dev:https script
        if ! grep -q "dev:https" package.json; then
            print_info "Adding dev:https script to package.json..."
            
            # Backup package.json
            cp package.json package.json.bak
            
            # Add script using jq if available, otherwise manual
            if command -v jq &> /dev/null; then
                jq '.scripts["dev:https"] = "next dev --turbopack --experimental-https --experimental-https-key ./localhost+2-key.pem --experimental-https-cert ./localhost+2.pem"' package.json > package.json.tmp
                mv package.json.tmp package.json
            else
                print_warning "jq not found. Please manually add this to package.json scripts:"
                echo ""
                echo '  "dev:https": "next dev --turbopack --experimental-https --experimental-https-key ./localhost+2-key.pem --experimental-https-cert ./localhost+2.pem"'
                echo ""
            fi
        fi
        
        print_info "Starting HTTPS dev server..."
        print_success "Access at: https://localhost:3000"
        pnpm run dev:https
        ;;
    
    3)
        print_info "Enabling mock camera..."
        
        # Create or update .env.local
        if [ -f ".env.local" ]; then
            # Check if already has the setting
            if grep -q "NEXT_PUBLIC_USE_MOCK_CAMERA" .env.local; then
                sed -i.bak 's/NEXT_PUBLIC_USE_MOCK_CAMERA=.*/NEXT_PUBLIC_USE_MOCK_CAMERA=true/' .env.local
            else
                echo "NEXT_PUBLIC_USE_MOCK_CAMERA=true" >> .env.local
            fi
        else
            echo "NEXT_PUBLIC_USE_MOCK_CAMERA=true" > .env.local
        fi
        
        print_success "Mock camera enabled in .env.local"
        print_info "Restart dev server for changes to take effect"
        echo ""
        echo "To disable: Remove NEXT_PUBLIC_USE_MOCK_CAMERA from .env.local"
        ;;
    
    4)
        print_info "Creating .env.local with common dev settings..."
        
        cat > .env.local << 'EOF'
# Development Environment Variables

# Mock camera (set to true to use fake camera stream)
# Useful for testing without physical camera
NEXT_PUBLIC_USE_MOCK_CAMERA=false

# API Backend URL (for when backend is running)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Log level (DEBUG, INFO, WARN, ERROR)
# Uncomment to override default
# NEXT_PUBLIC_LOG_LEVEL=DEBUG

# Enable debug features
# NODE_ENV=development
EOF
        
        print_success ".env.local created!"
        print_info "Edit this file to customize your development environment"
        ;;
    
    5)
        print_info "Installing dependencies..."
        pnpm install
        print_success "Dependencies installed!"
        ;;
    
    6)
        print_info "Finding processes on port 3001..."
        
        if command -v lsof &> /dev/null; then
            PID=$(lsof -ti:3001 || true)
            
            if [ -z "$PID" ]; then
                print_info "No process found on port 3001"
            else
                print_warning "Found process $PID on port 3001. Killing..."
                kill -9 $PID
                print_success "Process killed!"
            fi
        else
            print_warning "lsof command not found. Cannot check port usage."
            echo "Try manually: lsof -ti:3001"
        fi
        ;;
    
    7)
        print_info "Running tests..."
        pnpm test
        ;;
    
    8)
        print_success "Debug Tips:"
        echo ""
        echo "📱 Mobile Testing:"
        echo "  1. Find your IP: ipconfig getifaddr en0"
        echo "  2. Run: HOST=0.0.0.0 PORT=3001 pnpm dev"
        echo "  3. Access from phone: http://YOUR_IP:3001"
        echo "  Note: Camera requires HTTPS on mobile! Use option 2 or ngrok."
        echo ""
        echo "🎥 Mock Camera:"
        echo "  Enable in browser console:"
        echo "    localStorage.setItem('USE_MOCK_CAMERA', 'true')"
        echo "    location.reload()"
        echo ""
        echo "  Or use .env.local (option 3 or 4)"
        echo ""
        echo "🔍 Debugging:"
        echo "  • Open browser DevTools (F12)"
        echo "  • Check Console tab for errors"
        echo "  • Check Network tab for failed requests"
        echo "  • Check Application > Local Storage for settings"
        echo ""
        echo "📚 Documentation:"
        echo "  • Debugging Guide: docs/debugging-guide.md"
        echo "  • Manual Testing: docs/manual-testing.md"
        echo "  • Architecture: docs/architecture.md"
        echo ""
        echo "🛠️  Useful Commands:"
        echo "  • Kill port 3001: lsof -ti:3001 | xargs kill -9"
        echo "  • Clear Next cache: rm -rf .next"
        echo "  • Reinstall deps: rm -rf node_modules && pnpm install"
        echo ""
        ;;
    
    0)
        print_info "Exiting..."
        exit 0
        ;;
    
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
