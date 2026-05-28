import React from 'react';
import { useData } from '../contexts/DataContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Product, Transaction, Category } from '../types';

export const DashboardView: React.FC = () => {
  const { products, categories, transactions, loadingData } = useData();

  // 1. STATS CALCULATIONS
  const totalProducts = products.length;
  
  const totalStockValue = products.reduce((acc, p) => {
    return acc + (p.quantity * p.price);
  }, 0);

  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  // Stock bas alert (< minStock)
  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);

  // Today movements count
  const todayMovements = transactions.filter(t => {
    if (!t.date) return false;
    const tDate = new Date(t.date);
    const today = new Date();
    return tDate.toDateString() === today.toDateString();
  });

  // 2. CHART DATA FORMULATION
  // Donut split by category
  const categoriesMap = categories.reduce((acc: Record<string, string>, cat) => {
    acc[cat.name] = cat.color;
    return acc;
  }, {});

  const catQuantities = products.reduce((acc: Record<string, { name: string; value: number; color: string }>, p) => {
    const catName = p.category || 'Non classé';
    const catColor = categoriesMap[catName] || '#64748B'; // fallback slate

    if (!acc[catName]) {
      acc[catName] = { name: catName, value: 0, color: catColor };
    }
    acc[catName].value += p.quantity;
    return acc;
  }, {} as Record<string, { name: string; value: number; color: string }>);

  const pieChartData = (Object.values(catQuantities) as Array<{ name: string; value: number; color: string }>).filter(item => item.value > 0);

  // If empty, supply a beautiful placeholder chart
  const defaultPieData = [
    { name: 'Aucun produit', value: 1, color: '#334155' }
  ];

  // 30 Days Movements timeline
  const getTimelineData = () => {
    const data: { date: string; entrees: number; sorties: number }[] = [];
    
    // Create last 10 days timeline for compact visualization
    const today = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      
      // Sum transactions for this day
      let dayEntries = 0;
      let dayExits = 0;

      transactions.forEach(t => {
        if (!t.date) return;
        const tDate = new Date(t.date);
        if (tDate.toDateString() === d.toDateString()) {
          if (t.type === 'entrée') {
            dayEntries += t.quantity;
          } else if (t.type === 'sortie') {
            dayExits += t.quantity;
          } else if (t.type === 'ajustement') {
            // Treat adjustment as positive or negative movement helper
            if (t.quantity > 0) dayEntries += t.quantity;
          }
        }
      });

      data.push({
        date: dateStr,
        entrees: dayEntries,
        sorties: dayExits
      });
    }

    return data;
  };

  const timelineData = getTimelineData();

  // format prices beautifully in TND
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(value);
  };

  if (loadingData) {
    return (
      <div className="space-y-6 pt-16 md:pt-0">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="h-28 bg-[#1E293B]/80 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-[#1E293B]/80 rounded-2xl border border-slate-800 animate-pulse" />
          <div className="h-96 bg-[#1E293B]/80 rounded-2xl border border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }  return (
    <div className="space-y-6 pt-16 md:pt-0 font-sans pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 uppercase tracking-tight">
            Tableau de Bord
          </h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wide">
            Aperçu en temps réel de votre stock et transactions • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Dynamic Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        
        {/* KPI 1 : Total products - [Bento col: span 1, row: span 1] */}
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-xl p-5 relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all duration-300 shadow-lg flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-medium text-[#94A3B8] uppercase tracking-widest">
                TOTAL PRODUITS
              </span>
              <span className="text-3xl font-bold font-mono text-[#38BDF8] mt-1 tracking-tight">
                {totalProducts}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center border border-[#38BDF8]/20">
              <Package className="w-5 h-5 text-[#38BDF8]" />
            </div>
          </div>
          <div className="text-[11px] text-[#94A3B8] flex items-center space-x-1.5 transition-colors group-hover:text-[#F8FAFC]">
            <span>{categories.length} catégories définies</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#38BDF8]/50 to-transparent" />
        </div>

        {/* KPI 2 : Total stock valuation - [Bento col: span 1, row: span 1] */}
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between h-32 font-sans">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-medium text-[#94A3B8] uppercase tracking-widest">
                VALEUR STOCK
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-2 tracking-tight">
                {formatPrice(totalStockValue)}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-[11px] text-[#94A3B8] transition-colors group-hover:text-[#F8FAFC]">
            Valorisation globale cumulée
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
        </div>

        {/* KPI 3 : Out of Stock / Ruptures - [Bento col: span 1, row: span 1] */}
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-xl p-5 relative overflow-hidden group hover:border-red-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-medium text-[#94A3B8] uppercase tracking-widest">
                RUPTURES
              </span>
              <span className={`text-3xl font-bold font-mono mt-1 tracking-tight ${outOfStockCount > 0 ? 'text-red-400' : 'text-slate-350'}`}>
                {outOfStockCount}
              </span>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${outOfStockCount > 0 ? 'bg-red-500/15 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <AlertTriangle className={`w-5 h-5 ${outOfStockCount > 0 ? 'text-red-400' : 'text-slate-400'}`} />
            </div>
          </div>
          <div className="text-[11px] text-[#94A3B8] transition-colors group-hover:text-[#F8FAFC]">
            {lowStockProducts.length} seuils faibles à surveiller
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/50 to-transparent" />
        </div>

        {/* KPI 4 : Daily Stock Movements - [Bento col: span 1, row: span 1] */}
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-xl p-5 relative overflow-hidden group hover:border-violet-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-medium text-[#94A3B8] uppercase tracking-widest">
                MOUVEMENTS (24H)
              </span>
              <span className="text-3xl font-bold font-mono text-violet-400 mt-1 tracking-tight">
                {todayMovements.length}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <RefreshCw className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div className="text-[11px] text-[#94A3B8] transition-colors group-hover:text-[#F8FAFC]">
            Transactions aujourd'hui
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/50 to-transparent" />
        </div>

        {/* Chart 1: Flux de stock area timeline chart - [Bento col: span 3, row: span 2] */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#1E293B]/20 border border-[#334155] rounded-xl p-5 flex flex-col justify-between shadow-md hover:border-[#38BDF8]/20 transition-all duration-300 min-h-[360px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase tracking-widest block font-sans">
                FLUX D'ENTRÉES & SORTIES (10 JOURS)
              </span>
              <span className="text-[9px] font-mono bg-[#38BDF8]/10 text-[#38BDF8] px-2.5 py-0.5 rounded-full uppercase border border-[#38BDF8]/10 font-sans">
                Volumes cumulés
              </span>
            </div>
          </div>
          
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntree" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSortie" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="entrees" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEntree)" name="Entrées" />
                <Area type="monotone" dataKey="sorties" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSortie)" name="Sorties" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut Chart - [Bento col: span 1, row: span 2] */}
        <div className="col-span-1 bg-[#1E293B]/20 border border-[#334155] rounded-xl p-5 flex flex-col justify-between shadow-md hover:border-[#38BDF8]/20 transition-all duration-300 min-h-[360px]">
          <div>
            <span className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase tracking-widest block mb-1 font-sans">
              CLASSIFICATION
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              Répartition par catégorie
            </span>
          </div>
          
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData.length > 0 ? pieChartData : defaultPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(pieChartData.length > 0 ? pieChartData : defaultPieData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {pieChartData.length > 0 ? (
              pieChartData.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-400 truncate max-w-[125px] font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-300 font-semibold text-xs">{item.value} u.</span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-500 py-2">Saisir un produit pour modéliser</p>
            )}
          </div>
        </div>

        {/* Tabular Container 1: Low Stock Alerts Table - [Bento col: span 2, row: span 2] */}
        <div className="col-span-1 md:col-span-2 bg-[#1E293B]/20 border border-[#334155] rounded-xl p-5 shadow-md hover:border-[#38BDF8]/20 transition-all duration-300 min-h-[380px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase tracking-widest block font-sans">
                ALERTES DE STOCK FAIBLE ({lowStockProducts.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b border-[#334155] text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <th className="py-2 px-1 font-medium text-slate-450">Produit</th>
                    <th className="py-2 px-1 font-medium text-slate-450">SKU</th>
                    <th className="py-2 px-1 font-medium text-slate-450">Stock</th>
                    <th className="py-2 px-1 font-medium text-slate-455 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.slice(0, 5).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-500/5 text-slate-350 transition-colors">
                        <td className="py-3 px-1 font-semibold text-slate-100">{p.name}</td>
                        <td className="py-3 px-1 font-mono text-[11px] text-slate-500">{p.sku}</td>
                        <td className="py-3 px-1 font-mono text-slate-300">{p.quantity}</td>
                        <td className="py-3 px-1 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase inline-block
                            ${p.quantity === 0 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                           {p.quantity === 0 ? 'Rupture' : 'Faible'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-slate-500 font-sans">
                        👍 Parfait! Aucun produit en alerte de stock bas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tabular Container 2: Dernières Transactions - [Bento col: span 2, row: span 2] */}
        <div className="col-span-1 md:col-span-2 bg-[#1E293B]/20 border border-[#334155] rounded-xl p-5 shadow-md hover:border-[#38BDF8]/20 transition-all duration-300 min-h-[380px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase tracking-widest block font-sans">
                DERNIÈRES TRANSACTIONS
              </span>
            </div>

            <div className="space-y-2.5">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A]/30 border border-[#334155]/60 text-xs">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border 
                        ${t.type === 'entrée' 
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                          : t.type === 'sortie' 
                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-400'}`}
                      >
                        {t.type === 'entrée' ? (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase font-sans">IN</span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-400 uppercase font-sans">OUT</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{t.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{t.note || 'Pas de note répertoriée'}</p>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 pl-1 font-mono">
                      <span className={`font-bold text-sm ${t.type === 'entrée' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'entrée' ? '+' : '-'}{t.quantity}
                      </span>
                      <p className="text-[9px] text-slate-550 mt-0.5">
                        {t.date ? new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Aujourd\'hui'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 font-sans">
                  Aucune transaction enregistrée
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
