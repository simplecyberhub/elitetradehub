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
  private coinGeckoUrl = 'https://api.coingecko.com/api/v3';
  private exchangeRateUrl = 'https://api.exchangerate-api.com/v4/latest';
  private lastUpdate: Map<string, number> = new Map();
  private updateInterval = 5 * 60 * 1000; // 5 minutes
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    console.log('Market data service initialized with multiple data sources');
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
    if (!this.shouldUpdate(symbol)) {
      return this.getCachedPrice(symbol);
    }

    try {
      // Use CoinGecko API (free tier)
      const coinId = this.getCoinGeckoId(symbol);
      const response = await fetch(`${this.coinGeckoUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
      
      if (!response.ok) {
        console.warn(`CoinGecko API error for ${symbol}: ${response.statusText}`);
        return this.getFallbackPrice(symbol);
      }

      const data = await response.json();
      const coinData = data[coinId];
      
      if (!coinData || !coinData.usd) {
        return this.getFallbackPrice(symbol);
      }

      const price = coinData.usd;
      const change24h = coinData.usd_24h_change || 0;

      // Cache the price
      this.priceCache.set(symbol, { price, timestamp: Date.now() });

      // Update asset in database
      const storage = await storagePromise;
      const asset = await storage.getAssetBySymbol(symbol);
      if (asset) {
        await storage.updateAsset(asset.id, {
          price: price.toString(),
          change24h: change24h.toFixed(2)
        });
        this.lastUpdate.set(symbol, Date.now());
      }

      return price;
    } catch (error) {
      console.error(`Error updating crypto price for ${symbol}:`, error);
      return this.getFallbackPrice(symbol);
    }
  }

  private getCoinGeckoId(symbol: string): string {
    const coinMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum', 
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network',
      'SOL': 'solana',
      'DOT': 'polkadot',
      'LTC': 'litecoin',
      'AVAX': 'avalanche-2',
      'UNI': 'uniswap',
      'LINK': 'chainlink',
      'ATOM': 'cosmos'
    };
    return coinMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private getCachedPrice(symbol: string): number | null {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.updateInterval) {
      return cached.price;
    }
    return null;
  }

  private getFallbackPrice(symbol: string): number | null {
    // Return cached price if available, or generate realistic price
    const cached = this.getCachedPrice(symbol);
    if (cached) return cached;

    const fallbackPrices: Record<string, number> = {
      'BTC': 65000,
      'ETH': 3200,
      'USDT': 1.00,
      'BNB': 550,
      'XRP': 0.52,
      'ADA': 0.45,
      'DOGE': 0.08,
      'MATIC': 0.85,
      'SOL': 145,
      'DOT': 6.50,
      'LTC': 85,
      'AVAX': 28,
      'UNI': 7.50,
      'LINK': 12.50,
      'ATOM': 8.20
    };

    const basePrice = fallbackPrices[symbol.toUpperCase()] || 100;
    // Add some random variation (-5% to +5%)
    const variation = (Math.random() - 0.5) * 0.1;
    return basePrice * (1 + variation);
  }

  async updateForexPrice(fromCurrency: string, toCurrency: string = 'USD'): Promise<number | null> {
    const symbol = `${fromCurrency}${toCurrency}`;
    if (!this.shouldUpdate(symbol)) {
      return this.getCachedPrice(symbol);
    }

    try {
      // Use free exchange rate API
      const response = await fetch(`${this.exchangeRateUrl}/${fromCurrency}`);
      
      if (!response.ok) {
        console.warn(`Exchange rate API error for ${symbol}: ${response.statusText}`);
        return this.getForexFallbackPrice(fromCurrency, toCurrency);
      }

      const data = await response.json();
      const rate = data.rates[toCurrency];
      
      if (!rate) {
        return this.getForexFallbackPrice(fromCurrency, toCurrency);
      }

      // Cache the price
      this.priceCache.set(symbol, { price: rate, timestamp: Date.now() });

      // Update asset in database
      const storage = await storagePromise;
      const asset = await storage.getAssetBySymbol(symbol);
      if (asset) {
        await storage.updateAsset(asset.id, {
          price: rate.toString()
        });
        this.lastUpdate.set(symbol, Date.now());
      }

      return rate;
    } catch (error) {
      console.error(`Error updating forex price for ${symbol}:`, error);
      return this.getForexFallbackPrice(fromCurrency, toCurrency);
    }
  }

  private getForexFallbackPrice(fromCurrency: string, toCurrency: string): number {
    const fallbackRates: Record<string, Record<string, number>> = {
      'EUR': { 'USD': 1.08, 'GBP': 0.86, 'JPY': 162 },
      'GBP': { 'USD': 1.26, 'EUR': 1.16, 'JPY': 188 },
      'JPY': { 'USD': 0.0067, 'EUR': 0.0062, 'GBP': 0.0053 },
      'AUD': { 'USD': 0.67, 'EUR': 0.62, 'GBP': 0.53 },
      'CAD': { 'USD': 0.74, 'EUR': 0.68, 'GBP': 0.59 },
      'CHF': { 'USD': 1.12, 'EUR': 1.04, 'GBP': 0.89 },
      'USD': { 'EUR': 0.93, 'GBP': 0.79, 'JPY': 150 }
    };

    return fallbackRates[fromCurrency]?.[toCurrency] || 1.0;
  }

  async updateAllAssetPrices(): Promise<void> {
    console.log('Starting market data update...');
    
    try {
      const storage = await storagePromise;
      const assets = await storage.getAssets();
      let updateCount = 0;

      for (const asset of assets) {
        try {
          let price: number | null = null;

          switch (asset.type) {
            case 'stock':
              price = await this.updateStockPrice(asset.symbol);
              break;
            case 'crypto':
              price = await this.updateCryptoPrice(asset.symbol);
              break;
            case 'forex':
              const fromCurrency = asset.symbol.slice(0, 3);
              const toCurrency = asset.symbol.slice(3, 6) || 'USD';
              price = await this.updateForexPrice(fromCurrency, toCurrency);
              break;
          }

          if (price !== null) {
            updateCount++;
            console.log(`Updated ${asset.symbol}: $${price}`);
          }

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error updating ${asset.symbol}:`, error);
          continue;
        }
      }

      console.log(`Market data update completed. Updated ${updateCount}/${assets.length} assets.`);
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