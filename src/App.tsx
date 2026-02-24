import React, { useState, useEffect } from 'react';
import { 
  Search, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  MapPin,
  Calendar,
  Users,
  Hotel,
  ChevronRight,
  ExternalLink,
  FileText,
  Copy,
  Bookmark,
  Play,
  StopCircle,
  Clock,
  Filter,
  ArrowUpDown,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays } from 'date-fns';
import { cn } from './lib/utils';
import { VerificationRun, HotelResult, AgentLog } from './types';
import { generateMockResults } from './services/agentService';

// --- Components ---

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
      active 
        ? "bg-accent/10 text-accent font-medium" 
        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
    )}
  >
    <Icon size={18} />
    <span>{label}</span>
  </button>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) => {
  const variants = {
    default: "bg-zinc-800 text-zinc-300",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    error: "bg-error/10 text-error border border-error/20",
    info: "bg-accent/10 text-accent border border-accent/20",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", variants[variant])}>
      {children}
    </span>
  );
};

interface VerifiedBookingCardProps {
  key?: React.Key;
  result: HotelResult;
  onViewEvidence: (r: HotelResult) => void;
}

const VerifiedBookingCard = ({ result, onViewEvidence }: VerifiedBookingCardProps) => {
  const statusVariant = result.status === 'verified' ? 'success' : result.status === 'unclear' ? 'warning' : 'error';
  const StatusIcon = result.status === 'verified' ? CheckCircle2 : result.status === 'unclear' ? AlertCircle : XCircle;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 hover:border-zinc-700 transition-colors group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-accent transition-colors">{result.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="info">{result.site}</Badge>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin size={12} />
              {result.location}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={statusVariant}>
            <div className="flex items-center gap-1">
              <StatusIcon size={12} />
              {result.status}
            </div>
          </Badge>
          <div className="text-xs text-zinc-500 font-mono">
            {format(new Date(result.verifiedAt), 'HH:mm:ss')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-[10px] uppercase text-zinc-500 font-semibold mb-1">Total Price</div>
          <div className="text-xl font-bold text-zinc-100">
            {result.currency}{result.totalPrice.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">{result.priceBreakdown}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-[10px] uppercase text-zinc-500 font-semibold mb-1">Cancellation</div>
          <div className="text-xs font-medium text-zinc-200 leading-tight">
            {result.cancellationPolicy}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          <button 
            onClick={() => onViewEvidence(result)}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            title="View Evidence"
          >
            <FileText size={16} />
          </button>
          <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors" title="Copy Summary">
            <Copy size={16} />
          </button>
          <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors" title="Save to Shortlist">
            <Bookmark size={16} />
          </button>
        </div>
        <a
          href={result.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Book Now
          <ExternalLink size={14} />
        </a>
      </div>
    </motion.div>
  );
};

const EvidenceModal = ({ result, onClose }: { result: HotelResult, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'json' | 'notes'>('steps');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Verification Evidence</h2>
            <p className="text-sm text-zinc-500">{result.name} • {result.site}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <XCircle size={24} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex border-b border-border">
          {(['steps', 'json', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab ? "text-accent" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab.toUpperCase()}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-bg/50">
          {activeTab === 'steps' && (
            <div className="space-y-4">
              {result.evidence.steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    {i !== result.evidence.steps.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="text-xs text-zinc-500 font-mono mb-1">{step.timestamp}</div>
                    <div className="text-sm text-zinc-300">{step.action}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'json' && (
            <pre className="text-xs font-mono text-emerald-400 bg-black/40 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(result.evidence.rawJson, null, 2)}
            </pre>
          )}

          {activeTab === 'notes' && (
            <div className="text-sm text-zinc-300 leading-relaxed italic">
              "{result.evidence.notes}"
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'run' | 'history' | 'settings'>('run');
  const [isApiHealthy, setIsApiHealthy] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [history, setHistory] = useState<VerificationRun[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<HotelResult | null>(null);
  
  // Form State
  const [city, setCity] = useState('Abuja');
  const [checkIn, setCheckIn] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 10), 'yyyy-MM-dd'));
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [rooms, setRooms] = useState(1);
  const [budget, setBudget] = useState({ min: 0, max: 500000 });
  const [mode, setMode] = useState<'fast' | 'thorough'>('thorough');
  const [selectedSites, setSelectedSites] = useState(['Booking.com', 'Expedia', 'Agoda']);
  const [selectedAmenities, setSelectedAmenities] = useState(['Wi-Fi', 'Pool']);
  const [customAmenities, setCustomAmenities] = useState('');

  const PREBUILT_AMENITIES = [
    'Wi-Fi', 'Pool', 'Airport Service', 'Breakfast', 'Gym', 'Parking', 'Spa', 'Pet Friendly'
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const addLog = (message: string, type: AgentLog['type'] = 'info', site?: string) => {
    const newLog: AgentLog = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      site,
      timestamp: format(new Date(), 'HH:mm:ss.SSS')
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleRun = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);
    
    const runId = Math.random().toString(36).substr(2, 9);
    const run: VerificationRun = {
      id: runId,
      city,
      checkIn,
      checkOut,
      guests,
      rooms,
      budget,
      amenities: [...selectedAmenities, ...customAmenities.split(',').map(a => a.trim()).filter(a => a)],
      sites: selectedSites,
      mode,
      status: 'running',
      createdAt: new Date().toISOString(),
      results: []
    };

    // Simulation
    addLog(`Initializing agent for ${city}...`);
    await new Promise(r => setTimeout(r, 800));
    
    for (const site of selectedSites) {
      addLog(`Connecting to ${site}...`, 'info', site);
      await new Promise(r => setTimeout(r, 1000));
      addLog(`Entering search parameters: ${city}, ${checkIn} to ${checkOut}`, 'info', site);
      await new Promise(r => setTimeout(r, 1200));
      addLog(`Applying filters: Budget ${budget.min}-${budget.max}, ${guests.adults} adults`, 'info', site);
      await new Promise(r => setTimeout(r, 1000));
      addLog(`Extracting initial results...`, 'info', site);
      await new Promise(r => setTimeout(r, 1500));
      
      if (mode === 'thorough') {
        addLog(`Verifying top 3 candidates for live availability...`, 'info', site);
        await new Promise(r => setTimeout(r, 2000));
        addLog(`Checking cancellation policies...`, 'success', site);
      }
    }

    addLog(`Verification complete. Synthesizing evidence...`, 'success');
    
    const mockResults = await generateMockResults(run);
    setResults(mockResults);
    
    const completedRun = { ...run, status: 'completed' as const, results: mockResults };
    
    // Save to DB
    try {
      await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedRun)
      });
      fetchHistory();
    } catch (err) {
      console.error("Failed to save run", err);
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav className="border-b border-border bg-bg/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
                <Activity size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">Hotel Verification Agent</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex gap-2">
              <NavItem icon={Play} label="Run" active={activeTab === 'run'} onClick={() => setActiveTab('run')} />
              <NavItem icon={HistoryIcon} label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
              <NavItem icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-border">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isApiHealthy ? "bg-success" : "bg-error")} />
              <span className="text-xs font-medium text-zinc-400">API Status</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'run' && (
            <motion.div
              key="run"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Setup */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Search size={20} className="text-accent" />
                    <h2 className="font-bold text-lg">Verification Setup</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">City / Area</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input 
                          type="text" 
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-zinc-900 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                          placeholder="e.g. Abuja"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Check-in</label>
                        <input 
                          type="date" 
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full bg-zinc-900 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Check-out</label>
                        <input 
                          type="date" 
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full bg-zinc-900 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Adults</label>
                        <input 
                          type="number" 
                          value={guests.adults}
                          onChange={(e) => setGuests({ ...guests, adults: parseInt(e.target.value) })}
                          className="w-full bg-zinc-900 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Rooms</label>
                        <input 
                          type="number" 
                          value={rooms}
                          onChange={(e) => setRooms(parseInt(e.target.value))}
                          className="w-full bg-zinc-900 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Budget Range (per night)</label>
                        <span className="text-xs font-mono text-accent">
                          ₦{budget.min.toLocaleString()} - ₦{budget.max.toLocaleString()}
                        </span>
                      </div>
                      <div className="relative h-6 flex items-center group">
                        <div className="absolute w-full h-1.5 bg-zinc-800 rounded-full" />
                        <div 
                          className="absolute h-1.5 bg-accent rounded-full" 
                          style={{ 
                            left: `${(budget.min / 1000000) * 100}%`, 
                            right: `${100 - (budget.max / 1000000) * 100}%` 
                          }} 
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000000"
                          step="5000"
                          value={budget.min}
                          onChange={(e) => {
                            const val = Math.min(parseInt(e.target.value), budget.max - 10000);
                            setBudget({ ...budget, min: val });
                          }}
                          className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 slider-thumb"
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000000"
                          step="5000"
                          value={budget.max}
                          onChange={(e) => {
                            const val = Math.max(parseInt(e.target.value), budget.min + 10000);
                            setBudget({ ...budget, max: val });
                          }}
                          className="absolute w-full appearance-none bg-transparent pointer-events-none z-20 slider-thumb"
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-zinc-600">₦0</span>
                        <span className="text-[10px] text-zinc-600">₦1M+</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Amenities</label>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {PREBUILT_AMENITIES.map(amenity => (
                          <label key={amenity} className="flex items-center gap-2 p-2 bg-zinc-900 border border-border rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={selectedAmenities.includes(amenity)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedAmenities([...selectedAmenities, amenity]);
                                else setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                              }}
                              className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent bg-zinc-800"
                            />
                            <span className="text-xs font-medium">{amenity}</span>
                          </label>
                        ))}
                      </div>
                      <textarea
                        value={customAmenities}
                        onChange={(e) => setCustomAmenities(e.target.value)}
                        placeholder="Other amenities (comma separated)..."
                        className="w-full bg-zinc-900 border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all h-20 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Sites to Verify</label>
                      <div className="grid grid-cols-1 gap-2">
                        {['Booking.com', 'Expedia', 'Agoda'].map(site => (
                          <label key={site} className="flex items-center gap-3 p-3 bg-zinc-900 border border-border rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={selectedSites.includes(site)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedSites([...selectedSites, site]);
                                else setSelectedSites(selectedSites.filter(s => s !== site));
                              }}
                              className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-zinc-800"
                            />
                            <span className="text-sm font-medium">{site}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Run Mode</span>
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-border">
                          <button 
                            onClick={() => setMode('fast')}
                            className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", mode === 'fast' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500")}
                          >
                            FAST
                          </button>
                          <button 
                            onClick={() => setMode('thorough')}
                            className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", mode === 'thorough' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500")}
                          >
                            THOROUGH
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={handleRun}
                        disabled={isRunning}
                        className="w-full py-3 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            Running Agent...
                          </>
                        ) : (
                          <>
                            <Play size={20} fill="currentColor" />
                            Run Verification
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Console */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[400px] shadow-sm">
                  <div className="p-4 border-b border-border bg-zinc-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Live Agent Activity</h3>
                    </div>
                    {isRunning && (
                      <button onClick={() => setIsRunning(false)} className="text-[10px] font-bold text-error hover:text-error/80 flex items-center gap-1">
                        <StopCircle size={12} />
                        STOP RUN
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2 scrollbar-hide">
                    {logs.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                        <Clock size={24} />
                        <p>Waiting for run initiation...</p>
                      </div>
                    )}
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                        {log.site && <span className="text-accent shrink-0">[{log.site}]</span>}
                        <span className={cn(
                          log.type === 'success' ? "text-success" : 
                          log.type === 'warning' ? "text-warning" : 
                          log.type === 'error' ? "text-error" : 
                          "text-zinc-300"
                        )}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Verified Results</h2>
                    <Badge variant="info">{results.length} Found</Badge>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-border rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                      <ArrowUpDown size={14} />
                      Sort
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-border rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                      <Filter size={14} />
                      Filter
                    </button>
                  </div>
                </div>

                {results.length === 0 && !isRunning && (
                  <div className="bg-card border border-dashed border-border rounded-2xl h-[600px] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-border">
                      <Hotel size={32} className="text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No active verification run</h3>
                    <p className="text-zinc-500 max-w-xs">
                      Configure your search parameters and click "Run Verification" to start the browser agent.
                    </p>
                  </div>
                )}

                {isRunning && results.length === 0 && (
                  <div className="bg-card border border-border rounded-2xl h-[600px] flex flex-col items-center justify-center text-center p-8">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                      <Activity size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Agent is browsing...</h3>
                    <p className="text-zinc-500 max-w-sm">
                      Our browser agent is currently navigating booking sites to verify real-time availability and pricing.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result) => (
                    <VerifiedBookingCard 
                      key={result.id} 
                      result={result} 
                      onViewEvidence={setSelectedEvidence} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Verification History</h2>
                <button 
                  onClick={fetchHistory}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400"
                >
                  <Loader2 size={20} className={cn(isRunning && "animate-spin")} />
                </button>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-border">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Run ID</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Destination</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Dates</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Sites</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Created</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 italic">
                          No history found. Run your first verification to see it here.
                        </td>
                      </tr>
                    ) : (
                      history.map((run) => (
                        <tr key={run.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 font-mono text-xs text-zinc-400">{run.id}</td>
                          <td className="px-6 py-4 font-semibold">{run.city}</td>
                          <td className="px-6 py-4 text-sm text-zinc-400">
                            {format(new Date(run.checkIn), 'MMM d')} - {format(new Date(run.checkOut), 'MMM d')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex -space-x-2">
                              {run.sites.map((site, i) => (
                                <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-[8px] font-bold" title={site}>
                                  {site[0]}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={run.status === 'completed' ? 'success' : 'warning'}>
                              {run.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500">
                            {format(new Date(run.createdAt), 'MMM d, HH:mm')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                setResults(run.results);
                                setCity(run.city);
                                setCheckIn(run.checkIn);
                                setCheckOut(run.checkOut);
                                setActiveTab('run');
                              }}
                              className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-zinc-500"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl space-y-8"
            >
              <h2 className="text-2xl font-bold">Agent Settings</h2>
              
              <div className="space-y-6">
                <section className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Browser Profile</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Stealth Mode</div>
                        <div className="text-xs text-zinc-500">Use advanced fingerprinting evasion to avoid bot detection.</div>
                      </div>
                      <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Headless Execution</div>
                        <div className="text-xs text-zinc-500">Run browser without GUI for faster performance.</div>
                      </div>
                      <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Proxy Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Proxy Country</label>
                      <select className="w-full bg-zinc-900 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none">
                        <option>Automatic (Closest to destination)</option>
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>Nigeria</option>
                        <option>Germany</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Output Controls</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Strict JSON Validation</div>
                        <div className="text-xs text-zinc-500">Ensure all extracted data matches the predefined schema.</div>
                      </div>
                      <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Evidence Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <EvidenceModal 
            result={selectedEvidence} 
            onClose={() => setSelectedEvidence(null)} 
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-zinc-500">
            © 2026 Hotel Verification Agent. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Documentation</a>
            <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">API Reference</a>
            <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
