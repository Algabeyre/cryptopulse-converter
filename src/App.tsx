import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Coins,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from './lib/utils';

// Types
interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  sparkline_in_7d: { price: number[] };
}

interface FiatCurrency {
  code: string;
  name: string;
  symbol: string;
}

const FIAT_CURRENCIES: FiatCurrency[] = [
  { code: 'usd', name: 'US Dollar', symbol: '$' },
  { code: 'eur', name: 'Euro', symbol: '€' },
  { code: 'gbp', name: 'British Pound', symbol: '£' },
  { code: 'jpy', name: 'Japanese Yen', symbol: '¥' },
  { code: 'aud', name: 'Australian Dollar', symbol: 'A$' },
];

export default function App() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Conversion state
  const [amount, setAmount] = useState<number>(1);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('bitcoin');
  const [selectedFiat, setSelectedFiat] = useState<string>('usd');
  const [isCryptoToFiat, setIsCryptoToFiat] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: selectedFiat,
            order: 'market_cap_desc',
            per_page: 20,
            page: 1,
            sparkline: true,
            price_change_percentage: '24h',
          },
        }
      );
      setCryptos(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching crypto data:', err);
      setError('Failed to fetch real-time prices. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedFiat]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const currentCrypto = cryptos.find(c => c.id === selectedCrypto);
  const currentFiat = FIAT_CURRENCIES.find(f => f.code === selectedFiat);

  const convert = () => {
    if (!currentCrypto) return 0;
    if (isCryptoToFiat) {
      return amount * currentCrypto.current_price;
    } else {
      return amount / currentCrypto.current_price;
    }
  };

  const chartData = currentCrypto?.sparkline_in_7d.price.map((price, index) => ({
    time: index,
    price: price,
  })) || [];

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Coins className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">CryptoPulse</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <button 
              onClick={fetchPrices}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Converter & Chart */}
        <div className="lg:col-span-8 space-y-6">
          {/* Converter Card */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Converter</h2>
              <div className="flex items-center gap-2 text-slate-400">
                <Info className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Real-time Rates</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* From Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  {isCryptoToFiat ? 'From Crypto' : 'From Fiat'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isCryptoToFiat ? (
                      <select 
                        value={selectedCrypto}
                        onChange={(e) => setSelectedCrypto(e.target.value)}
                        className="bg-transparent font-bold text-slate-700 cursor-pointer focus:outline-none"
                      >
                        {cryptos.map(c => (
                          <option key={c.id} value={c.id}>{c.symbol.toUpperCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <select 
                        value={selectedFiat}
                        onChange={(e) => setSelectedFiat(e.target.value)}
                        className="bg-transparent font-bold text-slate-700 cursor-pointer focus:outline-none"
                      >
                        {FIAT_CURRENCIES.map(f => (
                          <option key={f.code} value={f.code}>{f.code.toUpperCase()}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <button 
                onClick={() => setIsCryptoToFiat(!isCryptoToFiat)}
                className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-6 md:mt-0"
              >
                <ArrowRightLeft className="w-6 h-6" />
              </button>

              {/* To Input (Result) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  {isCryptoToFiat ? 'To Fiat' : 'To Crypto'}
                </label>
                <div className="relative">
                  <div className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-4 text-xl font-bold text-indigo-700">
                    {convert().toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {!isCryptoToFiat ? (
                      <select 
                        value={selectedCrypto}
                        onChange={(e) => setSelectedCrypto(e.target.value)}
                        className="bg-transparent font-bold text-indigo-700 cursor-pointer focus:outline-none"
                      >
                        {cryptos.map(c => (
                          <option key={c.id} value={c.id}>{c.symbol.toUpperCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <select 
                        value={selectedFiat}
                        onChange={(e) => setSelectedFiat(e.target.value)}
                        className="bg-transparent font-bold text-indigo-700 cursor-pointer focus:outline-none"
                      >
                        {FIAT_CURRENCIES.map(f => (
                          <option key={f.code} value={f.code}>{f.code.toUpperCase()}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Rate</span>
                <span className="text-lg font-bold">1 {currentCrypto?.symbol.toUpperCase()} = {currentFiat?.symbol}{currentCrypto?.current_price.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">24h Change</span>
                <div className={cn(
                  "flex items-center gap-1 text-lg font-bold",
                  (currentCrypto?.price_change_percentage_24h || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {(currentCrypto?.price_change_percentage_24h || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(currentCrypto?.price_change_percentage_24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </section>

          {/* Chart Card */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold">{currentCrypto?.name} Price History</h2>
                <p className="text-sm text-slate-500">Last 7 days performance</p>
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                7D
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    hide 
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price</p>
                            <p className="text-lg font-bold text-indigo-600">${payload[0].value?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right Column: Market Overview */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Market Overview</h2>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-4">
              {loading && cryptos.length === 0 ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-slate-100 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-50 rounded w-1/4" />
                    </div>
                    <div className="w-16 h-8 bg-slate-100 rounded" />
                  </div>
                ))
              ) : error ? (
                <div className="text-center py-10 text-rose-500">
                  <p>{error}</p>
                </div>
              ) : (
                cryptos.map((crypto) => (
                  <motion.div 
                    key={crypto.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer group",
                      selectedCrypto === crypto.id ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50 border border-transparent"
                    )}
                    onClick={() => setSelectedCrypto(crypto.id)}
                  >
                    <img src={crypto.image} alt={crypto.name} className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-sm truncate">{crypto.name}</p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{crypto.symbol}</span>
                      </div>
                      <p className="text-xs text-slate-500">${crypto.current_price.toLocaleString()}</p>
                    </div>
                    <div className={cn(
                      "text-xs font-bold px-2 py-1 rounded-lg",
                      crypto.price_change_percentage_24h >= 0 
                        ? "text-emerald-600 bg-emerald-50" 
                        : "text-rose-600 bg-rose-50"
                    )}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                      {crypto.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400 text-sm">
        <p>© 2026 CryptoPulse. Data provided by CoinGecko API.</p>
        <p className="mt-2">Real-time market data for informational purposes only.</p>
      </footer>
    </div>
  );
}
