import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchHistoricalPrices(symbol: string, days: number = 90) {
  try {
    // Yahoo Finance historical data endpoint
    // range: 6mo = 6 months (to get ~126 trading days), interval: 1d = 1 day
    // We need at least 90 trading days for backtest (30-day lookback + 60-day test window)
    const range = days > 90 ? '6mo' : '3mo';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`;

    console.log(`Fetching ${symbol} from ${url}`);

    // Add headers to mimic browser request and avoid rate limiting
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com',
        'Origin': 'https://finance.yahoo.com',
      }
    });

    console.log(`Response status for ${symbol}: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} for ${symbol}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      console.error(`No result in response for ${symbol}:`, JSON.stringify(data).substring(0, 200));
      throw new Error(`No historical data found for ${symbol}`);
    }

    const timestamps = result.timestamp;
    const quotes = result.indicators?.quote?.[0];

    if (!timestamps || !quotes) {
      throw new Error(`Invalid data structure for ${symbol}`);
    }

    // Convert to array of daily prices
    const historicalData = timestamps.map((timestamp: number, index: number) => {
      const date = new Date(timestamp * 1000);
      return {
        symbol: symbol.toUpperCase(),
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        open: quotes.open[index] ? Number(quotes.open[index].toFixed(2)) : null,
        high: quotes.high[index] ? Number(quotes.high[index].toFixed(2)) : null,
        low: quotes.low[index] ? Number(quotes.low[index].toFixed(2)) : null,
        close: quotes.close[index] ? Number(quotes.close[index].toFixed(2)) : null,
        price: quotes.close[index] ? Number(quotes.close[index].toFixed(2)) : null,
        volume: quotes.volume[index] || 0,
      };
    }).filter((item: any) => item.close !== null); // Filter out null prices

    console.log(`Successfully fetched ${historicalData.length} records for ${symbol}`);
    return historicalData;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
}

// Helper to add delay between requests to avoid rate limiting
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, days = 90, saveToDb = false } = await req.json();

    if (!symbols || !Array.isArray(symbols)) {
      throw new Error('Symbols array is required');
    }

    console.log(`Fetching ${days} days of historical data for symbols: ${symbols.join(', ')}`);

    // Fetch sequentially with delays to avoid rate limiting
    const allHistoricalData = [];
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      console.log(`Fetching ${i + 1}/${symbols.length}: ${symbol}`);

      try {
        const data = await fetchHistoricalPrices(symbol, days);
        allHistoricalData.push(data);

        // Add delay between requests (except for last one)
        if (i < symbols.length - 1) {
          console.log('Waiting 1 second before next request...');
          await delay(1000);
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbol}, continuing...`, error);
        // Continue with other symbols even if one fails
      }
    }

    // Flatten array of arrays
    const flattenedData = allHistoricalData.flat();

    // Optionally save to database
    if (saveToDb) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Insert historical data (upsert to avoid duplicates)
      const { error: insertError } = await supabase
        .from('historical_prices')
        .upsert(flattenedData, { onConflict: 'symbol,date' });

      if (insertError) {
        console.error('Error saving historical data:', insertError);
        throw insertError;
      }

      console.log(`Successfully saved ${flattenedData.length} historical price records`);
    }

    return new Response(
      JSON.stringify({
        historicalData: flattenedData,
        count: flattenedData.length,
        symbols: symbols,
        days: days
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-historical-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
