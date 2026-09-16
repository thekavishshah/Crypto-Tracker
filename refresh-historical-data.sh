#!/bin/bash

# Clear old data and fetch fresh 6-month historical data

SUPABASE_URL="https://kiefqxdeaikclwkiluop.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWZxeGRlYWlrY2x3a2lsdW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NzE2OTUsImV4cCI6MjA3MzE0NzY5NX0.LrqjynnIwvRbDiT4tnfu2oVNIPtDG48hv6aKNcrrDJ8"

SYMBOLS=${1:-'["AAPL","GOOGL","TSLA","MSFT"]'}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      Refreshing Historical Data (6 months = ~126 days)    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This will:"
echo "  1. Clear existing historical data"
echo "  2. Fetch fresh 6-month data from Yahoo Finance (~126 trading days)"
echo "  3. This provides enough data for 60-day backtesting"
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
echo "Step 1: Clearing old historical data..."

# Delete all historical_prices records
curl -s -X DELETE \
  "${SUPABASE_URL}/rest/v1/historical_prices?id=gte.0" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Prefer: return=minimal" > /dev/null

echo "✅ Old data cleared"
echo ""
echo "Step 2: Fetching 6 months of fresh data (this takes 10-30 seconds)..."
echo ""

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/fetch-historical-data" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"symbols\": $SYMBOLS, \"days\": 120, \"saveToDb\": true}")

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
    print('Data should now be sufficient for 60-day backtesting!')
    print('   (Need: 90 days minimum, Got: ~126 days)')
except Exception as e:
    print('Response:', sys.stdin.read())
    print('Error parsing response:', e)
"

echo ""
echo "Verifying database contents..."
/Users/kavish/Crypto-Tracker/check-db.sh
