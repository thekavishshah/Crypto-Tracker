#!/bin/bash

# Check if historical_prices table has data

SUPABASE_URL="https://kiefqxdeaikclwkiluop.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWZxeGRlYWlrY2x3a2lsdW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NzE2OTUsImV4cCI6MjA3MzE0NzY5NX0.LrqjynnIwvRbDiT4tnfu2oVNIPtDG48hv6aKNcrrDJ8"

echo "Checking historical_prices table..."
echo ""

# Query to get count per symbol
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/historical_prices?select=symbol,date&order=symbol.asc,date.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
if not data:
    print('Database is EMPTY - no records found')
else:
    from collections import Counter
    symbols = [row['symbol'] for row in data]
    counts = Counter(symbols)
    print(f'Total records: {len(data)}')
    print('\nRecords per symbol:')
    for symbol, count in sorted(counts.items()):
        print(f'  {symbol}: {count} days')

    # Show latest dates
    print('\nLatest dates per symbol:')
    latest = {}
    for row in data:
        if row['symbol'] not in latest:
            latest[row['symbol']] = row['date']
    for symbol in sorted(latest.keys()):
        print(f'  {symbol}: {latest[symbol]}')
"
