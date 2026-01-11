import { useState, useEffect } from "react";
import { LogOut, TrendingDown, ChevronDown, Home, Menu, X } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_BASE_URL;
console.log("API BASE =", API);

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);

  const [selectedMarket] = useState("BTCUSDT");
  const [isLive] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [priceData, setPriceData] = useState<any[]>([]);
  const [orderBook, setOrderBook] = useState({ asks: [], bids: [] });

  const [metrics, setMetrics] = useState({
    midPrice: 0,
    spread: "-",
    spreadChange: "-",
    imbalance: "-",
    prediction: "-",
    confidence: "-",
  });

  const [microstructure1s, setMicrostructure1s] = useState<any>({
    bidAskSpread: "-",
    imbalanceRatio: "-",
    topBidVolume: "-",
    topAskVolume: "-",
    lastUpdate: "-",
  });

  const [features, setFeatures] = useState<any[]>([]);
  const [priceContext15m, setPriceContext15m] = useState<any>(null);
  const [combinedInterpretation, setCombinedInterpretation] =
    useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setAuthenticated(false);
        return navigate("/auth/login");
      }
      setUser(data.user);
      setAuthenticated(true);
    };

    checkAuth();
  }, [navigate]);

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Logged out", {
      description: "You have successfully logged out",
    });
  };

  /* ---------------- ML FETCH LOOP ---------------- */
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAll = async () => {
      try {
        const [obRes, featRes, predRes, ctxRes, metRes, interpRes] =
          await Promise.all([
            fetch(`${API}/orderbook`).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API}/features`).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API}/prediction`).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API}/context/price`).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API}/metrics`).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API}/interpretation`).then((r) =>
              r.ok ? r.json() : null
            ),
          ]);

        if (!obRes) return;
        const mid = obRes.mid_price;

        if (mid > 0) {
          setPriceData((prev) => [
            ...prev.slice(-40),
            {
              day: new Date(obRes.timestamp).toLocaleTimeString(),
              price: mid,
            },
          ]);
        }

        setOrderBook({
          asks: (obRes.asks || []).slice(0, 3),
          bids: (obRes.bids || []).slice(0, 3),
        });

        const spreadBp =
          mid && obRes.spread ? ((obRes.spread / mid) * 10000).toFixed(6) : "-";

        let predLabel = "-";
        if (predRes?.prediction === 1) predLabel = "UP";
        else if (predRes?.prediction === -1) predLabel = "DOWN";
        else predLabel = "FLAT";

        setMetrics({
          midPrice: mid ?? 0,
          spread: spreadBp,
          spreadChange:
            featRes?.rolling_mid_return != null
              ? (featRes.rolling_mid_return * 100).toFixed(2)
              : "-",
          imbalance:
            featRes?.orderbook_imbalance != null
              ? (featRes.orderbook_imbalance * 100).toFixed(2)
              : "-",
          prediction: predLabel,
          confidence:
            predRes?.confidence != null
              ? (predRes.confidence * 100).toFixed(1)
              : "-",
        });

        if (featRes) {
          setMicrostructure1s({
            bidAskSpread: `${spreadBp} bp`,
            imbalanceRatio: `${(featRes.orderbook_imbalance * 100).toFixed(
              2
            )}%`,
            topBidVolume: `${featRes.bid_volume_top_n.toFixed(2)} BTC`,
            topAskVolume: `${featRes.ask_volume_top_n.toFixed(2)} BTC`,
            lastUpdate: new Date(obRes.timestamp).toLocaleTimeString(),
          });

          setFeatures([
            {
              name: "Bid Volume L5",
              value: `${featRes.bid_volume_top_n.toFixed(2)} BTC`,
            },
            {
              name: "Ask Volume L5",
              value: `${featRes.ask_volume_top_n.toFixed(2)} BTC`,
            },
            {
              name: "OB Imbalance",
              value: `${(featRes.orderbook_imbalance * 100).toFixed(2)}%`,
            },
            {
              name: "Rolling Vol",
              value: `${featRes.rolling_volatility.toFixed(2)}%`,
            },
          ]);
        }

        if (ctxRes?.price_target) {
          setPriceContext15m({
            trend: ctxRes.trend,
            priceChange: `${(ctxRes.expected_return_pct * 100).toFixed(2)}%`,
            highPrice: ctxRes.confidence_upper.toLocaleString(),
            lowPrice: ctxRes.confidence_lower.toLocaleString(),
            volatility: `${(
              ((ctxRes.confidence_upper - ctxRes.confidence_lower) /
                ctxRes.price_target) *
              100
            ).toFixed(2)}%`,
          });
        }

        if (interpRes) {
          setCombinedInterpretation({
            signal: interpRes.micro_signal,
            strength: interpRes.combined_signal,
            confidence:
              interpRes.micro_confidence != null
                ? `${(interpRes.micro_confidence * 100).toFixed(1)}%`
                : "-",
            reasoning: interpRes.interpretation,
            recommendation: interpRes.combined_signal.includes("BULLISH")
              ? "Long bias — momentum aligned"
              : interpRes.combined_signal.includes("BEARISH")
              ? "Short bias — trend aligned"
              : "Wait — unclear signals",
          });
        }

        if (metRes)
          setSystemStatus({
            updates: metRes.updates_per_second,
            snapshots: metRes.snapshots_emitted,
            ws: metRes.active_websocket_connections,
            uptime: metRes.uptime_seconds,
          });

        setEvents((prev) => [
          {
            time: new Date().toLocaleTimeString(),
            type: predLabel !== "-" ? "PREDICT" : "TICK",
            desc:
              predLabel !== "-"
                ? `${predLabel} (${((predRes?.confidence ?? 0) * 100).toFixed(
                    1
                  )}%)`
                : `Mid ${mid}`,
          },
          ...prev.slice(0, 40),
        ]);
      } catch (e) {
        console.error(e);
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, 1000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Mobile Header - Visible until XL (covers iPad Pro) */}
      <div className="xl:hidden sticky top-0 z-50 bg-slate-800/40 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="p-2 rounded-lg hover:bg-slate-700/30 transition"
        >
          {showMobileSidebar ? (
            <X className="w-6 h-6 text-slate-300" />
          ) : (
            <Menu className="w-6 h-6 text-slate-300" />
          )}
        </button>

        <h1 className="text-lg font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          MicroState
        </h1>

        <div className="w-10"></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="xl:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`xl:hidden fixed top-0 left-0 h-full w-64 bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/50 z-50 transition-transform duration-300 ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              MicroState
            </h1>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="p-2 rounded-lg hover:bg-slate-700/30 transition"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <nav className="space-y-2 mb-8">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-teal-500/20 text-teal-400 rounded-lg transition text-sm font-semibold hover:bg-teal-500/30"
              onClick={() => setShowMobileSidebar(false)}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              <span>Dashboard</span>
            </button>
          </nav>

          <div className="border-t border-slate-700/50 pt-6">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full group relative"
            >
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/30 transition">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center font-bold text-xs text-slate-900 flex-shrink-0">
                  {user?.user_metadata?.name?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {user?.user_metadata?.name || "User"}
                  </p>
                  <p className="text-xs text-slate-400 truncate leading-tight">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {showUserMenu && (
              <div className="mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowMobileSidebar(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-sm font-medium transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 lg:gap-6">
          <Sidebar
            user={user}
            showUserMenu={showUserMenu}
            setShowUserMenu={setShowUserMenu}
            handleLogout={handleLogout}
          />

          <div className="col-span-1 xl:col-span-5 space-y-4 lg:space-y-6">
            <Header selectedMarket={selectedMarket} isLive={isLive} />
            <TopCards metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-4 auto-rows-max">
              <PriceChart priceData={priceData} />
              <OrderBook orderBook={orderBook} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-4 auto-rows-max">
              <Microstructure data={microstructure1s} />
              <PriceContext data={priceContext15m} />
              <Interpretation data={combinedInterpretation} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-4 auto-rows-max">
              <Liquidity features={features} />
              <SystemStatus status={systemStatus} />
              <EventLog events={events} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ selectedMarket, isLive }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-3xl lg:text-4xl font-black break-words">
          Market Dynamics
        </h2>
        <p className="text-slate-400 text-xs lg:text-sm mt-1">
          Real-time order book analysis
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-3">
        <div className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm lg:text-base whitespace-nowrap">
          <div
            className={`w-2 h-2 rounded-full ${
              isLive ? "bg-green-500" : "bg-gray-500"
            }`}
          ></div>
          <span className="font-medium">{selectedMarket}</span>
        </div>
        <div className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm lg:text-base whitespace-nowrap">
          <div
            className={`w-2 h-2 rounded-full ${
              isLive ? "bg-green-500" : "bg-gray-500"
            }`}
          ></div>
          <span className="font-medium">{isLive ? "LIVE" : "OFFLINE"}</span>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, showUserMenu, setShowUserMenu, handleLogout }) {
  return (
    <div className="col-span-1 xl:col-span-1 hidden xl:block">
      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 lg:p-6 h-fit sticky top-6">
        <h1 className="text-lg lg:text-xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent truncate mb-6">
          MicroState
        </h1>

        <nav className="mb-8">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-teal-500/20 text-teal-400 rounded-lg transition text-sm font-semibold hover:bg-teal-500/30">
            <Home className="w-5 h-5 flex-shrink-0" />
            <span>Dashboard</span>
          </button>
        </nav>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full group relative"
          >
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/30 transition">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center font-bold text-xs text-slate-900 flex-shrink-0">
                {user?.user_metadata?.name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user?.user_metadata?.name || "User"}
                </p>
                <p className="text-xs text-slate-400 truncate leading-tight">
                  {user?.email}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 flex-shrink-0 transition ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
                className="w-full px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-sm font-medium transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
      <MetricCard
        title="Mid Price"
        value={`$${metrics.midPrice.toLocaleString()}`}
      />

      <MetricCard title="Spread" value={`${metrics.spread} bp`} negative />

      <MetricCard title="Imbalance" value={`${metrics.imbalance}%`} green />

      <MetricCard
        title="Prediction"
        value={metrics.prediction}
        sub={`${metrics.confidence}%`}
        green
      />
    </div>
  );
}

function MetricCard({ title, value, sub, green, negative }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-3 lg:p-5">
      <p className="text-slate-400 text-xs uppercase font-medium truncate">
        {title}
      </p>
      <p
        className={`text-xl lg:text-3xl font-black mt-1 lg:mt-2 break-words ${
          green ? "text-teal-400" : ""
        }`}
      >
        {value}
      </p>

      {sub && (
        <p
          className={`text-xs mt-2 lg:mt-3 font-semibold ${
            negative ? "text-red-400 flex gap-1 items-center" : "text-slate-400"
          }`}
        >
          {negative && <TrendingDown className="w-3 h-3 flex-shrink-0" />} {sub}
        </p>
      )}
    </div>
  );
}

function PriceChart({ priceData }) {
  return (
    <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <h3 className="text-lg lg:text-lg font-black mb-3 lg:mb-4 truncate">
        Price & Prediction
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={priceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: "10px" }} />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            style={{ fontSize: "10px" }}
            domain={[
              (dataMin: number) => Math.floor(dataMin - 20),
              (dataMax: number) => Math.ceil(dataMax + 20),
            ]}
          />

          <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrderBook({ orderBook }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <h3 className="text-lg font-black mb-3 lg:mb-4 truncate">Order Book</h3>

      <p className="text-slate-400 text-xs mb-2 font-medium">ASKS (Top 3)</p>
      {orderBook.asks.map((a, i) => (
        <div
          key={i}
          className="flex justify-between text-xs text-red-400 mb-1 gap-2"
        >
          <span className="truncate">${a.price?.toLocaleString()}</span>
          <span className="text-slate-300 flex-shrink-0">{a.quantity} BTC</span>
        </div>
      ))}

      <hr className="my-2 border-slate-700" />

      <p className="text-slate-400 text-xs mb-2 font-medium">BIDS (Top 3)</p>
      {orderBook.bids.map((b, i) => (
        <div
          key={i}
          className="flex justify-between text-xs text-green-400 mb-1 gap-2"
        >
          <span className="truncate">${b.price?.toLocaleString()}</span>
          <span className="text-slate-300 flex-shrink-0">{b.quantity} BTC</span>
        </div>
      ))}
    </div>
  );
}

function Microstructure({ data }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <div className="flex justify-between items-center mb-3 lg:mb-4 gap-2">
        <h3 className="text-lg font-black truncate">Microstructure</h3>
        <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded flex-shrink-0">
          1s
        </span>
      </div>

      <Entry label="Bid/Ask Spread" value={data.bidAskSpread} />
      <Entry label="Imbalance" value={data.imbalanceRatio} />
      <Entry label="Top Bid Vol" value={data.topBidVolume} />
      <Entry label="Top Ask Vol" value={data.topAskVolume} />

      <p className="text-slate-500 text-xs mt-2 border-t border-slate-700 pt-2 truncate">
        Update: {data.lastUpdate}
      </p>
    </div>
  );
}

function PriceContext({ data }) {
  if (!data)
    return (
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
        <p className="text-slate-500 text-xs">Loading…</p>
      </div>
    );

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <div className="flex justify-between items-center mb-3 lg:mb-4 gap-2">
        <h3 className="text-lg font-black truncate">Price Context</h3>
        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-1 rounded flex-shrink-0">
          15m
        </span>
      </div>

      <Entry label="Price Change" value={data.priceChange} />
      <Entry label="24H High" value={`$${data.highPrice}`} />
      <Entry label="24H Low" value={`$${data.lowPrice}`} />
      <Entry label="Volatility" value={data.volatility} />

      <p className="text-teal-400 text-xs pt-2 font-semibold truncate">
        Trend: {data.trend}
      </p>
    </div>
  );
}

function Interpretation({ data }) {
  if (!data)
    return (
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
        <p className="text-slate-500 text-xs">Warming up…</p>
      </div>
    );

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <div className="flex justify-between items-center mb-3 lg:mb-4 gap-2">
        <h3 className="text-lg font-black truncate">Interpretation</h3>
        <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded flex-shrink-0">
          AI
        </span>
      </div>

      <Entry label="Signal" value={data.signal} />
      <Entry label="Strength" value={data.strength} />
      <Entry label="Confidence" value={data.confidence} />

      <div className="border-t border-slate-700 mt-2 pt-2">
        <p className="text-xs text-slate-400 mb-1">Reason:</p>
        <p className="text-xs text-slate-300 break-words">{data.reasoning}</p>
      </div>

      <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg mt-2 p-2">
        <p className="text-teal-400 text-xs font-semibold break-words">
          {data.recommendation}
        </p>
      </div>
    </div>
  );
}

function Liquidity({ features }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <h3 className="text-lg font-black mb-3 lg:mb-4 truncate">
        Liquidity Profile
      </h3>
      {features.map((f, i) => (
        <Entry key={i} label={f.name} value={f.value} />
      ))}
    </div>
  );
}

function SystemStatus({ status }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <h3 className="text-lg font-black mb-3 lg:mb-4 truncate">
        System Status
      </h3>
      <Entry label="Updates/sec" value={status?.updates ?? "-"} />
      <Entry label="Snapshots" value={status?.snapshots ?? "-"} />
      <Entry label="Active WS" value={status?.ws ?? "-"} />
      <Entry
        label="Uptime"
        value={status?.uptime ? `${(status.uptime / 60).toFixed(1)} min` : "-"}
      />
    </div>
  );
}

function EventLog({ events }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <h3 className="text-lg font-black mb-3 lg:mb-4 truncate">Event Log</h3>
      <div className="space-y-2 lg:space-y-3 max-h-56 overflow-y-auto">
        {events.map((e, i) => (
          <div key={i} className="border-b border-slate-700 pb-2">
            <p className="text-xs font-semibold text-slate-300">[{e.type}]</p>
            <p className="text-xs text-slate-400 break-words">{e.desc}</p>
            <p className="text-xs text-slate-500">{e.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Entry({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 gap-2">
      <span className="text-slate-400 text-xs font-medium truncate">
        {label}
      </span>
      <span className="text-teal-400 text-xs font-semibold text-right truncate flex-shrink-0">
        {value}
      </span>
    </div>
  );
}
