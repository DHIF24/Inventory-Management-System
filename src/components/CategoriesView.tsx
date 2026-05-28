import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Category } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Tag, 
  Folder, 
  DollarSign, 
  AlertTriangle,
  X,
  CheckCircle,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Zod Schema Validation
const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(50),
  color: z.string().min(4, "Sélectionnez une couleur valide hex").max(12)
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export const CategoriesView: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useData();

  // ACTIONS MODALS & SELECTIONS CONTROL
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // CURATED COLOR PRESETS
  const colorPresets = [
    '#38BDF8', // Sky Blue
    '#34D399', // Emerald
    '#EF4444', // Red
    '#FBBF24', // Amber
    '#A78BFA', // Violet
    '#F472B6', // Pink
    '#FB7185', // Rose
    '#60A5FA', // Blue
    '#F97316', // Orange
    '#475569'  // Slate
  ];

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: '#38BDF8'
    }
  });

  const watchedColor = watch('color');

  // Open Form Dialog to Add
  const handleOpenAdd = () => {
    setEditingCategory(null);
    reset({
      name: '',
      color: '#38BDF8'
    });
    setIsFormOpen(true);
  };

  // Open Form Dialog to Edit
  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    reset({
      name: c.name,
      color: c.color
    });
    setIsFormOpen(true);
  };

  // Submit form action
  const onSubmitForm = async (data: CategoryFormValues) => {
    if (editingCategory?.id) {
      await updateCategory(editingCategory.id, data);
    } else {
      await addCategory(data);
    }
    setIsFormOpen(false);
    reset();
  };

  const handleDeleteConfirm = async () => {
    if (deletingCategory?.id) {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    }
  };

  // Helper metrics per Category
  const getCategoryMetrics = (catName: string) => {
    const catProducts = products.filter(p => p.category === catName);
    const totalQty = catProducts.reduce((sum, p) => sum + p.quantity, 0);
    const totalVal = catProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    return {
      count: catProducts.length,
      units: totalQty,
      value: totalVal
    };
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(value);
  };

  return (
    <div className="space-y-6 pt-16 md:pt-0 pb-10 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-100 uppercase tracking-tight">Catégories d'articles</h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wide">Classification thématique, étiquettes couleurs et totaux de répartition</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>CRÉER UNE CATÉGORIE</span>
        </Button>
      </div>

      {/* Grid of Category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length > 0 ? (
          categories.map((c) => {
            const metrics = getCategoryMetrics(c.name);
            return (
              <div 
                key={c.id} 
                className="bg-[#1E293B]/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300 shadow-lg flex flex-col justify-between"
              >
                
                {/* Visual Category Color stripe */}
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: c.color }} />

                {/* Card Title & custom menu */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center border font-semibold font-mono text-sm shadow-sm"
                      style={{ 
                        color: c.color, 
                        borderColor: `${c.color}25`,
                        backgroundColor: `${c.color}10` 
                      }}
                    >
                      <Tag className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-slate-100 uppercase tracking-wide truncate max-w-[150px]">{c.name}</h3>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-slate-900 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Category metrics list */}
                <div className="space-y-2.5 pt-2 border-t border-slate-900/40">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center"><Folder className="w-3.5 h-3.5 text-slate-550 mr-1.5" /> Modèles d'articles :</span>
                    <span className="font-mono font-semibold text-slate-200">{metrics.count} références</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center"><Hash className="w-3.5 h-3.5 text-slate-550 mr-1.5" /> Volume en stock :</span>
                    <span className="font-mono font-semibold text-slate-200">{metrics.units} unités</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center"><DollarSign className="w-3.5 h-3.5 text-slate-550 mr-1.5" /> Valeur cumulée :</span>
                    <span className="font-mono font-bold text-sky-400">{formatPrice(metrics.value)}</span>
                  </div>
                </div>

                {/* Subtext decorator */}
                <div className="mt-4 pt-3 border-t border-slate-900/20 text-[10px] font-mono text-slate-550 flex justify-between items-baseline">
                  <span>HEX COLOR CODE</span>
                  <span className="font-bold tracking-wider" style={{ color: c.color }}>{c.color.toUpperCase()}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="sm:col-span-2 lg:col-span-3 py-16 text-center bg-[#1E293B]/20 border border-slate-800 rounded-3xl p-6">
            <span className="text-slate-500 max-w-sm mx-auto block text-xs">
              📂 Aucune catégorie enregistrée. Enregistrez des catégories pour structurer et classifier vos fiches de produits d'inventaire.
            </span>
          </div>
        )}
      </div>

      {/* 1. DIALOG: CREATE OR EDIT CATEGORY MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px]">
                <Tag className="w-5 h-5 text-sky-400" />
                <span>{editingCategory ? 'Modifier la catégorie' : 'Créer une catégorie'}</span>
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-950/20 outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form inside Modal content */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
              <div>
                <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Libellé de la catégorie *</Label>
                <Input 
                  type="text" 
                  placeholder="ex. Électronique, Alimentation..."
                  {...register('name')}
                  className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                {errors.name && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.name.message}</p>}
              </div>

              {/* Color picker pallet */}
              <div>
                <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Couleur thématique *</Label>
                
                {/* Presets Grid */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue('color', color)}
                      className={`h-7 rounded-lg border focus:outline-none transition-transform active:scale-95
                        ${watchedColor === color ? 'border-white scale-110 shadow-sm' : 'border-slate-800/50 hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Custom Color picking text plus picker */}
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">#</span>
                    <input 
                      type="text"
                      value={watchedColor.replace('#', '')}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setValue('color', val.startsWith('#') ? val : `#${val}`);
                      }}
                      placeholder="38bdf8"
                      className="w-full pl-7 pr-3 py-1.5 bg-slate-950/40 border border-slate-850 text-slate-200 rounded-xl focus:border-sky-500 outline-none font-mono text-xs"
                    />
                  </div>
                  <input 
                    type="color"
                    value={watchedColor}
                    onChange={(e) => setValue('color', e.target.value)}
                    className="w-10 h-8 rounded-lg cursor-pointer bg-slate-950/40 border border-slate-800 p-0.5"
                  />
                </div>
                {errors.color && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.color.message}</p>}
              </div>

              {/* Custom Banner Color preview */}
              <div 
                className="p-3 rounded-xl border text-center text-[10px] font-mono uppercase font-bold tracking-widest bg-slate-950/15"
                style={{ 
                  color: watchedColor, 
                  borderColor: `${watchedColor}30`, 
                  backgroundColor: `${watchedColor}05` 
                }}
              >
                Aperçu de la catégorie
              </div>

              {/* Action Buttons footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <Button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-950/40 hover:bg-slate-850 border border-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DIALOG: DELETE CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              <h3 className="font-heading font-bold text-slate-100 text-[15px] underline">Supprimer la catégorie ?</h3>
            </div>

            {/* Validation checks: count how many products have this category */}
            {products.filter(p => p.category === deletingCategory.name).length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-red-200 leading-relaxed bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  🚨 Impossible d'effacer cette catégorie pour l'instant : Elle est associée à 
                  <b> {products.filter(p => p.category === deletingCategory.name).length} produit(s)</b> en stock right now. 
                  Veuillez modifier ou supprimer ces produits au préalable dans l'onglet Produits avant de d'effacer la catégorie.
                </p>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setDeletingCategory(null)}
                    className="bg-slate-800 hover:bg-slate-705 text-slate-350 font-bold px-5 py-2 rounded-xl text-xs"
                  >
                    Fermer la fenêtre
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Êtes-vous sûr de vouloir de supprimer la catégorie <b>"{deletingCategory.name}"</b> de l'inventaire ? 
                  Cette action aura pour effet de la retirer définitivement de la liste des classifications d'articles.
                </p>
                
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button
                    onClick={() => setDeletingCategory(null)}
                    className="bg-slate-950/40 hover:bg-slate-850 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleDeleteConfirm}
                    className="bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    Oui, Supprimer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
