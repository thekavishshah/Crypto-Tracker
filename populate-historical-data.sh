#!/bin/bash

# Populate historical data for all watchlist symbols

SUPABASE_URL="https://kiefqxdeaikclwkiluop.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWZxeGRlYWlrY2x3a2lsdW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NzE2OTUsImV4cCI6MjA3MzE0NzY5NX0.LrqjynnIwvRbDiT4tnfu2oVNIPtDG48hv6aKNcrrDJ8"

# Default symbols from your watchlist
SYMBOLS=${1:-'["AAPL","GOOGL","TSLA","MSFT"]'}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Populating Historical Data for Stock Price Predictions   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This will fetch 90 days of historical price data from Yahoo Finance"
echo "and save it to your Supabase database."
echo ""
echo "Symbols: $SYMBOLS"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Fetching historical data (this may take 10-20 seconds)..."
echo ""

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/fetch-historical-data" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"symbols\": $SYMBOLS, \"days\": 90, \"saveToDb\": true}")

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
    echo "❌ Error occurred:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Parse response
echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    count = data.get('count', 0)
    symbols = data.get('symbols', [])

    print('✅ SUCCESS!')
    print(f'   Fetched and saved {count} historical price records')
    print(f'   Symbols: {', '.join(symbols)}')
    print('')
    print('You can now:')
    print('  1. Run npm run dev')
    print('  2. Go to Predictions tab')
    print('  3. Click \"Run Backtest\" to generate accuracy metrics')
except Exception as e:
    print('Response:', sys.stdin.read())
    print('Error parsing response:', e)
"

echo ""
echo "Checking database..."
/Users/kavish/Crypto-Tracker/check-db.sh
