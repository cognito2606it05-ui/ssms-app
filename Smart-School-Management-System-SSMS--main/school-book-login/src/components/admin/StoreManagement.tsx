import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useApp, OperationType, handleFirestoreError } from '../../context/AppContext';
import { db, doc, setDoc, updateDoc } from '../../localDatabase';
import { StoreItem } from '../../types';

export const StoreManagement = () => {
  const { storeItems, setIsLoading, setNotification } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Stationery');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const newItem: StoreItem = {
      id: `ITEM-${Date.now()}`,
      name,
      category,
      quantity,
      minQuantity: 10,
      price,
      supplier: 'General Supplier',
      lastRestocked: new Date().toISOString().split('T')[0]
    };

    try {
      await setDoc(doc(db, 'storeItems', newItem.id), newItem);
      setNotification({ message: 'Item added to inventory', type: 'success' });
      setName('');
      setQuantity(0);
      setPrice(0);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'storeItems');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = storeItems.find(i => i.id === id);
    if (!item) return;

    try {
      await updateDoc(doc(db, 'storeItems', id), {
        quantity: Math.max(0, item.quantity + delta)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `storeItems/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Inventory Management</h3>
          <p className="text-xs text-stone-500">Manage school store and supplies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6">Add New Item</h4>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Item Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. School Tie"
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
              >
                <option value="Stationery">Stationery</option>
                <option value="Uniform">Uniform</option>
                <option value="Books">Books</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Quantity</label>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Price</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-stone-800 dark:bg-stone-700 text-white rounded-2xl font-bold shadow-lg hover:bg-stone-900 dark:hover:bg-stone-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Item
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800 font-bold text-stone-500 text-xs uppercase tracking-widest">
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {storeItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-500 dark:text-stone-500 italic">No items in inventory.</td>
                  </tr>
                ) : (
                  storeItems.map(item => (
                    <tr key={item.id} className="border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-stone-800 dark:text-stone-100">{item.name}</p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-500 uppercase font-bold tracking-widest">ID: {item.id}</p>
                      </td>
                      <td className="p-4 text-stone-600 dark:text-stone-400">{item.category}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${item.quantity <= item.minQuantity ? 'text-red-600 dark:text-red-400' : 'text-stone-800 dark:text-stone-100'}`}>
                            {item.quantity}
                          </span>
                          {item.quantity <= item.minQuantity && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-stone-800 dark:text-stone-100">${item.price}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 bg-stone-100 dark:bg-stone-800 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                          >
                            <Plus className="w-3 h-3 dark:text-stone-100" />
                          </button>
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 bg-stone-100 dark:bg-stone-800 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
