import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  FileDown, 
  BarChart3, 
  FolderMinus, 
  Layers, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  Calculator,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ReportsView: React.FC = () => {
  const { products, categories, transactions, loadingData } = useData();
  const [exporting, setExporting] = useState(false);

  // 1. TOP 10 MOST INDEXED PRODUCTS (BY TRANSACTION COUNT OR VALUE)
  const productMovements = transactions.reduce((acc: Record<string, { name: string; qty: number }>, t) => {
    const pName = t.productName || 'Modèle de produit';
    if (!acc[pName]) {
      acc[pName] = { name: pName, qty: 0 };
    }
    acc[pName].qty += t.quantity;
    return acc;
  }, {} as Record<string, { name: string; qty: number }>);

  const barChartData = (Object.values(productMovements) as Array<{ name: string; qty: number }>)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // 2. TOTAL STOCK VALUE COUPLING BY CATEGORIES
  const categorySplitValues = products.reduce((acc: Record<string, { category: string; value: number; count: number }>, p) => {
    const catName = p.category || 'Non classé';
    if (!acc[catName]) {
      acc[catName] = { category: catName, value: 0, count: 0 };
    }
    acc[catName].value += (p.quantity * p.price);
    acc[catName].count += p.quantity;
    return acc;
  }, {} as Record<string, { category: string; value: number; count: number }>);

  const categoryValueData = (Object.values(categorySplitValues) as Array<{ category: string; value: number; count: number }>)
    .sort((a, b) => b.value - a.value);

  // 3. MONTHLY TRANSACTION AGGREGATIONS
  const monthlyTimelineAggregates = transactions.reduce((acc: Record<string, { month: string; entrees: number; sorties: number; operations: number; year: number; monthVal: number }>, t) => {
    if (!t.date) return acc;
    const dateObj = new Date(t.date);
    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const yearVal = dateObj.getFullYear();
    const monthIndexVal = dateObj.getMonth();

    if (!acc[monthName]) {
      acc[monthName] = { 
        month: monthName, 
        entrees: 0, 
        sorties: 0, 
        operations: 0,
        year: yearVal,
        monthVal: monthIndexVal
      };
    }

    acc[monthName].operations += 1;
    if (t.type === 'entrée') {
      acc[monthName].entrees += t.quantity;
    } else if (t.type === 'sortie') {
      acc[monthName].sorties += t.quantity;
    }

    return acc;
  }, {} as Record<string, { month: string; entrees: number; sorties: number; operations: number; year: number; monthVal: number }>);

  const monthlyData = (Object.values(monthlyTimelineAggregates) as Array<{ month: string; entrees: number; sorties: number; operations: number; year: number; monthVal: number }>)
    .sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.monthVal - a.monthVal;
  });

  // 4. PDF GENERATOR TRIGGER
  const exportPDF = async () => {
    const element = document.getElementById('reports-print-container');
    if (!element) return;
    setExporting(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0F172A',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 standard width in mm
      const pageHeight = 295; // A4 standard max height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`inventrak_rapport_performance_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(value);
  };

  // Preset Colors for Report Charts
  const colors = ['#38BDF8', '#0EA5E9', '#0284C7', '#0369A1', '#075985', '#0C4A6E', '#14532D', '#15803D', '#16A34A', '#22C55E'];

  return (
    <div className="space-y-6 pt-16 md:pt-0 font-sans pb-10">
      
      {/* Header ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-100 uppercase tracking-tight">Rapports & Analyses</h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wide">Performance des stocks, récapitulatifs mensuels et classifications</p>
        </div>
        
        <Button
          onClick={exportPDF}
          disabled={exporting || loadingData || products.length === 0}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 text-slate-950" />
          )}
          <span>{exporting ? 'GÉNÉRATION DU PDF...' : 'TÉLÉCHARGER LE RAPPORT (PDF)'}</span>
        </Button>
      </div>

      {/* Rendeable elements Container */}
      <div id="reports-print-container" className="space-y-6 rounded-3xl p-1 md:p-4">
        
        {/* Print Brand header header (usually hidden in UI, shown on PDF export screen canvas capture) */}
        <div className="hidden border-b border-slate-800 pb-4 mb-4" style={{ display: exporting ? 'block' : 'none' }}>
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-heading font-extrabold text-white">INVEN<span className="text-sky-400">TRAK</span> INVENTORY REPORT</h1>
            <span className="text-xs font-mono text-slate-400 uppercase">Édité le: {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        {/* Row 1: Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Main Bar Chart: Top 10 most moved products */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5 shadow-md flex flex-col justify-between hover:border-sky-500/20 transition-all duration-300">
            <div className="mb-4">
              <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px]">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <span>Top 10 des produits les plus mouvementés</span>
              </h3>
              <p className="text-slate-500 text-[11px] font-sans">Volumes cumulés d'entrées et de sorties</p>
            </div>

            <div className="h-72 w-full">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} hide={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Bar dataKey="qty" radius={[4, 4, 0, 0]} name="Qté Totale" maxBarSize={30}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-sans">
                  Saisir des transactions pour alimenter le graphique
                </div>
              )}
            </div>
          </div>

          {/* Right Cards: Categorized Stock Value */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-md flex flex-col hover:border-sky-500/20 transition-all duration-300">
            <div className="mb-4">
              <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px]">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Valeur du stock par catégorie</span>
              </h3>
              <p className="text-slate-500 text-[11px] font-sans">Valeur financière totale accumulée</p>
            </div>

            {/* List */}
            <div className="space-y-4 flex-1 overflow-y-auto max-h-72 pr-1">
              {categoryValueData.length > 0 ? (
                categoryValueData.map((cv, idx) => {
                  const maxVal = categoryValueData[0]?.value || 1;
                  const ratio = Math.max(5, (cv.value / maxVal) * 100);
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center font-sans">
                        <span className="font-semibold text-slate-200">{cv.category}</span>
                        <span className="font-mono font-bold text-sky-400">{formatPrice(cv.value)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                        <span>{cv.count} unités au total</span>
                        <span>{ratio.toFixed(0)}% du maximum</span>
                      </div>
                      <div className="w-full bg-[#0F172A]/40 h-1.5 rounded-full overflow-hidden border border-border/10">
                        <div 
                          className="h-full bg-sky-500 rounded-full transition-all" 
                          style={{ width: `${ratio}%`, backgroundColor: colors[idx % colors.length] }} 
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-500 py-12 font-sans">
                  Aucun produit présent dans l'inventaire
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Monthly tabular summaries */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-md hover:border-sky-500/20 transition-all duration-300">
          <div className="mb-4 flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-sky-400" />
            <h3 className="font-heading font-bold text-slate-100 text-[15px]">Récapitulatif Mensuel d'Activités</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-550 uppercase tracking-wider">
                  <th className="py-3 px-3">Période Mensuelle</th>
                  <th className="py-3 px-3 text-center">Opérations loggées</th>
                  <th className="py-3 px-3 text-center">Somme des Entrées (unités)</th>
                  <th className="py-3 px-3 text-center">Somme des Sorties (unités)</th>
                  <th className="py-3 px-3 text-center">Solde Net Mensuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-350">
                {monthlyData.length > 0 ? (
                  monthlyData.map((m, idx) => {
                    const balance = m.entrees - m.sorties;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/20 text-slate-350 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-100 capitalize">{m.month}</td>
                        <td className="py-3 px-3 text-center font-mono">{m.operations} trans.</td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-mono font-bold">+{m.entrees} u.</td>
                        <td className="py-3 px-3 text-center text-red-400 font-mono font-bold">-{m.sorties} u.</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`font-mono font-bold rounded-lg px-2.5 py-1 text-xs
                            ${balance >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}
                          >
                            {balance >= 0 ? '+' : ''}{balance} unités
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                      📝 Aucun historique de transaction disponible pour générer de récapitulatif mensuel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global summary notes */}
        <div className="bg-[#1E293B]/40 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p className="max-w-xl text-center md:text-left leading-relaxed">
            📦 <b>Bilan Global de l'Entrepôt :</b> Ce document trace et calcule l'efficacité d'exploitation du stock de manière entièrement sécurisée. Tous les calculs sont basés sur le cahier des charges interne InvenTrak.
          </p>
          <div className="flex items-center space-x-2 font-mono text-[10px] uppercase text-sky-400 shrink-0 bg-slate-950/20 px-3 py-1.5 border border-sky-500/10 rounded-lg">
            <Database className="w-3.5 h-3.5" />
            <span>Fichiers de base chiffrés</span>
          </div>
        </div>
      </div>
    </div>
  );
};
