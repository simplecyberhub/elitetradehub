import { storage as storagePromise } from './storage';

interface AlphaVantageQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

interface CryptoQuote {
  '1. From_Currency Code': string;
  '2. From_Currency Name': string;
  '3. To_Currency Code': string;
  '4. To_Currency Name': string;
  '5. Exchange Rate': string;
  '6. Last Refreshed': string;
  '7. Time Zone': string;
  '8. Bid Price': string;
  '9. Ask Price': string;
}

interface ForexQuote {
  '1. From_Currency Code': string;
  '2. From_Currency Name': string;
  '3. To_Currency Code': string;
  '4. To_Currency Name': string;
  '5. Exchange Rate': string;
  '6. Last Refreshed': string;
  '7. Time Zone': string;
  '8. Bid Price': string;
  '9. Ask Price': string;
}

class MarketDataService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';
  private lastUpdate: Map<string, number> = new Map();
  private updateInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ALPHA_VANTAGE_API_KEY not found. Market data will use static prices.');
    }
  }

  private async fetchFromAlphaVantage(params: Record<string, string>) {
    const url = new URL(this.baseUrl);
    url.searchParams.append('apikey', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  private shouldUpdate(symbol: string): boolean {
    const lastUpdate = this.lastUpdate.get(symbol) || 0;
    return Date.now() - lastUpdate > this.updateInterval;
  }

  async updateStockPrice(symbol: string): Promise<number | null> {
    if (!this.apiKey || !this.shouldUpdate(symbol)) {
      return null;
    }

    try {
      const data = await this.fetchFromAlphaVantage({
        function: 'GLOBAL_QUOTE',
        symbol: symbol
      });

      if (data['Error Message'] || data['Note']) {
        console.warn(`Alpha Vantage API limit or error for ${symbol}:`, data['Error Message'] || data['Note']);
        return null;
      }

      const quote = data['Global Quote'] as AlphaVantageQuote;
      if (!quote || !quote['05. price']) {
        return null;
      }

      const price = parseFloat(quote['05. price']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      // Update asset in database
      const storage = await storagePromise;
      const asset = await storage.getAssetBySymbol(symbol);
      if (asset) {
        await storage.updateAsset(asset.id, {
          price: price.toString(),
          change24h: changePercent.toFixed(2)
        });
        this.lastUpdate.set(symbol, Date.now());
      }

      return price;
    } catch (error) {
      console.error(`Error updating stock price for ${symbol}:`, error);
      return null;
    }
  }

  async updateCryptoPrice(symbol: string): Promise<number | null> {
    if (!this.apiKey || !this.shouldUpdate(symbol)) {
      return null;
    }

    try {
      const data = await this.fetchFromAlphaVantage({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: symbol,
        to_currency: 'USD'
      });

      if (data['Error Message'] || data['Note']) {
        console.warn(`Alpha Vantage API limit or error for ${symbol}:`, data['Error Message'] || data['Note']);
        return null;
      }

      const quote = data['Realtime Currency Exchange Rate'] as CryptoQuote;
      if (!quote || !quote['5. Exchange Rate']) {
        return null;
      }

      const price = parseFloat(quote['5. Exchange Rate']);

      // Update asset in database
      const storage = await storagePromise;
      const asset = await storage.getAssetBySymbol(symbol);
      if (asset) {
        await storage.updateAsset(asset.id, {
          price: price.toString()
        });
        this.lastUpdate.set(symbol, Date.now());
      }

      return price;
    } catch (error) {
      console.error(`Error updating crypto price for ${symbol}:`, error);
      return null;
    }
  }

  async updateForexPrice(fromCurrency: string, toCurrency: string = 'USD'): Promise<number | null> {
    const symbol = `${fromCurrency}${toCurrency}`;
    if (!this.apiKey || !this.shouldUpdate(symbol)) {
      return null;
    }

    try {
      const data = await this.fetchFromAlphaVantage({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: fromCurrency,
        to_currency: toCurrency
      });

      if (data['Error Message'] || data['Note']) {
        console.warn(`Alpha Vantage API limit or error for ${symbol}:`, data['Error Message'] || data['Note']);
        return null;
      }

      const quote = data['Realtime Currency Exchange Rate'] as ForexQuote;
      if (!quote || !quote['5. Exchange Rate']) {
        return null;
      }

      const price = parseFloat(quote['5. Exchange Rate']);

      // Update asset in database
      const storage = await storagePromise;
      const asset = await storage.getAssetBySymbol(symbol);
      if (asset) {
        await storage.updateAsset(asset.id, {
          price: price.toString()
        });
        this.lastUpdate.set(symbol, Date.now());
      }

      return price;
    } catch (error) {
      console.error(`Error updating forex price for ${symbol}:`, error);
      return null;
    }
  }

  async updateAllAssetPrices(): Promise<void> {
    if (!this.apiKey) {
      console.log('Skipping market data update - no API key provided');
      return;
    }

    console.log('Starting market data update...');
    
    try {
      const storage = await storagePromise;
      const assets = await storage.getAssets();
      let updateCount = 0;

      for (const asset of assets) {
        // Rate limiting: max 5 calls per minute
        if (updateCount >= 5) {
          console.log('Rate limit reached, stopping updates for this cycle');
          break;
        }

        switch (asset.type) {
          case 'stock':
            const stockPrice = await this.updateStockPrice(asset.symbol);
            if (stockPrice !== null) updateCount++;
            break;
          case 'crypto':
            const cryptoPrice = await this.updateCryptoPrice(asset.symbol);
            if (cryptoPrice !== null) updateCount++;
            break;
          case 'forex':
            // Extract currency pair (e.g., EURUSD -> EUR, USD)
            const fromCurrency = asset.symbol.slice(0, 3);
            const toCurrency = asset.symbol.slice(3, 6);
            const forexPrice = await this.updateForexPrice(fromCurrency, toCurrency);
            if (forexPrice !== null) updateCount++;
            break;
        }

        // Small delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds = 5 calls/minute
      }

      console.log(`Market data update completed. Updated ${updateCount} assets.`);
    } catch (error) {
      console.error('Error during market data update:', error);
    }
  }

  startPeriodicUpdates(): void {
    // Update immediately
    this.updateAllAssetPrices();

    // Then update every 15 minutes
    setInterval(() => {
      this.updateAllAssetPrices();
    }, 15 * 60 * 1000);

    console.log('Market data service started with 15-minute update intervals');
  }
}

export const marketDataService = new MarketDataService();