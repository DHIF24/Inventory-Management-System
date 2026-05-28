import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Product } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Image, 
  ArrowUpDown,
  CornerDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Form validation schema using Zod
const productSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  sku: z.string().min(1, "Le SKU est requis").max(50),
  category: z.string().min(1, "La catégorie est requise"),
  description: z.string().max(800),
  quantity: z.number().min(0, "La quantité doit être supérieure ou égale à 0"),
  minStock: z.number().min(0, "Le seuil doit être supérieur ou égal à 0"),
  price: z.number().min(0, "Le prix doit être supérieur ou égal à 0"),
  supplier: z.string().min(1, "Le fournisseur est requis").max(100),
  imageUrl: z.string()
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductsView: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useData();

  // FILTERING, SEARCHING & COLOR SORTING STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'price'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // MODALS & ACTIONS CONTROL STORES
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // FORM SETUP
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      description: '',
      quantity: 0,
      minStock: 5,
      price: 0,
      supplier: '',
      imageUrl: ''
    }
  });

  // SKU generator
  const generateSKU = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `PRD-${randomNum}`;
  };

  // Open Form Dialog for Adding
  const handleOpenAdd = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: generateSKU(),
      category: categories[0]?.name || '',
      description: '',
      quantity: 0,
      minStock: 5,
      price: 0,
      supplier: '',
      imageUrl: ''
    });
    setIsFormOpen(true);
  };

  // Open Form Dialog for Editing
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    reset({
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: p.description || '',
      quantity: p.quantity,
      minStock: p.minStock,
      price: p.price,
      supplier: p.supplier,
      imageUrl: p.imageUrl || ''
    });
    setIsFormOpen(true);
  };

  // Save/Submit Form
  const onSubmitForm = async (data: ProductFormValues) => {
    if (editingProduct?.id) {
      await updateProduct(editingProduct.id, data);
    } else {
      await addProduct(data);
    }
    setIsFormOpen(false);
    reset();
  };

  // Submit Delete Product action
  const handleDeleteConfirm = async () => {
    if (deletingProduct?.id) {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  // COLOR GENERATOR FOR CHIPS AND BADGES
  const getCategoryColor = (catName: string): string => {
    const cat = categories.find(c => c.name === catName);
    return cat?.color || '#cbd5e1'; // default gray chip
  };

  // SORT TOGGLE LOGIC
  const toggleSort = (field: 'name' | 'quantity' | 'price') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // CALCULATE STATUS FOR BAGS
  const getProductStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return { label: 'Rupture', bg: 'bg-red-500/10 text-red-500 border-red-500/20' };
    if (quantity <= minStock) return { label: 'Stock Bas', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { label: 'En Stock', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  };

  // FILTERED & SORTED LIST COMPILATION
  const filteredProducts = products.filter(p => {
    // 1. Text Search query Matcher
    const searchString = `${p.name} ${p.sku} ${p.category}`.toLowerCase();
    const searchMatches = searchString.includes(searchTerm.toLowerCase());

    // 2. Category Matcher
    const categoryMatches = selectedCategory === 'ALL' || p.category === selectedCategory;

    // 3. Status Matcher
    const statusObj = getProductStatus(p.quantity, p.minStock);
    const statusMatches = selectedStatus === 'ALL' || 
      (selectedStatus === 'rupture' && p.quantity === 0) ||
      (selectedStatus === 'stock_bas' && p.quantity > 0 && p.quantity <= p.minStock) ||
      (selectedStatus === 'en_stock' && p.quantity > p.minStock);

    return searchMatches && categoryMatches && statusMatches;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let factor = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'name') {
      return factor * a.name.localeCompare(b.name);
    }
    if (sortField === 'quantity') {
      return factor * (a.quantity - b.quantity);
    }
    if (sortField === 'price') {
      return factor * (a.price - b.price);
    }
    return 0;
  });

  // PAGINATION CALCULATIONS
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(value);
  };

  return (
    <div className="space-y-6 pt-16 md:pt-0 pb-10 font-sans">
      
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-100 uppercase tracking-tight">Catalogue de Produits</h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wide">Fiches d'articles, inventaires et seuils de contrôle</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>AJOUTER UN PRODUIT</span>
        </Button>
      </div>

      {/* Realtime Filters Ribbon bar */}
      <div className="bg-[#1E293B]/40 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Search Input bar */}
        <div className="relative md:col-span-2">
          <label className="sr-only">Rechercher</label>
          <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-500" />
          <Input 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Rechercher par nom, SKU ou catégorie..." 
            className="pl-10 h-10 w-full bg-slate-950/20 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Categories Dropdown Filter */}
        <div>
          <label className="sr-only">Catégorie</label>
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 px-3 bg-slate-950/25 border border-slate-850 text-slate-200 text-xs rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
          >
            <option value="ALL">📦 Toutes les catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Dropdown Filter */}
        <div>
          <label className="sr-only">Statut de Stock</label>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 px-3 bg-slate-950/25 border border-slate-850 text-slate-200 text-xs rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
          >
            <option value="ALL">🚦 Tous les statuts</option>
            <option value="en_stock">✅ En stock suffisant</option>
            <option value="stock_bas">⚠️ Niveau de stock bas</option>
            <option value="rupture">🚨 Rupture de stock</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#1E293B]/20 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 bg-[#1E293B]/20 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-4 w-12"></th>
                <th className="py-4 px-3 w-32">Référence SKU</th>
                <th className="py-4 px-3 cursor-pointer select-none hover:text-sky-400 text-left" onClick={() => toggleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Désignation de l'article</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th className="py-4 px-3">Catégorie</th>
                <th className="py-4 px-3 cursor-pointer select-none hover:text-sky-400 w-32 text-center" onClick={() => toggleSort('quantity')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Quantité</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th className="py-4 px-3 cursor-pointer select-none hover:text-sky-400 w-32 text-right" onClick={() => toggleSort('price')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Prix Unit.</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th className="py-4 px-3 w-32 text-center">Alertes</th>
                <th className="py-4 px-4 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => {
                  const status = getProductStatus(p.quantity, p.minStock);
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/30 text-slate-350 transition-all duration-200">
                      
                      {/* Product Image Falling to Symbol */}
                      <td className="py-3 px-4">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="w-4.5 h-4.5 text-sky-500/80" />
                          )}
                        </div>
                      </td>

                      {/* SKU code */}
                      <td className="py-3 px-3 font-mono text-xs text-sky-400/90 font-medium">{p.sku}</td>
                      
                      {/* Product Name & Description */}
                      <td className="py-3 px-3">
                        <p className="font-heading font-semibold text-slate-100 text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[200px] mt-0.5">{p.description || 'Aucune description fournie'}</p>
                      </td>

                      {/* Categorization Badge */}
                      <td className="py-3 px-3">
                        <span 
                          className="px-2 py-0.5 rounded-full border text-[10px] uppercase font-semibold font-mono"
                          style={{
                            color: getCategoryColor(p.category),
                            borderColor: `${getCategoryColor(p.category)}25`,
                            backgroundColor: `${getCategoryColor(p.category)}10`
                          }}
                        >
                          {p.category}
                        </span>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3 text-center font-bold text-sm text-slate-200 font-mono">
                        {p.quantity} <span className="text-[10px] text-slate-500 font-normal font-sans">u.</span>
                      </td>

                      {/* Price unitaire */}
                      <td className="py-3 px-3 text-right font-mono text-sm text-slate-200 font-bold">
                        {formatPrice(p.price)}
                      </td>

                      {/* Control status chip alert */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border tracking-wide ${status.bg}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Row Actions - Edit & Remove */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            onClick={() => handleOpenEdit(p)}
                            className="bg-slate-950/50 hover:bg-slate-850 p-2 text-slate-400 hover:text-sky-400 border border-slate-850 rounded-lg h-8 w-8 transition-colors shrink-0"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => setDeletingProduct(p)}
                            className="bg-slate-950/50 hover:bg-red-500/10 p-2 text-slate-400 hover:text-red-400 border border-slate-850 rounded-lg h-8 w-8 transition-colors shrink-0"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    ❌ Aucun produit trouvé correspondant à vos critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination bottom drawer bar */}
        <div className="bg-[#1E293B]/20 border-t border-slate-850 py-3 px-6 flex items-center justify-between text-xs font-mono">
          <p className="text-slate-500">
            Affichage de <span className="text-slate-200 font-semibold">{paginatedProducts.length}</span> sur <span className="text-slate-200 font-semibold">{sortedProducts.length}</span> articles
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

      {/* 1. DIALOG: FORM MODAL FOR ADD / EDIT PRODUCTS */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px]">
                <Package className="w-5 h-5 text-sky-400" />
                <span>{editingProduct ? 'Modifier l\'article' : 'Enregistrer un nouvel article'}</span>
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-950/20 outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="overflow-y-auto p-6 space-y-4">
              
              {/* Name & SKU row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Désignation *</Label>
                  <Input 
                    type="text" 
                    placeholder="ex. Écran LCD 24 pouces"
                    {...register('name')}
                    className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  {errors.name && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.name.message}</p>}
                </div>
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Code SKU *</Label>
                  <Input 
                    type="text" 
                    placeholder="PRD-123456"
                    {...register('sku')}
                    className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500 cursor-not-allowed text-slate-400"
                    readOnly
                  />
                </div>
              </div>

              {/* Categorization & Supplier row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Catégorie d'article *</Label>
                  <select
                    {...register('category')}
                    className="w-full h-10 px-3 bg-slate-950/40 border border-slate-850 text-slate-200 text-xs rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
                  >
                    {categories.length > 0 ? (
                      categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <option value="">Sélectionner une catégorie</option>
                    )}
                  </select>
                  {errors.category && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.category.message}</p>}
                </div>
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Fournisseur *</Label>
                  <Input 
                    type="text" 
                    placeholder="ex. DistriTech France"
                    {...register('supplier')}
                    className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  {errors.supplier && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.supplier.message}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Description / Spécifications</Label>
                <textarea 
                  placeholder="Notes complémentaires sur l'article, caractéristiques..."
                  {...register('description')}
                  rows={2}
                  className="w-full p-3 bg-slate-950/40 border border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder-slate-650"
                />
              </div>

              {/* Stock quantities & critical threshold row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Quantité Initiale *</Label>
                  <Input 
                    type="number" 
                    step="1"
                    placeholder="0"
                    {...register('quantity', { valueAsNumber: true })}
                    className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500"
                  />
                  {errors.quantity && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.quantity.message}</p>}
                </div>
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Seuil Alerte (Min) *</Label>
                  <Input 
                    type="number" 
                    step="1"
                    placeholder="3"
                    {...register('minStock', { valueAsNumber: true })}
                    className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500"
                  />
                  {errors.minStock && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.minStock.message}</p>}
                </div>
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Prix unitaire (TND) *</Label>
                  <Input 
                    type="number" 
                    step="0.001"
                    placeholder="49.990"
                    {...register('price', { valueAsNumber: true })}
                    className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500"
                  />
                  {errors.price && <p className="text-[10px] text-red-400 mt-1 font-mono">{errors.price.message}</p>}
                </div>
              </div>

              {/* Image URL Optional */}
              <div>
                <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Lien URL Image (Optionnel)</Label>
                <Input 
                  type="text" 
                  placeholder="https://images.unsplash.com/photo-example..."
                  {...register('imageUrl')}
                  className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500"
                />
              </div>

              {/* Actions Footer */}
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
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              <h3 className="font-heading font-bold text-slate-100 text-[15px] underline">Supprimer l'article ?</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le produit <b>"{deletingProduct.name}"</b> SKU (<span className="font-mono text-[11px] text-sky-400 font-bold">{deletingProduct.sku}</span>) de la base de données ? 
              Toutes les quantites de ce produit seront perdues. Cette action est irréversible.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                onClick={() => setDeletingProduct(null)}
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
        </div>
      )}
    </div>
  );
};
