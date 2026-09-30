import axios from 'axios';
import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, getDoc } from '../localDatabase';
import { INITIAL_BOOKS, INITIAL_FOOD_ITEMS } from '../constants';
import { Book, FoodItem, Order, OrderItem, BorrowRecord, AuditLog } from '../types';

const VITE_BACKEND_MODE = (import.meta as any).env?.VITE_BACKEND_MODE || 'local';
const API_URL = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function initializeMockDatabase() {
  const stored = localStorage.getItem('school_book_db_v6');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      let changed = false;
      if (!data.books || Object.keys(data.books).length === 0) {
        data.books = {};
        INITIAL_BOOKS.forEach(b => {
          data.books[b.id] = b;
        });
        changed = true;
      }
      if (!data.foodItems || Object.keys(data.foodItems).length === 0) {
        data.foodItems = {};
        INITIAL_FOOD_ITEMS.forEach(f => {
          data.foodItems[f.id] = f;
        });
        changed = true;
      }
      if (!data.borrows || Object.keys(data.borrows).length === 0) {
        data.borrows = {
          "BR-001": {
            id: "BR-001",
            student_id: "U-S0",
            student_name: "Amit Kumar",
            book_id: "B-001",
            book_title: "Clean Code",
            issue_date: "2026-05-20",
            due_date: "2026-06-03",
            fine_amount: 0,
            fine_status: "None"
          },
          "BR-002": {
            id: "BR-002",
            student_id: "U-S1",
            student_name: "Neha Sharma",
            book_id: "B-003",
            book_title: "The Hobbit",
            issue_date: "2026-05-10",
            due_date: "2026-05-24",
            fine_amount: 12.00,
            fine_status: "Pending"
          },
          "BR-003": {
            id: "BR-003",
            student_id: "U-S2",
            student_name: "Vikram Singh",
            book_id: "B-004",
            book_title: "A Brief History of Time",
            issue_date: "2026-05-01",
            due_date: "2026-05-15",
            return_date: "2026-05-18",
            fine_amount: 6.00,
            fine_status: "Paid"
          },
          "BR-004": {
            id: "BR-004",
            student_id: "U-S3",
            student_name: "Priya Patel",
            book_id: "B-006",
            book_title: "The Alchemist",
            issue_date: "2026-05-15",
            due_date: "2026-05-29",
            return_date: "2026-05-28",
            fine_amount: 0,
            fine_status: "None"
          }
        };
        changed = true;
      }
      if (!data.reservations || Object.keys(data.reservations).length === 0) {
        data.reservations = {
          "RS-001": {
            id: "RS-001",
            student_id: "U-S4",
            student_name: "Rahul Verma",
            book_id: "B-004",
            book_title: "A Brief History of Time",
            status: "Pending",
            reservation_date: "2026-05-29T10:30:00.000Z"
          },
          "RS-002": {
            id: "RS-002",
            student_id: "U-S5",
            student_name: "Sneha Reddy",
            book_id: "B-001",
            book_title: "Clean Code",
            status: "Approved",
            reservation_date: "2026-05-28T14:20:00.000Z"
          }
        };
        changed = true;
      }
      if (!data.orders || Object.keys(data.orders).length === 0) {
        data.orders = {
          "OR-001": {
            id: "OR-001",
            student_id: "U-S0",
            student_name: "Amit Kumar",
            status: "Pending",
            total_amount: 14.50,
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
          },
          "OR-002": {
            id: "OR-002",
            student_id: "U-S1",
            student_name: "Neha Sharma",
            status: "Preparing",
            total_amount: 8.00,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          },
          "OR-003": {
            id: "OR-003",
            student_id: "U-S2",
            student_name: "Vikram Singh",
            status: "Ready",
            total_amount: 12.00,
            created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          },
          "OR-004": {
            id: "OR-004",
            student_id: "U-S3",
            student_name: "Priya Patel",
            status: "Delivered",
            total_amount: 6.50,
            created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString()
          }
        };
        changed = true;
      }
      if (!data.orderItems || Object.keys(data.orderItems).length === 0) {
        data.orderItems = {
          "OI-001": {
            id: "OI-001",
            order_id: "OR-001",
            food_item_id: "F-001",
            food_item_name: "Cheese Burger",
            quantity: 2,
            price_at_order: 5.50
          },
          "OI-002": {
            id: "OI-002",
            order_id: "OR-001",
            food_item_id: "F-003",
            food_item_name: "French Fries",
            quantity: 1,
            price_at_order: 3.50
          },
          "OI-003": {
            id: "OI-003",
            order_id: "OR-002",
            food_item_id: "F-002",
            food_item_name: "Veg Sandwich",
            quantity: 2,
            price_at_order: 4.00
          },
          "OI-004": {
            id: "OI-004",
            order_id: "OR-003",
            food_item_id: "F-005",
            food_item_name: "Samosa Combo",
            quantity: 2,
            price_at_order: 6.00
          },
          "OI-005": {
            id: "OI-005",
            order_id: "OR-004",
            food_item_id: "F-004",
            food_item_name: "Fruit Salad",
            quantity: 1,
            price_at_order: 6.50
          }
        };
        changed = true;
      }
      if (!data.auditLogs) {
        data.auditLogs = {};
        changed = true;
      }
      if (changed) {
        localStorage.setItem('school_book_db_v6', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Failed to initialize mock DB:", e);
    }
  }
}

const isApiMode = () => VITE_BACKEND_MODE === 'api';

async function logAction(userId: string, action: string, entityType: string, entityId: string, details: string) {
  if (isApiMode()) {
    try {
      await apiClient.post('/audit-logs/', { action, entity_type: entityType, entity_id: entityId, details });
    } catch (e) {
      console.error("API logging failed:", e);
    }
  } else {
    const newLog: Omit<AuditLog, 'id'> = {
      user_id: userId,
      timestamp: new Date().toISOString(),
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    };
    await addDoc(collection(db, 'auditLogs'), newLog);
  }
}

// --- BOOKS SERVICES ---
export async function getBooks(search = '', category = ''): Promise<{ data: Book[]; total: number; pages: number }> {
  if (isApiMode()) {
    const res = await apiClient.get('/books/', { params: { search, category } });
    return res.data;
  } else {
    const snap = await getDocs(collection(db, 'books'));
    let list: Book[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q));
    }
    if (category) {
      list = list.filter(b => b.category === category);
    }
    return { data: list, total: list.length, pages: 1 };
  }
}

export async function getBooksCategories(): Promise<string[]> {
  if (isApiMode()) {
    const res = await apiClient.get('/books/categories');
    return res.data;
  } else {
    const snap = await getDocs(collection(db, 'books'));
    const list: Book[] = snap.docs.map((d: any) => d.data());
    const cats = Array.from(new Set(list.map(b => b.category)));
    return cats;
  }
}

export async function addBook(book: Omit<Book, 'id' | 'available_quantity'>, userId: string): Promise<Book> {
  const payload = { ...book, available_quantity: book.quantity };
  if (isApiMode()) {
    const res = await apiClient.post('/books/', payload);
    return res.data;
  } else {
    const ref = await addDoc(collection(db, 'books'), payload);
    const added = { id: ref.id, ...payload } as Book;
    await logAction(userId, 'CREATE', 'Book', ref.id, `Added book "${book.title}" to catalog.`);
    return added;
  }
}

export async function updateBook(id: string, book: Partial<Book>, userId: string): Promise<Book> {
  if (isApiMode()) {
    const res = await apiClient.put(`/books/${id}`, book);
    return res.data;
  } else {
    await updateDoc(doc(db, 'books', id), book);
    const snap = await getDoc(doc(db, 'books', id));
    await logAction(userId, 'UPDATE', 'Book', id, `Updated book "${snap.data().title}".`);
    return { id, ...snap.data() } as Book;
  }
}

export async function deleteBook(id: string, userId: string): Promise<void> {
  if (isApiMode()) {
    await apiClient.delete(`/books/${id}`);
  } else {
    const snap = await getDoc(doc(db, 'books', id));
    const title = snap.data()?.title || id;
    await deleteDoc(doc(db, 'books', id));
    await logAction(userId, 'DELETE', 'Book', id, `Deleted book "${title}".`);
  }
}

// --- BORROWS & RESERVATIONS SERVICES ---
export async function getBorrows(): Promise<BorrowRecord[]> {
  if (isApiMode()) {
    const res = await apiClient.get('/borrows/');
    return res.data;
  } else {
    const snap = await getDocs(collection(db, 'borrows'));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
}

export async function getReservations(): Promise<any[]> {
  if (isApiMode()) {
    const res = await apiClient.get('/borrows/reservations');
    return res.data;
  } else {
    const snap = await getDocs(collection(db, 'reservations'));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
}

export async function issueBook(studentId: string, studentName: string, bookId: string, userId: string): Promise<BorrowRecord> {
  if (isApiMode()) {
    const res = await apiClient.post('/borrows/issue', { student_id: studentId, book_id: bookId });
    return res.data;
  } else {
    const bookSnap = await getDoc(doc(db, 'books', bookId));
    const book = bookSnap.data();
    if (!book || book.available_quantity <= 0) {
      throw new Error('Book is not available for issue');
    }

    // Decrement available qty
    await updateDoc(doc(db, 'books', bookId), {
      available_quantity: book.available_quantity - 1
    });

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14); // 14 days borrow period

    const payload: Omit<BorrowRecord, 'id'> = {
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_title: book.title,
      issue_date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      fine_amount: 0.0,
      fine_status: 'None'
    };

    const ref = await addDoc(collection(db, 'borrows'), payload);
    await logAction(userId, 'ISSUE', 'Book', bookId, `Issued "${book.title}" to student ${studentName} (${studentId}).`);
    return { id: ref.id, ...payload };
  }
}

export async function returnBook(borrowId: string, userId: string): Promise<BorrowRecord> {
  if (isApiMode()) {
    const res = await apiClient.post(`/borrows/return/${borrowId}`);
    return res.data;
  } else {
    const borrowSnap = await getDoc(doc(db, 'borrows', borrowId));
    const borrow = borrowSnap.data();
    if (!borrow || borrow.return_date) {
      throw new Error('Borrow record not found or already returned');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate = new Date(borrow.due_date);
    const returnDate = new Date(todayStr);

    let fine = 0;
    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 2.0; // $2 fine per day
    }

    // Update borrow record
    const updates: Partial<BorrowRecord> = {
      return_date: todayStr,
      fine_amount: fine,
      fine_status: fine > 0 ? 'Pending' : 'None'
    };
    await updateDoc(doc(db, 'borrows', borrowId), updates);

    // Re-increment book availability
    const bookSnap = await getDoc(doc(db, 'books', borrow.book_id));
    const book = bookSnap.data();
    if (book) {
      await updateDoc(doc(db, 'books', borrow.book_id), {
        available_quantity: Math.min(book.quantity, book.available_quantity + 1)
      });
    }

    await logAction(userId, 'RETURN', 'Book', borrow.book_id, `Returned "${borrow.book_title}" from student ${borrow.student_name}. Fine: $${fine}.`);
    return { id: borrowId, ...borrow, ...updates };
  }
}

export async function settleFine(borrowId: string, userId: string): Promise<BorrowRecord> {
  if (isApiMode()) {
    const res = await apiClient.post(`/borrows/${borrowId}/settle-fine`);
    return res.data;
  } else {
    const borrowSnap = await getDoc(doc(db, 'borrows', borrowId));
    const borrow = borrowSnap.data();
    if (!borrow) {
      throw new Error('Borrow record not found');
    }
    const updates: Partial<BorrowRecord> = {
      fine_status: 'Paid'
    };
    await updateDoc(doc(db, 'borrows', borrowId), updates);
    await logAction(userId, 'SETTLE_FINE', 'Borrow', borrowId, `Settled fine of $${borrow.fine_amount} for student ${borrow.student_name}.`);
    return { id: borrowId, ...borrow, ...updates };
  }
}

export async function reserveBook(studentId: string, studentName: string, bookId: string, bookTitle: string): Promise<any> {
  if (isApiMode()) {
    const res = await apiClient.post(`/borrows/books/${bookId}/reserve`);
    return res.data;
  } else {
    const payload = {
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_title: bookTitle,
      status: 'Pending',
      reservation_date: new Date().toISOString()
    };
    const ref = await addDoc(collection(db, 'reservations'), payload);
    await logAction(studentId, 'RESERVE', 'Book', bookId, `Reserved "${bookTitle}" by student ${studentName}.`);
    return { id: ref.id, ...payload };
  }
}

export async function updateReservation(reservationId: string, status: 'Approved' | 'Rejected' | 'Returned', userId: string): Promise<any> {
  if (isApiMode()) {
    const res = await apiClient.put(`/borrows/reservations/${reservationId}`, { status });
    return res.data;
  } else {
    await updateDoc(doc(db, 'reservations', reservationId), { status });
    const snap = await getDoc(doc(db, 'reservations', reservationId));
    const resv = snap.data();
    await logAction(userId, 'UPDATE_RESERVATION', 'Reservation', reservationId, `Set reservation status for "${resv.book_title}" to ${status}.`);
    return { id: reservationId, ...resv };
  }
}

// --- CANTEEN FOOD ITEMS ---
export async function getFoodItems(): Promise<FoodItem[]> {
  if (isApiMode()) {
    const res = await apiClient.get('/food-items/');
    return res.data;
  } else {
    const snap = await getDocs(collection(db, 'foodItems'));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
}

export async function addFoodItem(item: Omit<FoodItem, 'id'>, userId: string): Promise<FoodItem> {
  if (isApiMode()) {
    const res = await apiClient.post('/food-items/', item);
    return res.data;
  } else {
    const ref = await addDoc(collection(db, 'foodItems'), item);
    const added = { id: ref.id, ...item } as FoodItem;
    await logAction(userId, 'CREATE', 'FoodItem', ref.id, `Added food item "${item.name}" to menu.`);
    return added;
  }
}

export async function updateFoodItem(id: string, item: Partial<FoodItem>, userId: string): Promise<FoodItem> {
  if (isApiMode()) {
    const res = await apiClient.put(`/food-items/${id}`, item);
    return res.data;
  } else {
    await updateDoc(doc(db, 'foodItems', id), item);
    const snap = await getDoc(doc(db, 'foodItems', id));
    await logAction(userId, 'UPDATE', 'FoodItem', id, `Updated food item "${snap.data().name}".`);
    return { id, ...snap.data() } as FoodItem;
  }
}

export async function deleteFoodItem(id: string, userId: string): Promise<void> {
  if (isApiMode()) {
    await apiClient.delete(`/food-items/${id}`);
  } else {
    const snap = await getDoc(doc(db, 'foodItems', id));
    const name = snap.data()?.name || id;
    await deleteDoc(doc(db, 'foodItems', id));
    await logAction(userId, 'DELETE', 'FoodItem', id, `Deleted food item "${name}" from menu.`);
  }
}

// --- CANTEEN ORDERS ---
export async function getOrders(): Promise<Order[]> {
  if (isApiMode()) {
    const res = await apiClient.get('/orders/');
    return res.data;
  } else {
    const snap = await getDocs(collection(db, 'orders'));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
}

export async function placeOrder(studentId: string, studentName: string, items: { food_item_id: string; food_item_name: string; quantity: number; price: number }[]): Promise<Order> {
  if (isApiMode()) {
    const payload = {
      items: items.map(i => ({ food_item_id: i.food_item_id, quantity: i.quantity }))
    };
    const res = await apiClient.post('/orders/', payload);
    return res.data;
  } else {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderPayload: Omit<Order, 'id'> = {
      student_id: studentId,
      student_name: studentName,
      status: 'Pending',
      total_amount: totalAmount,
      created_at: new Date().toISOString()
    };

    const orderRef = await addDoc(collection(db, 'orders'), orderPayload);
    
    // Create order items & deduct stock
    const orderItems: OrderItem[] = [];
    for (const item of items) {
      const oItem: Omit<OrderItem, 'id'> = {
        order_id: orderRef.id,
        food_item_id: item.food_item_id,
        food_item_name: item.food_item_name,
        quantity: item.quantity,
        price_at_order: item.price
      };
      
      const itemRef = await addDoc(collection(db, 'orderItems'), oItem);
      orderItems.push({ id: itemRef.id, ...oItem });

      // Deduct stock
      const foodSnap = await getDoc(doc(db, 'foodItems', item.food_item_id));
      const food = foodSnap.data();
      if (food) {
        await updateDoc(doc(db, 'foodItems', item.food_item_id), {
          quantity: Math.max(0, food.quantity - item.quantity)
        });
      }
    }

    await logAction(studentId, 'PLACE_ORDER', 'Order', orderRef.id, `Placed canteen order for $${totalAmount}.`);
    return { id: orderRef.id, ...orderPayload, items: orderItems };
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status'], userId: string): Promise<Order> {
  if (isApiMode()) {
    const res = await apiClient.put(`/orders/${orderId}/status`, null, { params: { status } });
    return res.data;
  } else {
    await updateDoc(doc(db, 'orders', orderId), { status });
    const snap = await getDoc(doc(db, 'orders', orderId));
    await logAction(userId, 'UPDATE_ORDER', 'Order', orderId, `Set order status to ${status}.`);
    return { id: orderId, ...snap.data() } as Order;
  }
}

// --- AUDIT LOGS & REPORTS ---
export async function getAuditLogs(): Promise<AuditLog[]> {
  if (isApiMode()) {
    const res = await apiClient.get('/audit-logs/');
    return res.data;
  } else {
    const snap = await getDocs(collection(db, 'auditLogs'));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
}

export async function getReports(): Promise<any> {
  if (isApiMode()) {
    const res = await apiClient.get('/reports/');
    return res.data;
  } else {
    // Generate mock reports on-the-fly from local database
    const booksSnap = await getDocs(collection(db, 'books'));
    const borrowsSnap = await getDocs(collection(db, 'borrows'));
    const foodSnap = await getDocs(collection(db, 'foodItems'));
    const ordersSnap = await getDocs(collection(db, 'orders'));

    const books: Book[] = booksSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const borrows: BorrowRecord[] = borrowsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const foods: FoodItem[] = foodSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const orders: Order[] = ordersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const today = new Date();

    // 1. Overdue Books
    const overdueBooks = borrows.filter(b => !b.return_date && new Date(b.due_date) < today);

    // 2. Fines
    const totalFines = borrows.reduce((sum, b) => sum + (b.fine_amount || 0), 0);
    const paidFines = borrows.filter(b => b.fine_status === 'Paid').reduce((sum, b) => sum + (b.fine_amount || 0), 0);
    const pendingFines = borrows.filter(b => b.fine_status === 'Pending').reduce((sum, b) => sum + (b.fine_amount || 0), 0);

    // 3. Most Borrowed
    const borrowCounts: Record<string, number> = {};
    borrows.forEach(b => {
      borrowCounts[b.book_title || 'Unknown'] = (borrowCounts[b.book_title || 'Unknown'] || 0) + 1;
    });
    const popularBooks = Object.entries(borrowCounts).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count);

    // 4. Canteen Sales
    const totalSales = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.total_amount, 0);

    // 5. Popular Food Items
    const foodCounts: Record<string, number> = {};
    const orderItemsSnap = await getDocs(collection(db, 'orderItems'));
    const orderItems: OrderItem[] = orderItemsSnap.docs.map((d: any) => d.data());
    orderItems.forEach(oi => {
      foodCounts[oi.food_item_name || 'Unknown'] = (foodCounts[oi.food_item_name || 'Unknown'] || 0) + oi.quantity;
    });
    const popularFood = Object.entries(foodCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // 6. Low stock food items
    const lowStockItems = foods.filter(f => f.quantity <= f.low_stock_threshold);

    return {
      overdueBooks,
      fines: { total: totalFines, paid: paidFines, pending: pendingFines },
      popularBooks,
      canteenSales: { total: totalSales, count: orders.length },
      popularFood,
      lowStockItems
    };
  }
}
