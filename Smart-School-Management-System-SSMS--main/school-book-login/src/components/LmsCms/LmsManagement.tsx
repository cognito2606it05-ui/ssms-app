import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  BookOpen, Plus, Edit2, Trash2, X, Check, Search, Calendar,
  User, BookMarked, AlertCircle, CheckCircle2, RotateCcw, Clock, AlertTriangle
} from 'lucide-react';
import { Card, KPICard, Table, SectionHeader } from './UI';
import { 
  getBooks, addBook, updateBook, deleteBook, getBooksCategories,
  getBorrows, getReservations, issueBook, returnBook, reserveBook, updateReservation, settleFine 
} from '../../services/lmsCmsService';
import { Book, BorrowRecord, User as UserType } from '../../types';

export function LmsManagement({ 
  loggedInUser, 
  activeTab: propActiveTab, 
  setActiveTab: propSetActiveTab 
}: { 
  loggedInUser: UserType | null; 
  activeTab?: string; 
  setActiveTab?: (tab: string) => void;
}) {
  const isAdmin = loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management' || loggedInUser?.role === 'Librarian';
  
  // Map App.tsx activeAdminTab to LmsManagement activeTab
  const mapPropToLocal = (tab: string | undefined): 'dashboard' | 'catalog' | 'issue' | 'return' | 'overdue' | 'fines' | 'reservations' | 'my-borrows' | 'my-reservations' => {
    if (!tab) return isAdmin ? 'dashboard' : 'catalog';
    if (tab === 'library-dashboard' || tab === 'library') return 'dashboard';
    if (tab === 'library-books') return 'catalog';
    if (tab === 'library-issue') return 'issue';
    if (tab === 'library-return') return 'return';
    if (tab === 'library-overdue') return 'overdue';
    if (tab === 'library-fines') return 'fines';
    
    // Fallback/standard tab names
    if (['dashboard', 'catalog', 'issue', 'return', 'overdue', 'fines', 'reservations', 'my-borrows', 'my-reservations'].includes(tab)) {
      return tab as any;
    }
    return isAdmin ? 'dashboard' : 'catalog';
  };

  const mapLocalToProp = (tab: string): string => {
    if (tab === 'dashboard') return 'library-dashboard';
    if (tab === 'catalog') return 'library-books';
    if (tab === 'issue') return 'library-issue';
    if (tab === 'return') return 'library-return';
    if (tab === 'overdue') return 'library-overdue';
    if (tab === 'fines') return 'library-fines';
    return tab;
  };

  const [internalTab, setInternalTab] = useState<'dashboard' | 'catalog' | 'issue' | 'return' | 'overdue' | 'fines' | 'reservations' | 'my-borrows' | 'my-reservations'>(
    isAdmin ? 'dashboard' : 'catalog'
  );

  const activeTab = propActiveTab ? mapPropToLocal(propActiveTab) : internalTab;
  const setActiveTab = (tab: any) => {
    if (propSetActiveTab) {
      propSetActiveTab(mapLocalToProp(tab));
    } else {
      setInternalTab(tab);
    }
  };

  // Common loading/data states
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Librarian states
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  // Modals / forms state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Issue Form states
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 14);
    setDueDate(today.toISOString().split('T')[0]);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bRes = await getBooks(searchQuery, selectedCategory);
      setBooks(bRes.data);
      const cRes = await getBooksCategories();
      setCategories(cRes);

      if (isAdmin) {
        const borRes = await getBorrows();
        setBorrows(borRes);
        const resvRes = await getReservations();
        setReservations(resvRes);
      } else if (loggedInUser) {
        const borRes = await getBorrows();
        setBorrows(borRes.filter(b => b.student_id === loggedInUser.user_id));
        const resvRes = await getReservations();
        setReservations(resvRes.filter(r => r.student_id === loggedInUser.user_id));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load library data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, activeTab]);

  // Catalog Actions
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAuthor || !formIsbn || !formCategory) {
      toast.error('Please fill in all required fields');
      return;
    }
    const payload = {
      title: formTitle,
      author: formAuthor,
      isbn: formIsbn,
      category: formCategory,
      quantity: Number(formQuantity),
      description: formDescription,
      image_url: formImageUrl || undefined
    };
    try {
      if (selectedBook) {
        await updateBook(selectedBook.id, payload, loggedInUser?.user_id || 'system');
        toast.success('Book updated successfully');
      } else {
        await addBook(payload, loggedInUser?.user_id || 'system');
        toast.success('Book added successfully');
      }
      setIsBookModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save book');
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await deleteBook(id, loggedInUser?.user_id || 'system');
      toast.success('Book deleted successfully');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete book');
    }
  };

  const openEditModal = (book: Book) => {
    setSelectedBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormIsbn(book.isbn);
    setFormCategory(book.category);
    setFormQuantity(book.quantity);
    setFormDescription(book.description || '');
    setFormImageUrl(book.image_url || '');
    setIsBookModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedBook(null);
    setFormTitle('');
    setFormAuthor('');
    setFormIsbn('');
    setFormCategory('');
    setFormQuantity(1);
    setFormDescription('');
    setFormImageUrl('');
    setIsBookModalOpen(true);
  };

  // Issue Actions
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedBookId) {
      toast.error('Please select both student and book');
      return;
    }
    try {
      await issueBook(selectedStudentId, selectedStudentName, selectedBookId, loggedInUser?.user_id || 'system');
      toast.success('Book issued successfully!');
      setSelectedStudentId('');
      setStudentSearch('');
      setSelectedBookId('');
      setBookSearch('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue book');
    }
  };

  // Return Actions
  const handleReturnBook = async (borrowId: string) => {
    if (!window.confirm('Confirm receipt and mark book as returned?')) return;
    try {
      const record = await returnBook(borrowId, loggedInUser?.user_id || 'system');
      if (record.fine_amount > 0) {
        toast.success(`Book returned. Fine: $${record.fine_amount}`);
      } else {
        toast.success('Book returned successfully with zero fine.');
      }
      loadData();
    } catch (err) {
      toast.error('Failed to process return');
    }
  };

  // Student Reservation Request
  const handleRequestReservation = async (book: Book) => {
    if (!loggedInUser) return;
    try {
      await reserveBook(loggedInUser.user_id, loggedInUser.name, book.id, book.title);
      toast.success('Book reserved successfully!');
      loadData();
    } catch (err) {
      toast.error('Failed to reserve book');
    }
  };

  // Reservation approval
  const handleProcessReservation = async (resvId: string, status: 'Approved' | 'Rejected') => {
    try {
      await updateReservation(resvId, status, loggedInUser?.user_id || 'system');
      toast.success(`Reservation ${status.toLowerCase()} successfully`);
      loadData();
    } catch (err) {
      toast.error('Failed to update reservation status');
    }
  };

  const getBookImage = (book: any) => {
    if (book && book.image_url) return book.image_url;
    return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60';
  };

  // KPI Calculations
  const totalBooksCount = books.reduce((sum, b) => sum + b.quantity, 0);
  const activeLoans = borrows.filter(b => !b.return_date).length;
  const pendingResv = reservations.filter(r => r.status === 'Pending').length;
  const overdueFinesTotal = borrows.filter(b => b.fine_status === 'Pending').reduce((sum, b) => sum + b.fine_amount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Smart Library Management Portal" 
        subtitle="Manage inventory, process book issues/returns, track active student borrow records and reservation pipelines."
        theme="accent"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Total Books Stock" value={totalBooksCount} icon={BookOpen} description="Total volume count" />
        <KPICard title="Active Loans" value={activeLoans} icon={BookMarked} description="Currently issued" />
        <KPICard title="Pending Reservations" value={pendingResv} icon={Clock} description="Awaiting review" />
        <KPICard title="Outstanding Fines" value={`$${overdueFinesTotal}`} icon={AlertTriangle} description="Pending payments" />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-4 bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 w-fit overflow-x-auto max-w-full">
        {isAdmin ? (
          <>
            <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('catalog')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Books List</button>
            <button onClick={() => setActiveTab('issue')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'issue' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Issue Book</button>
            <button onClick={() => setActiveTab('return')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'return' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Return Book</button>
            <button onClick={() => setActiveTab('overdue')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'overdue' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Overdue Books</button>
            <button onClick={() => setActiveTab('fines')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'fines' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Fine Management</button>
            <button onClick={() => setActiveTab('reservations')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'reservations' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Reservations ({pendingResv})</button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('catalog')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>Search Books</button>
            <button onClick={() => setActiveTab('my-borrows')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'my-borrows' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>My Borrows</button>
            <button onClick={() => setActiveTab('my-reservations')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'my-reservations' ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}>My Reservations</button>
          </>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'dashboard' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Borrow Card */}
          <Card className="flex flex-col h-[400px]">
            <div className="flex items-center gap-2 border-b border-stone-50 pb-3 dark:border-stone-850">
              <BookMarked className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-white">Recent Library Checkouts</h3>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 divide-y divide-stone-50 dark:divide-stone-800">
              {borrows.slice(-5).reverse().map((b) => (
                <div key={b.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-white">{b.book_title}</p>
                    <p className="text-[10px] text-stone-500">Student: {b.student_name} ({b.student_id})</p>
                  </div>
                  <div className="text-right text-[10px]">
                    <p className="text-stone-500">Issued: {b.issue_date}</p>
                    <p className={b.return_date ? "text-emerald-500 font-bold" : "text-stone-450"}>
                      {b.return_date ? `Returned ${b.return_date}` : `Due ${b.due_date}`}
                    </p>
                  </div>
                </div>
              ))}
              {borrows.length === 0 && (
                <p className="text-center text-xs text-stone-500 py-12">No recent checkouts found.</p>
              )}
            </div>
          </Card>

          {/* Pending Reservations Approval Pipeline Card */}
          <Card className="flex flex-col h-[400px]">
            <div className="flex items-center gap-2 border-b border-stone-50 pb-3 dark:border-stone-850">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-white">Pending Reservations Pipeline</h3>
              <span className="ml-auto bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {reservations.filter(r => r.status === 'Pending').length} pending
              </span>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 divide-y divide-stone-50 dark:divide-stone-800">
              {reservations.filter(r => r.status === 'Pending').slice(0, 5).map((r) => (
                <div key={r.id} className="py-3 flex justify-between items-center text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-stone-800 dark:text-white truncate">{r.book_title}</p>
                    <p className="text-[10px] text-stone-500">By {r.student_name} ({new Date(r.reservation_date).toLocaleDateString()})</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleProcessReservation(r.id, 'Approved')} className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold hover:bg-emerald-700">Approve</button>
                    <button onClick={() => handleProcessReservation(r.id, 'Rejected')} className="bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-500 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-red-950 dark:hover:text-red-400 px-2.5 py-1 rounded-lg text-[9px] font-bold">Reject</button>
                  </div>
                </div>
              ))}
              {reservations.filter(r => r.status === 'Pending').length === 0 && (
                <p className="text-center text-xs text-stone-500 py-12">No pending reservations to approve.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <div className="relative flex-1 md:w-64 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search book title, author, isbn..."
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
              <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Book
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {books.map(b => (
              <div key={b.id} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
                <div className="h-44 bg-stone-100 dark:bg-stone-950 overflow-hidden relative">
                  <img src={getBookImage(b)} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{b.category}</span>
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-stone-800 dark:text-stone-100 line-clamp-2">{b.title}</h4>
                    <p className="text-[10px] text-stone-500">By {b.author}</p>
                    <p className="text-[9px] text-stone-500 font-mono">ISBN: {b.isbn}</p>
                  </div>
                  <div className="pt-3 border-t border-stone-50 dark:border-stone-800/40 flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${b.available_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {b.available_quantity} / {b.quantity} Avail
                    </span>
                    {isAdmin ? (
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(b)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteBook(b.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      b.available_quantity > 0 ? (
                        <span className="text-stone-500">Visit library to borrow</span>
                      ) : (
                        <button onClick={() => handleRequestReservation(b)} className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-bold text-[9px] hover:bg-indigo-700">
                          Reserve
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'issue' && isAdmin && (
        <Card className="max-w-xl mx-auto">
          <h3 className="text-base font-bold text-stone-800 dark:text-white mb-6">Issue Catalog Book</h3>
          <form onSubmit={handleIssueBook} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Student ID / Username</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. S-001" 
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    setSelectedStudentId(e.target.value);
                    setSelectedStudentName(`Student (${e.target.value})`);
                  }}
                  required
                  className="flex-1 px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" 
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Book ID</label>
              <select 
                value={selectedBookId} 
                onChange={e => setSelectedBookId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none"
              >
                <option value="">Select Book...</option>
                {books.filter(b => b.available_quantity > 0).map(b => (
                  <option key={b.id} value={b.id}>{b.title} ({b.author})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Due Date</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                required
                className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" 
              />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-blue-700">
              Confirm & Issue Book
            </button>
          </form>
        </Card>
      )}

      {activeTab === 'return' && isAdmin && (
        <Table
          title="Active Checkouts"
          data={borrows.filter(b => !b.return_date)}
          columns={[
            { header: 'Student ID', accessor: 'student_id' },
            { header: 'Student Name', accessor: 'student_name' },
            { header: 'Book Title', accessor: 'book_title' },
            { header: 'Issue Date', accessor: 'issue_date' },
            { header: 'Due Date', accessor: 'due_date' },
            { 
              header: 'Action', 
              render: (row: BorrowRecord) => (
                <button onClick={() => handleReturnBook(row.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] hover:bg-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Return
                </button>
              ) 
            }
          ]}
        />
      )}

      {activeTab === 'reservations' && isAdmin && (
        <Table
          title="Active Book Reservations"
          data={reservations.filter(r => r.status === 'Pending')}
          columns={[
            { header: 'Student', accessor: 'student_name' },
            { header: 'Book Title', accessor: 'book_title' },
            { header: 'Requested Date', render: (row: any) => new Date(row.reservation_date).toLocaleDateString() },
            { 
              header: 'Actions', 
              render: (row: any) => (
                <div className="flex gap-2">
                  <button onClick={() => handleProcessReservation(row.id, 'Approved')} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold">Approve</button>
                  <button onClick={() => handleProcessReservation(row.id, 'Rejected')} className="bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 px-3 py-1.5 rounded-lg text-[10px] font-bold">Reject</button>
                </div>
              ) 
            }
          ]}
        />
      )}

      {activeTab === 'my-borrows' && !isAdmin && (
        <Table
          title="My Checked Out Books"
          data={borrows}
          columns={[
            { header: 'Book Title', accessor: 'book_title' },
            { header: 'Issue Date', accessor: 'issue_date' },
            { header: 'Due Date', accessor: 'due_date' },
            { 
              header: 'Status', 
              render: (row: BorrowRecord) => row.return_date ? (
                <span className="text-emerald-600 font-bold">Returned ({row.return_date})</span>
              ) : (
                <span className="text-blue-600 font-bold">Active</span>
              ) 
            },
            { 
              header: 'Fines', 
              render: (row: BorrowRecord) => row.fine_amount > 0 ? (
                <span className="text-rose-600 font-bold">${row.fine_amount} ({row.fine_status})</span>
              ) : (
                <span className="text-stone-500">-</span>
              ) 
            }
          ]}
        />
      )}

      {activeTab === 'my-reservations' && !isAdmin && (
        <Table
          title="My Reservation Requests"
          data={reservations}
          columns={[
            { header: 'Book Title', accessor: 'book_title' },
            { header: 'Requested Date', render: (row: any) => new Date(row.reservation_date).toLocaleDateString() },
            { 
              header: 'Status', 
              render: (row: any) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : row.status === 'Pending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20' : 'bg-red-100 text-red-700'}`}>
                  {row.status}
                </span>
              ) 
            }
          ]}
        />
      )}

      {activeTab === 'overdue' && isAdmin && (
        <Table
          title="Library Overdue Books Monitor"
          data={borrows.filter(b => !b.return_date && new Date(b.due_date) < new Date(new Date().toISOString().split('T')[0]))}
          columns={[
            { header: 'Student ID', accessor: 'student_id' },
            { header: 'Student Name', accessor: 'student_name' },
            { header: 'Book Title', accessor: 'book_title' },
            { header: 'Due Date', accessor: 'due_date' },
            { 
              header: 'Overdue Days', 
              render: (row: BorrowRecord) => {
                const due = new Date(row.due_date);
                const today = new Date(new Date().toISOString().split('T')[0]);
                const diffTime = Math.abs(today.getTime() - due.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return <span className="text-rose-600 font-bold">{diffDays} days late</span>;
              } 
            },
            { 
              header: 'Current Fine', 
              render: (row: BorrowRecord) => {
                const due = new Date(row.due_date);
                const today = new Date(new Date().toISOString().split('T')[0]);
                const diffTime = Math.abs(today.getTime() - due.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return <span className="font-bold">${diffDays * 2.0}</span>;
              } 
            },
            { 
              header: 'Action', 
              render: (row: BorrowRecord) => (
                <button onClick={() => handleReturnBook(row.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] hover:bg-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Return
                </button>
              ) 
            }
          ]}
        />
      )}

      {activeTab === 'fines' && isAdmin && (
        <Table
          title="Fines & Penalties Settlement Ledger"
          data={borrows.filter(b => b.fine_amount > 0)}
          columns={[
            { header: 'Student ID', accessor: 'student_id' },
            { header: 'Student Name', accessor: 'student_name' },
            { header: 'Book Title', accessor: 'book_title' },
            { header: 'Returned Date', render: (row: BorrowRecord) => <span>{row.return_date || 'Not Returned'}</span> },
            { header: 'Fine Amount', render: (row: BorrowRecord) => <span className="font-bold text-rose-500">${row.fine_amount}</span> },
            { 
              header: 'Payment Status', 
              render: (row: BorrowRecord) => (
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  row.fine_status === 'Paid' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                }`}>
                  {row.fine_status}
                </span>
              ) 
            },
            { 
              header: 'Action', 
              render: (row: BorrowRecord) => row.fine_status === 'Pending' ? (
                <button 
                  onClick={async () => {
                    if (!window.confirm(`Mark fine of $${row.fine_amount} as paid/collected?`)) return;
                    try {
                      await settleFine(row.id, loggedInUser?.user_id || 'system');
                      toast.success('Fine marked as paid!');
                      loadData();
                    } catch (e) {
                      toast.error('Failed to settle fine');
                    }
                  }} 
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] hover:bg-emerald-700 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Settle Fine
                </button>
              ) : (
                <span className="text-stone-500 font-medium">No actions</span>
              ) 
            }
          ]}
        />
      )}

      {/* Book Add/Edit Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-800 dark:text-white">{selectedBook ? 'Edit Book Details' : 'Add New Book'}</h3>
              <button onClick={() => setIsBookModalOpen(false)} className="p-1 hover:bg-stone-50 rounded-lg text-stone-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveBook} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-stone-450 uppercase block mb-1">Book Title *</label>
                <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Author *</label>
                  <input type="text" required value={formAuthor} onChange={e => setFormAuthor(e.target.value)} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">ISBN *</label>
                  <input type="text" required value={formIsbn} onChange={e => setFormIsbn(e.target.value)} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Category *</label>
                  <input type="text" required value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Quantity *</label>
                  <input type="number" required min={1} value={formQuantity} onChange={e => setFormQuantity(Number(e.target.value))} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Description (Optional)</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-455 uppercase block mb-1">Cover Image URL (Optional)</label>
                <input type="text" value={formImageUrl} onChange={e => setFormImageUrl(e.target.value)} className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs rounded-xl outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700">Save Book</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
