#!/bin/bash

# Check predictions and results in database

SUPABASE_URL="https://kiefqxdeaikclwkiluop.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWZxeGRlYWlrY2x3a2lsdW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NzE2OTUsImV4cCI6MjA3MzE0NzY5NX0.LrqjynnIwvRbDiT4tnfu2oVNIPtDG48hv6aKNcrrDJ8"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║            Checking Predictions Database                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "1. Checking predictions table..."
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/predictions?select=symbol,model_type,predicted_direction,confidence,created_at&order=created_at.desc&limit=20" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  | python3 -c "
import sys, json
from collections import Counter

data = json.load(sys.stdin)
if not data:
    print('   ⚠️  No predictions found in database')
else:
    print(f'   Total predictions: {len(data)}')

    by_model = Counter(p['model_type'] for p in data)
    print('\n   Predictions by model:')
    for model, count in sorted(by_model.items()):
        print(f'     {model}: {count}')

    by_symbol = Counter(p['symbol'] for p in data)
    print('\n   Predictions by symbol:')
    for symbol, count in sorted(by_symbol.items()):
        print(f'     {symbol}: {count}')

    print('\n   Latest 5 predictions:')
    for p in data[:5]:
        print(f'     {p[\"symbol\"]:6} | {p[\"model_type\"]:20} | {p[\"predicted_direction\"]:8} | {p[\"confidence\"]:5}%')
"

echo ""
echo "2. Checking prediction_results table..."
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/prediction_results?select=prediction_id,actual_direction,was_direction_correct,price_error_percent&limit=100" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  | python3 -c "
import sys, json

data = json.load(sys.stdin)
if not data:
    print('   ⚠️  No prediction results found')
else:
    print(f'   Total results: {len(data)}')

    correct = sum(1 for r in data if r['was_direction_correct'])
    total = len(data)
    accuracy = (correct / total * 100) if total > 0 else 0

    print(f'   Overall: {correct}/{total} correct ({accuracy:.1f}%)')

    avg_error = sum(r['price_error_percent'] for r in data) / total if total > 0 else 0
    print(f'   Average price error: {avg_error:.2f}%')
"

echo ""
