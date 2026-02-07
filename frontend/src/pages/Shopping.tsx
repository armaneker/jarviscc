import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, AlertCircle, ShoppingCart, X, Check, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { shoppingApi } from '../services/api';
import type { ShoppingItem, ShoppingItemCreate } from '../types';

const categoryColors: Record<string, string> = {
  groceries: 'bg-green-600',
  household: 'bg-blue-600',
  electronics: 'bg-purple-600',
  personal: 'bg-pink-600',
  pet: 'bg-orange-600',
  other: 'bg-slate-600',
};

export default function Shopping() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['shopping', selectedCategory],
    queryFn: () => shoppingApi.getAll({ category: selectedCategory || undefined }),
  });

  const { data: categories } = useQuery({
    queryKey: ['shopping-categories'],
    queryFn: shoppingApi.getCategories,
  });

  const addItemMutation = useMutation({
    mutationFn: shoppingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
      setShowAddModal(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: shoppingApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: shoppingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
    },
  });

  const clearPurchasedMutation = useMutation({
    mutationFn: shoppingApi.clearPurchased,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
    },
  });

  const pendingItems = items?.filter((i) => !i.purchased) || [];
  const purchasedItems = items?.filter((i) => i.purchased) || [];

  // Calculate total estimated price
  const totalEstimated = pendingItems.reduce(
    (sum, item) => sum + (item.estimated_price || 0) * item.quantity,
    0
  );

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Shopping List"
        subtitle={`${pendingItems.length} items to buy`}
        action={
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {purchasedItems.length > 0 && (
              <button
                onClick={() => clearPurchasedMutation.mutate()}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Purchased</span>
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        }
      />

      {/* Category Filter */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Estimated Total */}
      {totalEstimated > 0 && (
        <div className="mb-6 flex flex-col items-start gap-1 rounded-lg bg-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-400">Estimated Total</span>
          <span className="text-xl font-bold text-white sm:text-2xl">${totalEstimated.toFixed(2)}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-200">Failed to load shopping list.</span>
        </div>
      )}

      {/* Empty State */}
      {items && items.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-8 sm:p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Shopping list is empty</h3>
          <p className="text-slate-400 mb-6">
            Add items you need to buy for your home.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      )}

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">To Buy</h2>
          <div className="space-y-2">
            {pendingItems.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                onToggle={() => toggleMutation.mutate(item.id)}
                onDelete={() => deleteMutation.mutate(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Purchased Items */}
      {purchasedItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-400 mb-4">Purchased</h2>
          <div className="space-y-2 opacity-60">
            {purchasedItems.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                onToggle={() => toggleMutation.mutate(item.id)}
                onDelete={() => deleteMutation.mutate(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={(item) => addItemMutation.mutate(item)}
          isLoading={addItemMutation.isPending}
          categories={categories || []}
        />
      )}
    </div>
  );
}

// Shopping Item Card Component
interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
}

function ShoppingItemCard({ item, onToggle, onDelete }: ShoppingItemCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-start gap-3 sm:gap-4">
      <button
        onClick={onToggle}
        className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.purchased
            ? 'bg-green-500 border-green-500'
            : 'border-slate-500 hover:border-blue-500'
        }`}
      >
        {item.purchased && <Check className="w-4 h-4 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-white ${item.purchased ? 'line-through text-slate-400' : ''}`}
          >
            {item.item}
          </span>
          {item.quantity > 1 && (
            <span className="text-slate-400 text-sm">
              x{item.quantity} {item.unit}
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-xs text-white capitalize ${
              categoryColors[item.category] || categoryColors.other
            }`}
          >
            {item.category}
          </span>
        </div>
        {item.notes && (
          <p className="mt-1 break-words text-sm text-slate-400">{item.notes}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {item.estimated_price && (
          <span className="text-slate-300 font-medium text-sm sm:text-base">
            ${(item.estimated_price * item.quantity).toFixed(2)}
          </span>
        )}
        <button
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Add Item Modal
interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: ShoppingItemCreate) => void;
  isLoading: boolean;
  categories: string[];
}

function AddItemModal({ onClose, onAdd, isLoading, categories }: AddItemModalProps) {
  const [formData, setFormData] = useState<ShoppingItemCreate>({
    item: '',
    quantity: 1,
    category: 'groceries',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="bg-slate-800 rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Add Item</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Item</label>
            <input
              type="text"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Milk"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                placeholder="liters"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Price Est.</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_price || ''}
                onChange={(e) => setFormData({ ...formData, estimated_price: parseFloat(e.target.value) || undefined })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                placeholder="5.99"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white capitalize"
            >
              {categories.map((category) => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
