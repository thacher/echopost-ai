#!/bin/bash

echo "🚀 Setting up Social AI Manager..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) is installed${NC}"

# Install root dependencies
echo -e "${BLUE}📦 Installing root dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install root dependencies${NC}"
    exit 1
fi

# Install client dependencies
echo -e "${BLUE}📦 Installing client dependencies...${NC}"
cd client && npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install client dependencies${NC}"
    exit 1
fi

cd ..

# Create uploads directory
echo -e "${BLUE}📁 Creating uploads directory...${NC}"
mkdir -p uploads

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating environment file...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your API keys before running the app${NC}"
else
    echo -e "${GREEN}✅ Environment file already exists${NC}"
fi

echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit .env file with your API keys"
echo "2. Run 'npm run dev' to start the application"
echo "3. Open http://localhost:3001 in your browser"
echo ""
echo -e "${YELLOW}📚 For detailed setup instructions, see README.md${NC}"
