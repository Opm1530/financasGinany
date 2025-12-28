
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get("ticker");

    if (!ticker) {
        return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    try {
        // Strategy 1: Brapi (Best for B3)
        // Note: Free token is limited
        const brapiResponse = await fetch(`https://brapi.dev/api/quote/${ticker}?token=public&range=1d&interval=1d`, {
            next: { revalidate: 60 }
        });

        if (brapiResponse.ok) {
            const data = await brapiResponse.json();
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return NextResponse.json({
                    symbol: result.symbol,
                    price: result.regularMarketPrice,
                    changePercent: result.regularMarketChangePercent
                });
            }
        }
    } catch (error) {
        // Silently ignore Brapi error to try fallback
    }

    try {
        // Strategy 2: Yahoo Finance (Best for Crypto & International)
        // Mapping: Add .SA for B3 stocks if not present
        let yahooTicker = ticker;
        const isB3 = /^[A-Z]{4}\d{1,2}$/.test(ticker); // Simple regex for standard B3 tickers (PETR4, BCFF11)
        if (isB3) yahooTicker = `${ticker}.SA`;

        const yahooResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=1d`, {
            headers: {
                "User-Agent": "Mozilla/5.0" // Required by Yahoo
            },
            next: { revalidate: 60 }
        });

        if (yahooResponse.ok) {
            const data = await yahooResponse.json();
            const result = data.chart?.result?.[0];

            if (result && result.meta) {
                return NextResponse.json({
                    symbol: result.meta.symbol,
                    price: result.meta.regularMarketPrice,
                    changePercent: result.meta.regularMarketChangePercent || 0 // Yahoo doesn't always send change % in chart endpoint easily, 
                    // but usually calculating it from prevClose is better:
                    // (price - chartPreviousClose) / chartPreviousClose * 100
                });
            }
        }
    } catch (error) {
        // Ignore Yahoo error
    }

    // Default Fallback
    return NextResponse.json({ price: null, changePercent: 0 });
}
