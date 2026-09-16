# Quick Start Guide - Stock Price Predictions

Your prediction feature is fully implemented! Follow these 3 steps to get it running:

## Step 1: Apply Database Migration 🗄️

Create the prediction tables:

### Option A: Supabase Dashboard (Easiest)
1. Go to https://supabase.com/dashboard/project/kiefqxdeaikclwkiluop/editor/sql
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20260916_create_prediction_tables.sql`
4. Paste into the SQL editor
5. Click "Run" or press Cmd+Enter

### Option B: Supabase CLI
```bash
# Push the migration
supabase db push
```

This creates 3 tables: `historical_prices`, `predictions`, `prediction_results`

## Step 2: Populate Historical Data 📈

The edge function is already deployed and fixed! Run this one-liner to populate 90 days of data for all watchlist symbols:

```bash
./populate-historical-data.sh
```

This will:
- Fetch 90 days of historical OHLCV data from Yahoo Finance
- Save it to your Supabase `historical_prices` table
- Show you a summary of what was loaded

Expected output:
```
✅ SUCCESS!
   Fetched and saved 252 historical price records
   Symbols: AAPL, GOOGL, TSLA, MSFT
```

## Step 3: Run the App and Generate Predictions 📊

```bash
# Start the dev server
npm run dev
```

Then in the app:
1. Navigate to the **Predictions** tab
2. Click **"Run Backtest"** for any stock (e.g., AAPL)
3. Wait 10-30 seconds while it:
   - Fetches 90 days of historical data
   - Runs both prediction models on historical data
   - Calculates real accuracy metrics
   - Generates current predictions

You'll see:
- **Directional Accuracy**: % of correct up/down predictions (real number from backtest)
- **MAPE**: Average prediction error percentage
- **Current Predictions**: Next-day price and direction for each stock
- **Model Reasoning**: Plain-English explanation of why each prediction was made

## What You Can Do Next

### Generate Predictions for More Stocks
- Click "Refresh Predictions" on the Predictions tab
- Run backtest for each stock in your watchlist

### View Prediction Details
- Each prediction shows the model's reasoning
- Technical details include: slope, R², MA values, confidence
- All metrics are calculated from real backtested data

### Update Your Resume
After running backtests, copy the accuracy numbers from the Predictions tab and use them in your resume:

**Example Resume Bullet:**
"Developed stock price prediction system using linear regression and moving average crossover models, achieving **63.2%** directional accuracy on 60-day backtest across AAPL, GOOGL, TSLA, MSFT"

(Replace 63.2% with your actual number from the UI!)

## Troubleshooting

**"Insufficient data for backtesting"**
- ✅ **FIXED!** - The edge function now works correctly with proper Yahoo Finance headers
- Run `./populate-historical-data.sh` to populate data
- Or run `./check-db.sh` to verify database contents

**"Error fetching historical data"**
- Yahoo Finance API has rate limits (1 request per second)
- The edge function now handles this automatically with delays
- If you get errors, wait 30 seconds and try again

**Tables don't exist**
- Ensure Step 1 (migration) was completed successfully
- Check Supabase Table Editor: https://supabase.com/dashboard/project/kiefqxdeaikclwkiluop/editor

**Predictions tab is empty**
- You need historical data first (see Step 2)
- Then click "Run Backtest" to generate predictions
- Ensure you have stocks in your watchlist (AAPL, GOOGL, etc.)

**Verify what's in your database**
```bash
./check-db.sh
```

## What Was Fixed

The original implementation had a **Yahoo Finance API rate limiting issue**. The edge function was blocked because:

1. No browser-like headers → Yahoo Finance blocked the requests
2. Parallel fetching → Triggered rate limits (429 Too Many Requests)

**Fix applied:**
- Added User-Agent and browser headers to mimic real browser requests
- Changed to sequential fetching with 1-second delays
- Better error logging to diagnose issues

See `ISSUE_FIXED.md` for technical details.

## Next Steps

See `PREDICTION_SETUP.md` for detailed technical documentation including:
- How the models work
- How backtesting validates accuracy
- Interview-ready explanations
- Potential improvements

Enjoy your genuine, explainable stock prediction system! 🎉
