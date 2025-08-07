#!/bin/bash

echo "🚀 Setting up environment files for Eleve monorepo..."

# Check if Supabase URL and key are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./setup-env.sh <SUPABASE_URL> <SUPABASE_ANON_KEY>"
    echo "Example: ./setup-env.sh https://your-project.supabase.co your-anon-key-here"
    exit 1
fi

SUPABASE_URL=$1
SUPABASE_ANON_KEY=$2

# Create mobile .env
cat > apps/mobile/.env << EOF
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

# Create web .env.local
cat > apps/web/.env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

echo "✅ Environment files created successfully!"
echo "📱 Mobile env: apps/mobile/.env"
echo "🌐 Web env: apps/web/.env.local"
echo ""
echo "You can now run:"
echo "  npm run dev        # Start both apps"
echo "  npm run dev:web    # Start web app only"
echo "  npm run dev:mobile # Start mobile app only" 