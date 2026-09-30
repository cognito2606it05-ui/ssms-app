import React from 'react';
import toast from 'react-hot-toast';
import { FileSpreadsheet, FileText, Download, Library, Coffee, AlertTriangle } from 'lucide-react';
import { Card, SectionHeader } from './UI';
import { getReports, apiClient } from '../../services/lmsCmsService';
import { User as UserType } from '../../types';

export function LmsCmsReports({ loggedInUser }: { loggedInUser: UserType | null }) {
  const showLibrary = loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management' || loggedInUser?.role === 'Librarian';
  const showCanteen = loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management' || loggedInUser?.role === 'Canteen Manager';

  const downloadMockCSV = (reportName: string, data: any) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportName === 'overdue_books') {
      csvContent += "Student ID,Student Name,Book Title,Issue Date,Due Date,Fine ($)\n";
      (data.overdueBooks || []).forEach((row: any) => {
        csvContent += `${row.student_id},${row.student_name},"${row.book_title}",${row.issue_date},${row.due_date},${row.fine_amount}\n`;
      });
    } else if (reportName === 'fine_collection') {
      csvContent += "Summary Type,Total Fines ($),Paid Fines ($),Pending Fines ($)\n";
      const f = data.fines || { total: 0, paid: 0, pending: 0 };
      csvContent += `Overall Fines,${f.total},${f.paid},${f.pending}\n`;
    } else if (reportName === 'most_borrowed') {
      csvContent += "Book Title,Borrow Count\n";
      (data.popularBooks || []).forEach((row: any) => {
        csvContent += `"${row.title}",${row.count}\n`;
      });
    } else if (reportName === 'active_borrowers') {
      csvContent += "Student Name,Borrow Count\n";
      // mock counts
      csvContent += "Student 1,3\nStudent 2,2\n";
    } else if (reportName === 'sales_summary') {
      csvContent += "Canteen Sales,Total Amount ($),Orders Count\n";
      const s = data.canteenSales || { total: 0, count: 0 };
      csvContent += `Overall Sales,${s.total},${s.count}\n`;
    } else if (reportName === 'menu_popularity') {
      csvContent += "Food Item Name,Quantity Sold\n";
      (data.popularFood || []).forEach((row: any) => {
        csvContent += `"${row.name}",${row.count}\n`;
      });
    } else if (reportName === 'inventory_status') {
      csvContent += "Food Item,Category,Price ($),Quantity In Stock,Low Stock Threshold\n";
      (data.lowStockItems || []).forEach((row: any) => {
        csvContent += `"${row.name}",${row.category},${row.price},${row.quantity},${row.low_stock_threshold}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async (reportName: string, format: 'excel' | 'pdf') => {
    const loadingToast = toast.loading(`Generating ${format.toUpperCase()} report...`);
    try {
      const mode = (import.meta as any).env?.VITE_BACKEND_MODE || 'local';
      if (mode === 'api') {
        const res = await apiClient.get('/reports/export', {
          params: { report_name: reportName, type: format === 'excel' ? 'excel' : 'pdf' },
          responseType: 'blob'
        });
        
        const mimeType = format === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        
        const blob = new Blob([res.data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        link.setAttribute('download', `${reportName}_${new Date().toISOString().slice(0,10)}.${ext}`);
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.dismiss(loadingToast);
        toast.success(`${format.toUpperCase()} report downloaded successfully!`);
      } else {
        // Mock download local data
        const mockData = await getReports();
        if (format === 'excel') {
          downloadMockCSV(reportName, mockData);
          toast.dismiss(loadingToast);
          toast.success("CSV spreadsheet exported successfully!");
        } else {
          // Trigger printable mockup
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Library & Canteen System - ${reportName.replace('_', ' ').toUpperCase()} REPORT</title>
                  <style>
                    body { font-family: monospace; padding: 40px; color: #333; }
                    h1 { border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; }
                    th { background-color: #f5f5f5; }
                    .footer { margin-top: 40px; font-size: 10px; color: #777; text-align: center; border-top: 1px dashed #ccc; padding-top: 20px; }
                  </style>
                </head>
                <body>
                  <h1>${reportName.replace('_', ' ').toUpperCase()} REPORT</h1>
                  <p>Generated on: ${new Date().toLocaleString()}</p>
                  <p>Mode: Local Database Simulator</p>
                  <hr/>
                  <pre>${JSON.stringify(mockData, null, 2)}</pre>
                  <div class="footer">
                    EduSmart Tech - Security Verified System Report
                  </div>
                  <script>window.print();</script>
                </body>
              </html>
            `);
            printWindow.document.close();
            toast.dismiss(loadingToast);
            toast.success("Print dialog opened for PDF generation!");
          } else {
            toast.dismiss(loadingToast);
            toast.error("Failed to open print preview tab");
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error('Failed to download report. Ensure server is active.');
    }
  };

  const libraryReports = [
    {
      id: 'overdue_books',
      title: 'Overdue Books List',
      description: 'Current active borrows past their due date, including dynamically calculated late return fine fees.'
    },
    {
      id: 'fine_collection',
      title: 'Fine Collection Summary',
      description: 'Log of all accrued fines, listing pending fees and settled/paid library bills.'
    },
    {
      id: 'most_borrowed',
      title: 'Most Borrowed Books',
      description: 'Catalog list ranked by borrow popularity. Helps identify core textbook demands.'
    },
    {
      id: 'active_borrowers',
      title: 'Active Borrowers List',
      description: 'Roster of students with currently issued books, helpful for end-of-term audits.'
    }
  ];

  const canteenReports = [
    {
      id: 'sales_summary',
      title: 'Canteen Sales Summary',
      description: 'Chronological list of all orders showing transactions total cost, order items count, and preparation status.'
    },
    {
      id: 'menu_popularity',
      title: 'Popular Food Items',
      description: 'Menu rankings displaying quantity sold and total revenue accrued by menu items.'
    },
    {
      id: 'inventory_status',
      title: 'Inventory Stock Sheet',
      description: 'Real-time stock checklist flagging low items, perfect for ingredient supplier ordering.'
    }
  ];

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="LMS & CMS System Reports" 
        subtitle="Generate and download spreadsheet summaries and PDF logs for library loans, overdue fines, canteen revenue, and inventory status."
        theme="primary"
      />

      {/* Library Reports */}
      {showLibrary && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2 dark:border-stone-800">
            <Library className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xs font-black text-stone-700 dark:text-stone-200 uppercase tracking-widest">Library Portal Reports</h2>
          </div>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
            {libraryReports.map((report) => (
              <Card key={report.id} className="flex flex-col justify-between h-48">
                <div>
                  <h3 className="text-xs font-bold text-stone-850 dark:text-white">{report.title}</h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-500 mt-2 leading-relaxed">{report.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-50 dark:border-stone-800/40">
                  <button
                    onClick={() => handleDownload(report.id, 'excel')}
                    className="flex items-center justify-center gap-1 rounded-xl bg-stone-50 border border-stone-200 py-1.5 text-[9px] font-bold text-stone-600 hover:bg-stone-100 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800"
                  >
                    <FileSpreadsheet className="h-3 w-3 text-emerald-500" /> Excel/CSV
                  </button>
                  <button
                    onClick={() => handleDownload(report.id, 'pdf')}
                    className="flex items-center justify-center gap-1 rounded-xl bg-stone-50 border border-stone-200 py-1.5 text-[9px] font-bold text-stone-600 hover:bg-stone-100 dark:bg-slate-950 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800"
                  >
                    <FileText className="h-3 w-3 text-rose-500" /> Print/PDF
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Canteen Reports */}
      {showCanteen && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2 dark:border-stone-800">
            <Coffee className="h-5 w-5 text-emerald-500" />
            <h2 className="text-xs font-black text-stone-700 dark:text-stone-200 uppercase tracking-widest">Canteen Portal Reports</h2>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {canteenReports.map((report) => (
              <Card key={report.id} className="flex flex-col justify-between h-48">
                <div>
                  <h3 className="text-xs font-bold text-stone-850 dark:text-white">{report.title}</h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-500 mt-2 leading-relaxed">{report.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-50 dark:border-stone-800/40">
                  <button
                    onClick={() => handleDownload(report.id, 'excel')}
                    className="flex items-center justify-center gap-1 rounded-xl bg-stone-50 border border-stone-200 py-1.5 text-[9px] font-bold text-stone-600 hover:bg-stone-100 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800"
                  >
                    <FileSpreadsheet className="h-3 w-3 text-emerald-500" /> Excel/CSV
                  </button>
                  <button
                    onClick={() => handleDownload(report.id, 'pdf')}
                    className="flex items-center justify-center gap-1 rounded-xl bg-stone-50 border border-stone-200 py-1.5 text-[9px] font-bold text-stone-600 hover:bg-stone-100 dark:bg-slate-950 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800"
                  >
                    <FileText className="h-3 w-3 text-rose-500" /> Print/PDF
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
