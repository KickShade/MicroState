import { useState, useEffect } from 'react';
import { Settings, LogOut, TrendingUp, TrendingDown, ChevronDown, Home } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedMarket, setSelectedMarket] = useState('BTCUSDT');
  const [isLive, setIsLive] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  const [priceData] = useState([
    { day: 'Mon', price: 43100 },
    { day: 'Tue', price: 43200 },
    { day: 'Wed', price: 43150 },
    { day: 'Thu', price: 43300 },
    { day: 'Fri', price: 43250 },
    { day: 'Sat', price: 43280 },
    { day: 'Sun', price: 43251.50 },
  ]);

  const [metrics] = useState({
    midPrice: 43251.50,
    spread: 0.01,
    spreadChange: -5,
    imbalance: 12.3,
    prediction: 'UP',
    confidence: 68,
  });

  const [orderBook] = useState({
    asks: [
      { price: 120036.50, volume: 2.5 },
      { price: 120036.40, volume: 1.8 },
      { price: 120036.30, volume: 2.1 },
    ],
    bids: [
      { price: 120036.20, volume: 2.0 },
      { price: 120036.10, volume: 2.8 },
      { price: 120036.00, volume: 2.3 },
    ],
  });

  const [features] = useState([
    { name: 'Bid Volume L5', value: '125.3 BTC' },
    { name: 'Ask Volume L5', value: '118.7 BTC' },
    { name: 'OB Imbalance', value: '+5.3%' },
    { name: 'Rolling Vol', value: '0.023%' },
  ]);

  const [events] = useState([
    { time: '12:34:56.123', type: 'MARKET ORDER', desc: 'BUY 2.3 BTC @ 120036.00' },
    { time: '12:34:55.891', type: 'LIMIT ORDER', desc: 'SELL 1.8 BTC @ 120037.50' },
    { time: '12:34:55.654', type: 'CANCEL', desc: 'Level 120036.20 removed' },
    { time: '12:34:55.432', type: 'PREDICTION', desc: 'Model predicts UP (72% conf)' },
  ]);

  const [microstructure1s] = useState({
    bidAskSpread: '0.01 bp',
    imbalanceRatio: '1.23',
    topBidVolume: '125.3 BTC',
    topAskVolume: '118.7 BTC',
    lastUpdate: '12:34:56.234',
  });

  const [priceContext15m] = useState({
    priceChange: '+0.42%',
    highPrice: '43,450',
    lowPrice: '43,100',
    volatility: '0.023%',
    trend: 'Uptrend',
  });

  const [combinedInterpretation] = useState({
    signal: 'BULLISH',
    strength: 'Strong',
    confidence: '72%',
    reasoning: 'Strong buy pressure with sustained uptrend',
    recommendation: 'Watch for continuation',
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="grid grid-cols-6 gap-6">
        
        {/* Sidebar */}
        <div className="col-span-1">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-fit sticky top-6">
            <div className="space-y-8">
              <h1 className="text-xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                MicroState
              </h1>
              
              <nav className="space-y-4">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-teal-500/20 text-teal-400 rounded-lg transition">
                  <Home className="w-5 h-5" />
                  <span className="text-sm">Dashboard</span>
                </button>
              </nav>

              {/* User Profile Card */}
              <div className="border-t border-slate-700/50 pt-6">
                <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="p-1 hover:bg-slate-700/50 rounded transition"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
                          <div className="px-4 py-3 border-b border-slate-700">
                            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
                          >
                            Settings
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              handleLogout();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition flex items-center gap-2"
                          >
                            <LogOut className="w-3 h-3" /> Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-5 space-y-6">
          
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-black">Market Dynamics</h2>
              <p className="text-slate-400 text-sm mt-1">Real-time order book analysis</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm font-medium">BTCUSDT</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm font-medium">{isLive ? 'LIVE' : 'OFFLINE'}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics - 4 Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Mid Price</p>
              <p className="text-3xl font-black">${metrics.midPrice.toLocaleString()}</p>
              <p className="text-teal-400 text-xs mt-3 font-semibold">+0.02%</p>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Spread</p>
              <p className="text-3xl font-black">{metrics.spread} bp</p>
              <p className="text-red-400 text-xs mt-3 flex items-center gap-1 font-semibold">
                <TrendingDown className="w-3 h-3" /> {metrics.spreadChange}%
              </p>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Imbalance</p>
              <p className="text-3xl font-black text-teal-400">+{metrics.imbalance}%</p>
              <p className="text-slate-400 text-xs mt-3 font-semibold">Bullish</p>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Prediction</p>
              <p className="text-3xl font-black text-teal-400">{metrics.prediction}</p>
              <p className="text-slate-400 text-xs mt-3 font-semibold">{metrics.confidence}% Confidence</p>
            </div>
          </div>

          {/* Main Content Row - Chart + Order Book */}
          <div className="grid grid-cols-3 gap-4">
            {/* Price Chart - 2 cols */}
            <div className="col-span-2 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-black mb-4">Price & Prediction</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['dataMin - 50', 'dataMax + 50']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Line type="monotone" dataKey="price" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Order Book */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-black mb-4">Order Book</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs mb-3 font-medium">ASKS (Top 3)</p>
                  <div className="space-y-2">
                    {orderBook.asks.map((ask, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-red-400 text-xs font-medium">${ask.price.toLocaleString()}</span>
                        <span className="text-slate-300 text-xs">{ask.volume} BTC</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-slate-600"></div>
                <div>
                  <p className="text-slate-400 text-xs mb-3 font-medium">BIDS (Top 3)</p>
                  <div className="space-y-2">
                    {orderBook.bids.map((bid, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-green-400 text-xs font-medium">${bid.price.toLocaleString()}</span>
                        <span className="text-slate-300 text-xs">{bid.volume} BTC</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Analysis Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Microstructure (1s) */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black">Microstructure</h3>
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">1s</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Bid/Ask Spread</span>
                  <span className="font-semibold text-teal-400 text-xs">{microstructure1s.bidAskSpread}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Imbalance</span>
                  <span className="font-semibold text-teal-400 text-xs">{microstructure1s.imbalanceRatio}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Top Bid Vol</span>
                  <span className="font-semibold text-teal-400 text-xs">{microstructure1s.topBidVolume}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Top Ask Vol</span>
                  <span className="font-semibold text-teal-400 text-xs">{microstructure1s.topAskVolume}</span>
                </div>
                <div className="text-slate-500 text-xs pt-2 font-medium border-t border-slate-700/30">
                  Update: {microstructure1s.lastUpdate}
                </div>
              </div>
            </div>

            {/* Price Context (15m) */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black">Price Context</h3>
                <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">15m</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Price Change</span>
                  <span className="font-semibold text-green-400 text-xs">{priceContext15m.priceChange}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">24H High</span>
                  <span className="font-semibold text-teal-400 text-xs">${priceContext15m.highPrice}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">24H Low</span>
                  <span className="font-semibold text-orange-400 text-xs">${priceContext15m.lowPrice}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Volatility</span>
                  <span className="font-semibold text-slate-300 text-xs">{priceContext15m.volatility}</span>
                </div>
                <div className="text-teal-400 text-xs pt-2 font-semibold border-t border-slate-700/30">
                  Trend: {priceContext15m.trend}
                </div>
              </div>
            </div>

            {/* Combined Interpretation */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black">Interpretation</h3>
                <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded">AI</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Signal</span>
                  <span className={`font-semibold text-xs px-2 py-1 rounded ${
                    combinedInterpretation.signal === 'BULLISH' 
                      ? 'text-green-400 bg-green-500/10' 
                      : 'text-red-400 bg-red-500/10'
                  }`}>
                    {combinedInterpretation.signal}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Strength</span>
                  <span className="font-semibold text-teal-400 text-xs">{combinedInterpretation.strength}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-xs font-medium">Confidence</span>
                  <span className="font-semibold text-cyan-400 text-xs">{combinedInterpretation.confidence}</span>
                </div>
                <div className="border-t border-slate-700/30 pt-2">
                  <p className="text-slate-400 text-xs mb-2 font-medium">Reason:</p>
                  <p className="text-slate-300 text-xs">{combinedInterpretation.reasoning}</p>
                </div>
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-2">
                  <p className="text-teal-400 text-xs font-semibold">{combinedInterpretation.recommendation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - 3 Sections */}
          <div className="grid grid-cols-3 gap-4">
            {/* Microstructure Features */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-black mb-4">Liquidity Profile</h3>
              <div className="space-y-3">
                {features.map((feature, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-slate-400 text-xs font-medium">{feature.name}</span>
                    <span className="font-semibold text-teal-400 text-xs">{feature.value}</span>
                  </div>
                ))}
                <div className="text-slate-500 text-xs pt-2 font-medium">Last: 12:34:56.234</div>
              </div>
            </div>

            {/* System Metrics */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-black mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                  <span className="text-slate-400 text-xs font-medium">Updates/sec</span>
                  <span className="font-semibold text-cyan-400 text-xs">847</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                  <span className="text-slate-400 text-xs font-medium">Latency p99</span>
                  <span className="font-semibold text-cyan-400 text-xs">1.2ms</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                  <span className="text-slate-400 text-xs font-medium">Uptime</span>
                  <span className="font-semibold text-green-400 text-xs">99.8%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-xs font-medium">Memory</span>
                  <span className="font-semibold text-cyan-400 text-xs">234 MB</span>
                </div>
              </div>
            </div>

            {/* Event Log */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-black mb-4">Event Log</h3>
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {events.map((event, i) => (
                  <div key={i} className="border-b border-slate-700/30 pb-2">
                    <p className={`text-xs font-semibold mb-1 ${
                      event.type === 'PREDICTION' ? 'text-teal-400' :
                      event.type === 'CANCEL' ? 'text-yellow-400' :
                      'text-slate-300'
                    }`}>
                      [{event.type}]
                    </p>
                    <p className="text-slate-400 text-xs mb-1">{event.desc}</p>
                    <p className="text-slate-500 text-xs">{event.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}