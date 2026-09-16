# Stock Price Prediction Feature - Setup Guide

This document explains how to set up and use the price prediction feature in your Stock Tracker app.

## Overview

The prediction system uses two explainable machine learning models:

1. **Linear Regression Model**: Analyzes 30-day price trends using ordinary least squares regression
2. **Moving Average Crossover Model**: Compares 7-day and 21-day moving averages to detect bullish/bearish signals

Both models are backtested on historical data to provide **real, honest accuracy metrics**.

## Setup Instructions

### Step 1: Apply Database Migration

Run the Supabase migration to create the required tables:

```bash
# If using Supabase CLI
supabase db push

# OR manually apply the SQL file
# Copy the contents of supabase/migrations/20260916_create_prediction_tables.sql
# and run it in your Supabase SQL editor
```

This creates three tables:
- `historical_prices`: Stores daily price history (90 days per symbol)
- `predictions`: Stores model predictions with reasoning
- `prediction_results`: Tracks actual outcomes vs predictions for accuracy calculation

### Step 2: Deploy Edge Functions

Deploy the historical data fetcher:

```bash
supabase functions deploy fetch-historical-data
```

This function fetches 90 days of historical data from Yahoo Finance.

### Step 3: Initialize the Prediction System

**Option A: Via UI (Recommended)**

1. Start your development server: `npm run dev`
2. Navigate to the Predictions tab
3. Click "Run Backtest" for any symbol in your watchlist
4. The system will:
   - Fetch 90 days of historical data from Yahoo Finance
   - Store it in `historical_prices` table
   - Run backtests on both models
   - Generate current predictions
   - Display real accuracy metrics

**Option B: Via Script (Advanced)**

Create and run an initialization script:

```typescript
import { initializePredictionSystem } from './src/scripts/initializePredictions';

// Initialize with default symbols (AAPL, GOOGL, TSLA, MSFT)
await initializePredictionSystem();

// OR specify your own symbols
await initializePredictionSystem(['AAPL', 'NVDA', 'META']);
```

## How It Works

### Data Flow

1. **Historical Data Collection**
   - Yahoo Finance API provides 90 days of OHLCV data per symbol
   - Data is stored in Supabase `historical_prices` table
   - Updates can be triggered manually or scheduled

2. **Prediction Generation**
   - Linear Regression: Uses last 30 days to fit trend line → predicts next day price
   - MA Crossover: Compares 7/21-day MAs → predicts up/down/neutral direction
   - Both models output: predicted price, direction, confidence, and human-readable reasoning

3. **Backtesting**
   - For each day in the past 60 days:
     - Make prediction using only prior data (prevents lookahead bias)
     - Compare to actual next-day price
   - Calculate:
     - Directional accuracy (% of correct up/down calls)
     - MAPE (Mean Absolute Percentage Error for price predictions)

4. **Results Storage**
   - Predictions saved to `predictions` table
   - Actual outcomes saved to `prediction_results` table
   - Accuracy metrics calculated on-demand from real data

## Using the Predictions Tab

The Predictions tab shows:

### Model Performance
- **Directional Accuracy**: Percentage of correct up/down predictions
- **MAPE**: Average percentage error in price predictions
- **Correct/Total**: Number of correct predictions out of total tested

### Current Predictions
For each stock:
- **Predicted Direction**: Up, Down, or Neutral
- **Predicted Price**: Next-day price estimate
- **Confidence**: Model confidence (0-100%)
- **Reasoning**: Plain-English explanation of why the model made this prediction
- **Technical Details**: Slope, R², MA values, etc.

### Actions
- **Refresh Predictions**: Generate new predictions based on latest data
- **Run Backtest**: Re-run backtesting with current historical data

## Interview-Ready Explanations

### Linear Regression Model
"I implemented a linear regression model that analyzes the last 30 days of price data. It fits a trend line using ordinary least squares, then extrapolates to predict the next day's price. The R² value indicates model fit quality, which I use as a confidence metric. The model outputs the slope (daily price change rate) and predicted price with human-readable reasoning."

**Accuracy**: Check the Predictions tab for live metrics (typically 50-65% directional accuracy)

### MA Crossover Model
"I built a moving average crossover strategy comparing 7-day and 21-day moving averages. When the short-term MA crosses above the long-term MA, it signals a bullish trend (predict up). When it crosses below, it's bearish (predict down). The separation between the MAs indicates signal strength, which I map to confidence levels."

**Accuracy**: Check the Predictions tab for live metrics (typically 45-60% directional accuracy)

### Backtesting Methodology
"I validated both models using walk-forward backtesting on 60 days of historical data. For each test day, I only use prior data to make predictions—no lookahead bias. I then compare predictions to actual outcomes and calculate directional accuracy and MAPE. This gives honest, verifiable performance metrics stored in the database."

## Data Sources

- **Yahoo Finance API**: Free, publicly available historical stock data
- **Update Frequency**: Manual refresh (can be automated with cron jobs)
- **Coverage**: 90 days of daily OHLCV data per symbol

## Limitations & Future Improvements

### Current Limitations
- Predictions are for next-day only (short-term)
- Models are intentionally simple (linear regression, MA crossover)
- No intraday predictions (daily closes only)
- Yahoo Finance API may have rate limits or reliability issues

### Potential Improvements
- Add ARIMA or Prophet for better time-series forecasting
- Implement ensemble predictions (combine multiple models)
- Add sentiment analysis from news/social media
- Schedule automatic daily predictions and accuracy tracking
- Add technical indicators (RSI, MACD, Bollinger Bands)

## Troubleshooting

### "No historical data found"
- Ensure migration was applied: Check Supabase dashboard for tables
- Run the historical data fetcher manually
- Check console for API errors

### "Insufficient data for backtesting"
- Ensure you have at least 90 days of data per symbol
- Re-run historical data fetch with `days: 90` parameter

### Accuracy metrics show 0%
- No backtests have been run yet
- Click "Run Backtest" on a symbol to generate metrics

### Predictions not appearing
- Historical data must exist before predictions can be generated
- Use "Generate Predictions" button to create new predictions

## Resume Bullets (Update After Running Backtests)

Once you've run the backtests, update these with your actual numbers from the Predictions tab:

✅ "Developed stock price prediction system using linear regression and moving average crossover models, achieving **X%** directional accuracy on 60-day backtest across AAPL, GOOGL, TSLA, MSFT"

✅ "Implemented walk-forward backtesting framework validating model predictions against historical data, calculating MAPE of **Y%** and storing **Z** prediction outcomes in PostgreSQL"

✅ "Built full-stack prediction pipeline: Yahoo Finance API integration, Supabase Edge Functions for data ingestion, TypeScript models using regression.js, React UI displaying model reasoning and live accuracy metrics"

Replace **X**, **Y**, **Z** with your actual metrics from the Predictions tab!
