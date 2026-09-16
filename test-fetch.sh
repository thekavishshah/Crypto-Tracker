#!/bin/bash

# Test the fetch-historical-data edge function

SUPABASE_URL="https://kiefqxdeaikclwkiluop.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWZxeGRlYWlrY2x3a2lsdW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NzE2OTUsImV4cCI6MjA3MzE0NzY5NX0.LrqjynnIwvRbDiT4tnfu2oVNIPtDG48hv6aKNcrrDJ8"

echo "Testing fetch-historical-data edge function..."
echo ""

# Test with AAPL only
echo "Test 1: Fetching AAPL (90 days, saveToDb: true)"
curl -X POST \
  "${SUPABASE_URL}/functions/v1/fetch-historical-data" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL"], "days": 90, "saveToDb": true}' \
  2>&1

echo -e "\n\n---\n"

# Test with saveToDb: false (just return data, don't save)
echo "Test 2: Fetching AAPL (90 days, saveToDb: false - just return data)"
curl -X POST \
  "${SUPABASE_URL}/functions/v1/fetch-historical-data" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL"], "days": 90, "saveToDb": false}' \
  2>&1

echo -e "\n\n---\n"
echo "Done!"
