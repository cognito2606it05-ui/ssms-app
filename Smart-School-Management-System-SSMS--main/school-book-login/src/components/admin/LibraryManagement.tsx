import React from 'react';
import { Plus, BookOpen as BookIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, collection, addDoc, doc, updateDoc } from '../../localDatabase';
import { Reservation } from '../../types';

export const LibraryManagement = () => {
  const { loggedInUser, reservations } = useApp();

  const books = [
    { id: 'B001', title: 'Advanced Physics', author: 'H.C. Verma', stock: 12, category: 'Science' },
    { id: 'B002', title: 'Modern Mathematics', author: 'R.D. Sharma', stock: 8, category: 'Math' },
    { id: 'B003', title: 'World History', author: 'J.L. Nehru', stock: 5, category: 'History' },
  ];

  const handleReserveBook = async (book: any) => {
    if (!loggedInUser) return;
    const reservation: Omit<Reservation, 'id'> = {
      book_title: book.title,
      student_id: loggedInUser.user_id,
      student_name: loggedInUser.name,
      reservation_date: new Date().toISOString(),
      status: 'Pending'
    };
    await addDoc(collection(db, 'reservations'), reservation);
    alert('Book reserved successfully!');
  };

  const handleUpdateReservation = async (id: string, status: 'Approved' | 'Rejected' | 'Returned') => {
    await updateDoc(doc(db, 'reservations', id), { status });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Smart Library</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
          <Plus className="w-4 h-4" /> Add Book
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.map(book => (
          <div key={book.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <BookIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">{book.id}</span>
            </div>
            <div>
              <h4 className="font-bold text-stone-800 dark:text-stone-100">{book.title}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">{book.author}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-stone-50 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">{book.category}</span>
              <button 
                onClick={() => handleReserveBook(book)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                Reserve
              </button>
            </div>
          </div>
        ))}
      </div>

      {loggedInUser?.role === 'Librarian' && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 mb-4">Manage Reservations</h3>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            {reservations.map(res => (
              <div key={res.id} className="flex justify-between items-center py-4 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <p className="font-bold">{res.book_title}</p>
                  <p className="text-xs text-stone-500">Student: {res.student_name} | Date: {new Date(res.reservation_date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  {res.status === 'Pending' && (
                    <>
                      <button onClick={() => handleUpdateReservation(res.id, 'Approved')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Approve</button>
                      <button onClick={() => handleUpdateReservation(res.id, 'Rejected')} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">Reject</button>
                    </>
                  )}
                  {res.status === 'Approved' && (
                    <button onClick={() => handleUpdateReservation(res.id, 'Returned')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Mark Returned</button>
                  )}
                  <span className="text-xs font-bold text-stone-500">{res.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
