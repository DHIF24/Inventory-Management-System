import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Transaction, TransactionType } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Download, 
  Calendar, 
  Plus, 
  X, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  Package,
  FileSpreadsheet,
  CornerDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Transaction Validation Schema
const transactionSchema = z.object({
  productId: z.string().min(1, "Veuillez sélectionner un produit"),
  type: z.enum(['entrée', 'sortie', 'ajustement']),
  quantity: z.number().min(1, "La quantité doit être supérieure ou égale à 1"),
  note: z.string().max(400)
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export const TransactionsView: React.FC = () => {
  const { products, transactions, createStockTransaction } = useData();

  // HISTORY FILTER STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, 7DAYS, 30DAYS

  // ACTIONS MODALS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      productId: '',
      type: 'entrée',
      quantity: 1,
      note: ''
    }
  });

  // Watch product to give real-time stock feedback in the form
  const watchedProductId = watch('productId');
  const selectedProductInForm = products.find(p => p.id === watchedProductId);

  // Submit Transaction Form
  const onSubmitForm = async (data: TransactionFormValues) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      await createStockTransaction(data.productId, data.type, data.quantity, data.note);
      
      const prodName = products.find(p => p.id === data.productId)?.name || 'Produit';
      setSuccessMessage(`Le mouvement de stock pour "${prodName}" a été validé avec succès !`);
      
      reset({
        productId: '',
        type: 'entrée',
        quantity: 1,
        note: ''
      });
      
      // Auto close after brief success message
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage(null);
      }, 1500);

    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV EXPORT MECHANISM
  const exportToCSV = () => {
    if (transactions.length === 0) return;

    // Col headers
    const headers = ['Date', 'Produit', 'Type de Mouvement', 'Quantité', 'Note/Raison', 'ID Transaction'];
    
    const rows = filteredTransactions.map(t => {
      const dateStr = t.date ? new Date(t.date).toLocaleString('fr-FR') : '';
      return [
        `"${dateStr}"`,
        `"${t.productName.replace(/"/g, '""')}"`,
        `"${t.type.toUpperCase()}"`,
        t.quantity,
        `"${t.note.replace(/"/g, '""')}"`,
        `"${t.id}"`
      ];
    });

    const csvContent = '\uFEFF' // UTF-8 BOM representation for French characters in Excel
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventrak_mouvements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // MATCH DATE RANGES FOR LEDGER
  const matchDate = (dateStr: any, filterType: string): boolean => {
    if (filterType === 'ALL') return true;
    if (!dateStr) return false;

    const entryDate = new Date(dateStr);
    const today = new Date();
    
    if (filterType === 'TODAY') {
      return entryDate.toDateString() === today.toDateString();
    }
    
    const diffTime = Math.abs(today.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (filterType === '7DAYS') {
      return diffDays <= 7;
    }
    if (filterType === '30DAYS') {
      return diffDays <= 30;
    }
    return true;
  };

  // FILTER LEDGER ENTRIES
  const filteredTransactions = transactions.filter(t => {
    // 1. Product Text search matches
    const searchString = (t.productName || '').toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // 2. Type matches
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;

    // 3. Date matches
    const matchesDate = matchDate(t.date, dateFilter);

    return matchesSearch && matchesType && matchesDate;
  });

  // PAGINATION LEDGER CALCULATIONS
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 pt-16 md:pt-0 pb-10 font-sans">
      
      {/* Page header with actions block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-100 uppercase tracking-tight">Mouvements de Stock</h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wide">Journal des transactions d'entrées, de sorties et d'ajustements</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="bg-[#1E293B]/60 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>EXPORTER EN CSV</span>
          </Button>
          <Button 
            onClick={() => { setSuccessMessage(null); setIsModalOpen(true); }}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>SAISIR UN MOUVEMENT</span>
          </Button>
        </div>
      </div>

      {/* History filters ribbon */}
      <div className="bg-[#1E293B]/40 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Realtime Search bar */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-500" />
          <Input 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Rechercher par désignation d'article..." 
            className="pl-10 h-10 w-full bg-slate-950/20 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Movement types Filters */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 px-3 bg-slate-950/25 border border-slate-850 text-slate-200 text-xs rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">🔄 Tous les mouvements</option>
            <option value="entrée">📈 Entrées (+)</option>
            <option value="sortie">📉 Sorties (-)</option>
            <option value="ajustement">⚙️ Ajustements (Correction)</option>
          </select>
        </div>

        {/* Date Ranges Filters */}
        <div>
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 px-3 bg-slate-950/25 border border-slate-850 text-slate-200 text-xs rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">📅 Toutes les périodes</option>
            <option value="TODAY">Aujourd'hui</option>
            <option value="7DAYS">7 derniers jours</option>
            <option value="30DAYS">30 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Transactions History Table */}
      <div className="bg-[#1E293B]/20 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-[#1E293B]/20 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-4 w-44">Date & Heure</th>
                <th className="py-4 px-3 w-40">ID Transaction</th>
                <th className="py-4 px-3">Produit concerné</th>
                <th className="py-4 px-3 w-36 text-center">Type</th>
                <th className="py-4 px-3 w-32 text-center">Quantité</th>
                <th className="py-4 px-4">Note / Justificatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t) => {
                  return (
                    <tr key={t.id} className="hover:bg-slate-900/30 text-slate-350 transition-all duration-200">
                      
                      {/* Formatted Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {t.date ? new Date(t.date).toLocaleString('fr-FR') : 'Date inconnue'}
                      </td>

                      {/* Code string identifier */}
                      <td className="py-3 px-3 font-mono text-slate-500 text-[10px] uppercase truncate max-w-[120px]" title={t.id}>
                        {t.id}
                      </td>

                      {/* ProductName */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-100 font-heading text-sm">{t.productName}</span>
                      </td>

                      {/* Movement Type Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-bold tracking-wider flex items-center justify-center w-28 mx-auto
                          ${t.type === 'entrée' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : t.type === 'sortie' 
                              ? 'bg-red-500/10 border-red-500/20 text-red-500'
                              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}
                        >
                          {t.type === 'entrée' ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                          <span>{t.type}</span>
                        </span>
                      </td>

                      {/* Quantity column */}
                      <td className="py-3 px-3 text-center font-bold font-mono text-sm text-slate-200">
                        {t.type === 'entrée' ? '+' : t.type === 'sortie' ? '-' : ''}{t.quantity}
                      </td>

                      {/* Reason or Explanation notes column */}
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate" title={t.note}>
                        {t.note || 'Mouvement de routine'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    📭 Aucun mouvement enregistré pour le moment ou aucun ne correspond aux filtres appliqués.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginator */}
        <div className="bg-[#1E293B]/20 border-t border-slate-850 py-3 px-6 flex items-center justify-between text-xs font-mono">
          <p className="text-slate-500">
            Affichage de <span className="text-slate-200 font-semibold">{paginatedTransactions.length}</span> sur <span className="text-slate-200 font-semibold">{filteredTransactions.length}</span> mouvements
          </p>
          <div className="flex items-center space-x-2">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="bg-slate-950/20 hover:bg-slate-850 text-slate-350 disabled:opacity-30 border border-slate-850 p-1.5 h-8 w-8 rounded-lg outline-none flex items-center justify-center shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-slate-350">Page {currentPage} / {totalPages}</span>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="bg-slate-950/20 hover:bg-slate-850 text-slate-350 disabled:opacity-30 border border-slate-850 p-1.5 h-8 w-8 rounded-lg outline-none flex items-center justify-center shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* DIALOG: CREATE STOCK MOVEMENT ACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px]">
                <TrendingUp className="w-5 h-5 text-sky-400" />
                <span>Enregistrer un Mouvement</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-950/20 outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal content body */}
            <div className="overflow-y-auto p-6">
              
              {successMessage ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-slate-100">Mouvement enregistré !</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">{successMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
                  {/* Select product */}
                  <div>
                    <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Choisir l'article *</Label>
                    <select
                      {...register('productId')}
                      className="w-full h-11 px-3 bg-slate-950/45 border border-slate-850 text-slate-200 text-xs rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-semibold"
                    >
                      <option value="">-- Sélectionner un article --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.sku}] (Actuellement: {p.quantity} u.)
                        </option>
                      ))}
                    </select>
                    {errors.productId && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.productId.message}</p>}
                    
                    {/* Realtime stock preview indicators */}
                    {selectedProductInForm && (
                      <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/25 border border-slate-850 p-2.5 rounded-lg flex items-center justify-between">
                        <span className="flex items-center"><CornerDownRight className="w-3.5 h-3.5 mr-1" /> Stock actuel :</span>
                        <span className="font-bold text-slate-200 font-mono">{selectedProductInForm.quantity} unités</span>
                      </div>
                    )}
                  </div>

                  {/* Mode structure: entry or exit selection */}
                  <div>
                    <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Flux de mouvement *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="cursor-pointer">
                        <input 
                          type="radio" 
                          value="entrée" 
                          {...register('type')}
                          className="peer sr-only"
                        />
                        <div className="py-2.5 text-center text-xs font-semibold rounded-xl border border-slate-850 bg-slate-950/20 text-slate-400 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400 peer-checked:border-emerald-500/30 transition-all">
                          📈 Entrée
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input 
                          type="radio" 
                          value="sortie" 
                          {...register('type')}
                          className="peer sr-only"
                        />
                        <div className="py-2.5 text-center text-xs font-semibold rounded-xl border border-slate-850 bg-slate-950/20 text-slate-400 peer-checked:bg-red-500/10 peer-checked:text-red-400 peer-checked:border-red-500/30 transition-all">
                          📉 Sortie
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input 
                          type="radio" 
                          value="ajustement" 
                          {...register('type')}
                          className="peer sr-only"
                        />
                        <div className="py-2.5 text-center text-xs font-semibold rounded-xl border border-slate-850 bg-slate-950/20 text-slate-400 peer-checked:bg-indigo-500/10 peer-checked:text-indigo-400 peer-checked:border-indigo-500/30 transition-all">
                          ⚙️ Ajuster
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Numeric Quantity input */}
                  <div>
                    <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Quantité concernée *</Label>
                    <Input 
                      type="number" 
                      step="1"
                      min="1"
                      placeholder="ex. 10"
                      {...register('quantity', { valueAsNumber: true })}
                      className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                    {errors.quantity && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.quantity.message}</p>}
                  </div>

                  {/* Transaction Notes reason description */}
                  <div>
                    <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Justificatif / Note explicative</Label>
                    <textarea 
                      placeholder="ex. Livraison fournisseur commande #FR-402, ajustement d'inventaire trimestriel..."
                      {...register('note')}
                      rows={2}
                      className="w-full p-3 bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                    <Button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="bg-slate-950/40 hover:bg-slate-850 border border-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5"
                    >
                      {isSubmitting ? (
                        <span className="w-4.5 h-4.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Valider le mouvement</span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
