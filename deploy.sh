#!/bin/bash

echo "🚀 KIH DAH Bot Deployment Script"
echo "👑 Created by GuruTech"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Platform selection
echo "Select deployment platform:"
echo "1) Render.com"
echo "2) Heroku"
echo "3) Koyeb"
echo "4) Railway"
echo "5) Panel (Manual)"
read -p "Choice [1-5]: " choice

case $choice in
    1)
        echo -e "${GREEN}Deploying to Render...${NC}"
        echo "1. Go to https://render.com"
        echo "2. Click 'New +' → 'Web Service'"
        echo "3. Connect your GitHub repository"
        echo "4. Use these settings:"
        echo "   • Build Command: npm install"
        echo "   • Start Command: npm start"
        echo "   • Plan: Free"
        echo ""
        echo "Environment Variables to add:"
        echo "• KEY: NODE_VERSION VALUE: 18.17.0"
        echo "• KEY: PORT VALUE: 3000"
        echo "• Add other vars from .env.example"
        ;;
    2)
        echo -e "${GREEN}Deploying to Heroku...${NC}"
        echo "1. Install Heroku CLI: curl https://cli-assets.heroku.com/install.sh | sh"
        echo "2. Run: heroku login"
        echo "3. Run: heroku create kih-dah-bot"
        echo "4. Run: git push heroku main"
        echo "5. Set config vars: heroku config:set BOT_NAME='KIH DAH'"
        ;;
    3)
        echo -e "${GREEN}Deploying to Koyeb...${NC}"
        echo "1. Go to https://app.koyeb.com"
        echo "2. Click 'Create App' → 'Deploy from GitHub'"
        echo "3. Select repository"
        echo "4. Use Dockerfile deployment"
        echo "5. Set port to 3000"
        ;;
    4)
        echo -e "${GREEN}Deploying to Railway...${NC}"
        echo "1. Go to https://railway.app"
        echo "2. Click 'New Project' → 'Deploy from GitHub'"
        echo "3. Select repository"
        echo "4. It auto-detects Node.js app"
        ;;
    5)
        echo -e "${YELLOW}Panel Deployment Instructions:${NC}"
        echo ""
        echo "1. Upload all files to your server"
        echo "2. Run: npm install"
        echo "3. Copy .env.example to .env and configure"
        echo "4. For Base64 session:"
        echo "   • Generate session with your generator"
        echo "   • Encode to Base64"
        echo "   • Add to .env as SESSION_ID='your_base64_here'"
        echo "5. Start: npm start"
        echo "6. Access panel at: http://your-server-ip:3000"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Deployment instructions complete!${NC}"
echo "📁 Project structure ready."
echo "⚡ Bot features: autoreactstatus, antilink, anticall, play, antibug, etc."
echo "👑 Owner: GuruTech"
echo ""
echo "Need help? Check README.md for detailed instructions."
