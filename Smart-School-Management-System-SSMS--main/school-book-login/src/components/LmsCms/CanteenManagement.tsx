import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Clock, 
  Search, Play, Check, X, ClipboardList, ChefHat, BarChart3, Package, AlertTriangle, Edit2 
} from 'lucide-react';
import { Card, KPICard, Table, SectionHeader } from './UI';
import { 
  getFoodItems, addFoodItem, updateFoodItem, deleteFoodItem,
  getOrders, placeOrder, updateOrderStatus 
} from '../../services/lmsCmsService';
import { FoodItem, Order, User as UserType } from '../../types';

export function CanteenManagement({ 
  loggedInUser, 
  activeTab: propActiveTab, 
  setActiveTab: propSetActiveTab 
}: { 
  loggedInUser: UserType | null; 
  activeTab?: string; 
  setActiveTab?: (tab: string) => void;
}) {
  const isAdmin = loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management' || loggedInUser?.role === 'Canteen Manager';

  // Map App.tsx activeAdminTab to CanteenManagement activeTab
  const mapPropToLocal = (tab: string | undefined): 'dashboard' | 'menu' | 'inventory' | 'pipeline' | 'history' | 'my-orders' => {
    if (!tab) return isAdmin ? 'dashboard' : 'menu';
    if (tab === 'canteen-dashboard' || tab === 'canteen') return 'dashboard';
    if (tab === 'canteen-menu') return 'menu';
    if (tab === 'canteen-inventory') return 'inventory';
    if (tab === 'canteen-incoming') return 'pipeline';
    if (tab === 'canteen-history') return 'history';
    
    // Fallback/standard tab names
    if (['dashboard', 'menu', 'inventory', 'pipeline', 'history', 'my-orders'].includes(tab)) {
      return tab as any;
    }
    return isAdmin ? 'dashboard' : 'menu';
  };

  const mapLocalToProp = (tab: string): string => {
    if (tab === 'dashboard') return 'canteen-dashboard';
    if (tab === 'menu') return 'canteen-menu';
    if (tab === 'inventory') return 'canteen-inventory';
    if (tab === 'pipeline') return 'canteen-incoming';
    if (tab === 'history') return 'canteen-history';
    return tab;
  };

  const [internalTab, setInternalTab] = useState<'dashboard' | 'menu' | 'inventory' | 'pipeline' | 'history' | 'my-orders'>(
    isAdmin ? 'dashboard' : 'menu'
  );

  const activeTab = propActiveTab ? mapPropToLocal(propActiveTab) : internalTab;
  const setActiveTab = (tab: any) => {
    if (propSetActiveTab) {
      propSetActiveTab(mapLocalToProp(tab));
    } else {
      setInternalTab(tab);
    }
  };

  // Common states
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin/Canteen states
  const [orders, setOrders] = useState<Order[]>([]);

  // Cart state for Student: [ { food_item_id, name, price, quantity, maxQuantity } ]
  const [cart, setCart] = useState<any[]>([]);

  // Menu Form Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formQuantity, setFormQuantity] = useState(0);
  const [formThreshold, setFormThreshold] = useState(5);
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await getFoodItems();
      // Apply filters
      let filtered = items;
      if (searchQuery) {
        filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      if (selectedCategory) {
        filtered = filtered.filter(f => f.category === selectedCategory);
      }
      setFoodItems(filtered);

      const uniqueCats = Array.from(new Set(items.map(f => f.category)));
      setCategories(uniqueCats);

      const allOrders = await getOrders();
      if (isAdmin) {
        setOrders(allOrders);
      } else if (loggedInUser) {
        setOrders(allOrders.filter(o => o.student_id === loggedInUser.user_id));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load canteen data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, activeTab]);

  // Cart Operations
  const addToCart = (item: FoodItem) => {
    if (item.quantity <= 0) {
      toast.error('Item is currently out of stock');
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.food_item_id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity) {
          toast.error(`Only ${item.quantity} units available`);
          return prev;
        }
        toast.success(`Incremented quantity for ${item.name}`);
        return prev.map(c => c.food_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      toast.success(`${item.name} added to cart`);
      return [...prev, { food_item_id: item.id, name: item.name, price: item.price, quantity: 1, maxQuantity: item.quantity }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.food_item_id === id) {
          const next = c.quantity + delta;
          if (next <= 0) return null;
          if (next > c.maxQuantity) {
            toast.error(`Only ${c.maxQuantity} available`);
            return c;
          }
          return { ...c, quantity: next };
        }
        return c;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.food_item_id !== id));
    toast.success('Removed from cart');
  };

  const handleCheckout = async () => {
    if (!loggedInUser) return;
    if (cart.length === 0) return;
    try {
      const checkoutItems = cart.map(c => ({
        food_item_id: c.food_item_id,
        food_item_name: c.name,
        quantity: c.quantity,
        price: c.price
      }));
      await placeOrder(loggedInUser.user_id, loggedInUser.name, checkoutItems);
      toast.success('Order placed successfully!');
      setCart([]);
      loadData();
    } catch (e) {
      toast.error('Failed to checkout order');
    }
  };

  // Canteen Menu CRUD
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCategory || formPrice <= 0) {
      toast.error('Please enter valid catalog details');
      return;
    }
    const payload = {
      name: formName,
      category: formCategory,
      price: Number(formPrice),
      quantity: Number(formQuantity),
      low_stock_threshold: Number(formThreshold),
      description: formDescription,
      image_url: formImageUrl || undefined
    };
    try {
      if (selectedFoodItem) {
        await updateFoodItem(selectedFoodItem.id, payload, loggedInUser?.user_id || 'system');
        toast.success('Menu item updated');
      } else {
        await addFoodItem(payload, loggedInUser?.user_id || 'system');
        toast.success('Menu item added');
      }
      setIsMenuModalOpen(false);
      loadData();
    } catch (e) {
      toast.error('Failed to save food menu item');
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteFoodItem(id, loggedInUser?.user_id || 'system');
      toast.success('Item deleted successfully');
      loadData();
    } catch (e) {
      toast.error('Failed to delete item');
    }
  };

  const openEditMenuModal = (item: FoodItem) => {
    setSelectedFoodItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormQuantity(item.quantity);
    setFormThreshold(item.low_stock_threshold);
    setFormDescription(item.description || '');
    setFormImageUrl(item.image_url || '');
    setIsMenuModalOpen(true);
  };

  const openCreateMenuModal = () => {
    setSelectedFoodItem(null);
    setFormName('');
    setFormCategory('');
    setFormPrice(0);
    setFormQuantity(0);
    setFormThreshold(5);
    setFormDescription('');
    setFormImageUrl('');
    setIsMenuModalOpen(true);
  };

  // Pipeline status advance
  const handleAdvanceStatus = async (orderId: string, currentStatus: Order['status']) => {
    let nextStatus: Order['status'] = 'Pending';
    if (currentStatus === 'Pending') nextStatus = 'Preparing';
    else if (currentStatus === 'Preparing') nextStatus = 'Ready';
    else if (currentStatus === 'Ready') nextStatus = 'Delivered';
    else return;

    try {
      await updateOrderStatus(orderId, nextStatus, loggedInUser?.user_id || 'system');
      toast.success(`Order status updated to ${nextStatus}`);
      loadData();
    } catch (e) {
      toast.error('Failed to advance order status');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await updateOrderStatus(orderId, 'Cancelled', loggedInUser?.user_id || 'system');
      toast.success('Order cancelled');
      loadData();
    } catch (e) {
      toast.error('Failed to cancel order');
    }
  };

  // KPI calculations
  const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready').length;
  const lowStockCount = foodItems.filter(f => f.quantity <= f.low_stock_threshold).length;

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Smart Canteen Dashboard" 
        subtitle="Manage food catalogs, track real-time kitchen pipelines, monitor inventory levels and check student orders."
        theme="canteen"
      />

      {/* KPI Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Total Sales Volume" value={`$${totalRevenue}`} icon={BarChart3} description="Total completed revenue" />
        <KPICard title="Orders In Queue" value={pendingOrdersCount} icon={ChefHat} description="Active kitchen tickets" />
        <KPICard title="Low Stock Items" value={lowStockCount} icon={Package} description="Below threshold count" />
        <KPICard title="Menu Varieties" value={foodItems.length} icon={ClipboardList} description="Total menu items" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 w-fit overflow-x-auto max-w-full">
        {isAdmin ? (
          <>
            <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('menu')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'menu' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Menu Management</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Inventory Management</button>
            <button onClick={() => setActiveTab('pipeline')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'pipeline' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Incoming Orders</button>
            <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Order History</button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('menu')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'menu' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Canteen Menu</button>
            <button onClick={() => setActiveTab('my-orders')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'my-orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>My Orders</button>
          </>
        )}
      </div>

      {/* TAB VIEWS */}
      {activeTab === 'dashboard' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders Card */}
          <Card className="flex flex-col h-[400px]">
            <div className="flex items-center gap-2 border-b border-stone-50 pb-3 dark:border-stone-850">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-white">Recent Transactions</h3>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 divide-y divide-stone-50 dark:divide-stone-800">
              {orders.slice(-5).reverse().map((o) => (
                <div key={o.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-white">Order #{o.id.substring(0, 8)}</p>
                    <p className="text-[10px] text-stone-500">Student: {o.student_name} (${o.total_amount})</p>
                  </div>
                  <div className="text-right text-[10px]">
                    <p className="text-stone-500">{new Date(o.created_at).toLocaleTimeString()}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : o.status === 'Cancelled' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-center text-xs text-stone-500 py-12">No recent canteen orders found.</p>
              )}
            </div>
          </Card>

          {/* Low Stock Warning Card */}
          <Card className="flex flex-col h-[400px]">
            <div className="flex items-center gap-2 border-b border-stone-50 pb-3 dark:border-stone-850">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-white">Inventory Warning Alerts</h3>
              <span className="ml-auto bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {foodItems.filter(f => f.quantity <= f.low_stock_threshold).length} warnings
              </span>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 divide-y divide-stone-50 dark:divide-stone-800">
              {foodItems.filter(f => f.quantity <= f.low_stock_threshold).map((f) => (
                <div key={f.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-white">{f.name}</p>
                    <p className="text-[10px] text-stone-500">Category: {f.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${f.quantity === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                      {f.quantity === 0 ? 'Out of Stock' : `${f.quantity} units`}
                    </p>
                    <p className="text-[9px] text-stone-500">Threshold: {f.low_stock_threshold}</p>
                  </div>
                </div>
              ))}
              {foodItems.filter(f => f.quantity <= f.low_stock_threshold).length === 0 && (
                <p className="text-center text-xs text-stone-500 py-12 text-emerald-600 font-bold">All inventory items are in stock.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {isAdmin && (
                <button onClick={openCreateMenuModal} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {foodItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
                  <div className="h-32 bg-stone-100 dark:bg-stone-950 overflow-hidden relative">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=60'} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[8px] font-bold px-2.5 py-0.5 rounded-full">{item.category}</span>
                    <span className="absolute top-2.5 right-2.5 bg-slate-950/80 text-white font-black px-2 py-0.5 rounded-lg text-[10px]">${item.price}</span>
                  </div>
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-stone-800 dark:text-stone-100">{item.name}</h4>
                      <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="pt-3 border-t border-stone-50 dark:border-stone-800/40 flex items-center justify-between text-[10px]">
                      <span className={`font-bold ${item.quantity <= 0 ? 'text-red-500' : item.quantity <= item.low_stock_threshold ? 'text-orange-500 font-bold' : 'text-stone-500'}`}>
                        {item.quantity <= 0 ? 'Out of Stock' : `${item.quantity} available`}
                      </span>
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <button onClick={() => openEditMenuModal(item)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteMenu(item.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)} disabled={item.quantity <= 0} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                          Add to Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar for Students */}
          {!isAdmin && (
            <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-6 rounded-3xl h-fit space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-stone-50 pb-3 dark:border-stone-800">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-800 dark:text-white">Active Order Cart</h3>
                <span className="ml-auto bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {cart.reduce((sum, c) => sum + c.quantity, 0)} items
                </span>
              </div>
              <div className="divide-y divide-stone-50 dark:divide-stone-800 max-h-80 overflow-y-auto space-y-3">
                {cart.map(c => (
                  <div key={c.food_item_id} className="flex items-center justify-between py-2">
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-xs font-bold text-stone-850 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">${c.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden bg-stone-50 dark:bg-stone-950">
                        <button onClick={() => updateCartQty(c.food_item_id, -1)} className="px-1.5 py-1 text-stone-500 hover:bg-stone-100"><Minus className="w-3 h-3" /></button>
                        <span className="px-2 text-xs font-bold text-stone-800 dark:text-stone-100">{c.quantity}</span>
                        <button onClick={() => updateCartQty(c.food_item_id, 1)} className="px-1.5 py-1 text-stone-500 hover:bg-stone-100"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(c.food_item_id)} className="p-1 text-stone-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="text-center text-xs text-stone-500 py-12">Your cart is currently empty.</p>
                )}
              </div>
              {cart.length > 0 && (
                <div className="border-t border-stone-100 pt-4 dark:border-stone-800 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-stone-500">Total Bill:</span>
                    <span className="text-stone-800 dark:text-stone-100 text-sm">${cart.reduce((sum, c) => sum + (c.price * c.quantity), 0).toFixed(2)}</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg hover:bg-emerald-700 flex items-center justify-center gap-2">
                    Checkout Order <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* KITCHEN PIPELINE */}
      {activeTab === 'pipeline' && isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Pending */}
          <div className="bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-3xl border border-stone-200/50 dark:border-stone-800 space-y-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500" /> Pending ({orders.filter(o => o.status === 'Pending').length})</h4>
            <div className="space-y-3">
              {orders.filter(o => o.status === 'Pending').map(o => (
                <div key={o.id} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-4 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>Order: {o.id.substring(0, 6)}</span>
                    <span>${o.total_amount}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">Student: {o.student_name}</p>
                  <div className="flex justify-between gap-2 pt-2 border-t border-stone-50 dark:border-stone-800/40">
                    <button onClick={() => handleCancelOrder(o.id)} className="flex-1 py-1 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 text-[10px] rounded-lg font-bold">Cancel</button>
                    <button onClick={() => handleAdvanceStatus(o.id, 'Pending')} className="flex-1 py-1 bg-blue-600 text-white text-[10px] rounded-lg font-bold flex items-center justify-center gap-1"><Play className="w-3 h-3" /> Prepare</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparing */}
          <div className="bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-3xl border border-stone-200/50 dark:border-stone-800 space-y-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5"><ChefHat className="w-4 h-4 text-yellow-500" /> Preparing ({orders.filter(o => o.status === 'Preparing').length})</h4>
            <div className="space-y-3">
              {orders.filter(o => o.status === 'Preparing').map(o => (
                <div key={o.id} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-4 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>Order: {o.id.substring(0, 6)}</span>
                    <span>${o.total_amount}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">Student: {o.student_name}</p>
                  <button onClick={() => handleAdvanceStatus(o.id, 'Preparing')} className="w-full py-1.5 bg-yellow-500 text-white text-[10px] rounded-lg font-bold flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> Mark Ready</button>
                </div>
              ))}
            </div>
          </div>

          {/* Ready */}
          <div className="bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-3xl border border-stone-200/50 dark:border-stone-800 space-y-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5"><ChefHat className="w-4 h-4 text-emerald-500" /> Ready to Serve ({orders.filter(o => o.status === 'Ready').length})</h4>
            <div className="space-y-3">
              {orders.filter(o => o.status === 'Ready').map(o => (
                <div key={o.id} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-4 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>Order: {o.id.substring(0, 6)}</span>
                    <span>${o.total_amount}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">Student: {o.student_name}</p>
                  <button onClick={() => handleAdvanceStatus(o.id, 'Ready')} className="w-full py-1.5 bg-emerald-600 text-white text-[10px] rounded-lg font-bold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Deliver</button>
                </div>
              ))}
            </div>
          </div>

          {/* Delivered / Cancelled */}
          <div className="bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-3xl border border-stone-200/50 dark:border-stone-800 space-y-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-stone-500" /> Closed ({orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled').length})</h4>
            <div className="space-y-3">
              {orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled').slice(0, 10).map(o => (
                <div key={o.id} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-4 rounded-2xl space-y-2 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>ID: {o.id.substring(0, 6)}</span>
                    <span className={o.status === 'Delivered' ? 'text-emerald-600' : 'text-red-500'}>{o.status}</span>
                  </div>
                  <p className="text-[10px] text-stone-500">Student: {o.student_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY MONITOR */}
      {activeTab === 'inventory' && isAdmin && (
        <Table
          title="Canteen Inventory Stock Roster"
          data={foodItems}
          columns={[
            { header: 'Item Name', accessor: 'name', render: (row: FoodItem) => <span className="font-bold">{row.name}</span> },
            { header: 'Category', accessor: 'category' },
            { header: 'Unit Price', render: (row: FoodItem) => <span>${row.price}</span> },
            { 
              header: 'Current Stock', 
              render: (row: FoodItem) => (
                <span className={`font-bold ${row.quantity <= 0 ? 'text-red-500' : row.quantity <= row.low_stock_threshold ? 'text-orange-500' : 'text-stone-750 dark:text-stone-300'}`}>
                  {row.quantity} units
                </span>
              ) 
            },
            { 
              header: 'Stock Warning Status', 
              render: (row: FoodItem) => row.quantity <= 0 ? (
                <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Out of stock</span>
              ) : row.quantity <= row.low_stock_threshold ? (
                <span className="text-orange-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Low stock alert</span>
              ) : (
                <span className="text-emerald-600 font-bold">In stock</span>
              ) 
            }
          ]}
        />
      )}

      {/* MY ORDERS */}
      {activeTab === 'my-orders' && !isAdmin && (
        <div className="space-y-6">
          <Table
            title="My Orders History"
            data={orders}
            columns={[
              { header: 'Order ID', render: (row) => <span>{row.id.substring(0, 8)}...</span> },
              { header: 'Placed Time', render: (row) => <span>{new Date(row.created_at).toLocaleString()}</span> },
              { header: 'Total Price', render: (row) => <span className="font-bold">${row.total_amount}</span> },
              { 
                header: 'Delivery Status', 
                render: (row) => (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : row.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/20' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20'}`}>
                    {row.status}
                  </span>
                ) 
              }
            ]}
          />
        </div>
      )}

      {activeTab === 'history' && isAdmin && (
        <Table
          title="All Canteen Orders History"
          data={orders}
          columns={[
            { header: 'Order ID', render: (row: Order) => <span>{row.id.substring(0, 8)}...</span> },
            { header: 'Student Name', accessor: 'student_name', render: (row: Order) => <span className="font-bold">{row.student_name}</span> },
            { header: 'Placed Time', render: (row: Order) => <span>{new Date(row.created_at).toLocaleString()}</span> },
            { header: 'Total Bill', render: (row: Order) => <span className="font-bold">${row.total_amount.toFixed(2)}</span> },
            { 
              header: 'Status', 
              render: (row: Order) => (
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  row.status === 'Delivered' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                    : row.status === 'Cancelled' 
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/20' 
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20'
                }`}>
                  {row.status}
                </span>
              ) 
            }
          ]}
        />
      )}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-800 dark:text-white">{selectedFoodItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="p-1 hover:bg-stone-50 rounded-lg text-stone-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveMenu} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-stone-450 uppercase block mb-1">Item Name *</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Category *</label>
                  <input type="text" required value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Price ($) *</label>
                  <input type="number" step="0.01" required value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Stock Qty *</label>
                  <input type="number" required value={formQuantity} onChange={e => setFormQuantity(Number(e.target.value))} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Low Stock Warning Threshold *</label>
                  <input type="number" required value={formThreshold} onChange={e => setFormThreshold(Number(e.target.value))} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Image URL</label>
                <input type="text" value={formImageUrl} onChange={e => setFormImageUrl(e.target.value)} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700">Save Item</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
