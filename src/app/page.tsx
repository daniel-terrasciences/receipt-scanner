'use client';

import React, { useState } from 'react';
import { parseDate, parseProvider, parseAmount, categorizeExpense } from '@/lib/parsers';
import { convertToGBP } from '@/lib/currency';

// SVG Icon Components
const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileText = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Download = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Interfaces
interface UploadedFile {
  id: string;
  name: string;
  url: string;
  employee: string;
  status: 'uploaded' | 'processing' | 'processed';
}

interface ProcessedReceipt {
  id: string;
  fileName: string;
  employee: string;
  date: string;
  provider: string;
  category: string;
  paymentMethod: string;
  country: string;
  originalAmount: string;
  originalCurrency: string;
  originalAmountValue: number;
  gbpAmount: string;
  ocrText: string;
  imageUrl: string;
}

// Simple file handling without Firebase
function createFileUrl(file: File): string {
  return URL.createObjectURL(file);
}

// Currency options
const CURRENCIES = [
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

// Category options
const CATEGORIES = [
  'Flight',
  'Train/Tube',
  'Taxi',
  'Car Hire/Fuel',
  'Hotel',
  'Subsistence',
  'Office Supplies',
  'Software/IT',
  'Other'
];

// Payment method options
const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'Cash',
  'Bank Transfer',
  'PayPal',
  'Other'
];

export default function ReceiptScannerApp() {
  const [employees, setEmployees] = useState<string[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processedReceipts, setProcessedReceipts] = useState<ProcessedReceipt[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('GBP');

  const handleFileUpload = async (files: FileList) => {
    if (!currentEmployee.trim()) {
      alert('Please enter an employee name first');
      return;
    }

    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      try {
        const fileUrl = createFileUrl(file);
        newFiles.push({
          id: Date.now() + Math.random().toString(),
          url: fileUrl,
          name: file.name,
          employee: currentEmployee,
          status: 'uploaded'
        });
      } catch (error) {
        console.error('File processing failed:', error);
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(false);
  };

  const processReceipts = async () => {
    setIsProcessing(true);
    const processed: ProcessedReceipt[] = [];

    for (const file of uploadedFiles) {
      try {
        console.log('Processing:', file.name);
        
        const response = await fetch(file.url);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('image', blob, file.name);
        
        const ocrResponse = await fetch('/api/process-receipt', {
          method: 'POST',
          body: formData,
        });
        
        if (!ocrResponse.ok) {
          const errorData = await ocrResponse.json();
          throw new Error(`OCR API error: ${errorData.error || ocrResponse.statusText}`);
        }
        
        const { text: ocrText } = await ocrResponse.json();
        console.log('OCR result for', file.name, ':', ocrText.substring(0, 100) + '...');
        
        const date = parseDate(ocrText);
        const provider = parseProvider(ocrText);
        const { currency, amount } = parseAmount(ocrText);
        const category = categorizeExpense(ocrText);
        
        const gbpAmount = await convertToGBP(amount, currency === '£' ? 'GBP' : currency.replace(/[£$€]/g, ''));

        processed.push({
          id: file.id,
          fileName: file.name,
          employee: file.employee,
          date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          provider: provider || 'Unknown Provider',
          category,
          paymentMethod: 'Credit Card',
          country: 'UK',
          originalAmount: `${currency}${amount.toFixed(2)}`,
          originalCurrency: currency === '£' ? 'GBP' : currency.replace(/[£$€]/g, '') || 'GBP',
          originalAmountValue: amount,
          gbpAmount: gbpAmount.toFixed(2),
          ocrText,
          imageUrl: file.url
        });
      } catch (error) {
        console.error('Processing failed for', file.name, error);
        processed.push({
          id: file.id,
          fileName: file.name,
          employee: file.employee,
          date: new Date().toISOString().split('T')[0],
          provider: 'Processing Failed',
          category: 'Other',
          paymentMethod: 'Unknown',
          country: 'Unknown',
          originalAmount: '£0.00',
          originalCurrency: 'GBP',
          originalAmountValue: 0,
          gbpAmount: '0.00',
          ocrText: `Error: ${error}`,
          imageUrl: file.url
        });
      }
    }

    setProcessedReceipts(processed);
    setIsProcessing(false);
  };

  const updateReceipt = async (id: string, field: string, value: any) => {
    setProcessedReceipts(prev => prev.map(receipt => {
      if (receipt.id === id) {
        const updated = { ...receipt, [field]: value };
        
        // If currency or amount changed, recalculate GBP amount
        if (field === 'originalCurrency' || field === 'originalAmountValue') {
          convertToGBP(updated.originalAmountValue, updated.originalCurrency).then(gbpAmount => {
            setProcessedReceipts(currentReceipts => 
              currentReceipts.map(r => 
                r.id === id ? { ...r, gbpAmount: gbpAmount.toFixed(2) } : r
              )
            );
          });
        }
        
        return updated;
      }
      return receipt;
    }));
  };

  const exportToCSV = () => {
    const headers = [
      'File Name', 'Employee', 'Date', 'Provider', 'Category', 
      'Payment Method', 'Country', 'Original Amount', 'Original Currency', `${baseCurrency} Amount`
    ];
    
    const csvContent = [
      headers.join(','),
      ...processedReceipts.map(receipt => [
        `"${receipt.fileName}"`,
        `"${receipt.employee}"`,
        `"${receipt.date}"`,
        `"${receipt.provider}"`,
        `"${receipt.category}"`,
        `"${receipt.paymentMethod}"`,
        `"${receipt.country}"`,
        `"${receipt.originalAmountValue.toFixed(2)}"`,
        `"${receipt.originalCurrency}"`,
        `"${receipt.gbpAmount}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `receipts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addEmployee = () => {
    if (!currentEmployee.trim()) return;
    
    if (!employees.includes(currentEmployee)) {
      setEmployees(prev => [...prev, currentEmployee]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.png" 
                alt="Company Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.setAttribute('style', 'display: flex');
                }}
              />
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg hidden" 
                style={{ backgroundColor: '#282c34' }}
              >
                R
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Receipt Scanner & Exporter
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Google Vision AI
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Receipts</h2>
              
              {/* Employee Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Name
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentEmployee}
                    onChange={(e) => setCurrentEmployee(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employee name"
                  />
                  <button
                    onClick={addEmployee}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity flex items-center space-x-1"
                    style={{ backgroundColor: '#282c34' }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Currency Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Currency (for export)
                </label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop receipt images here, or click to select
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#282c34' }}
                  >
                    Select Files
                  </label>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.employee}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={processReceipts}
                disabled={uploadedFiles.length === 0 || isProcessing}
                className="w-full py-3 text-white rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                style={{ backgroundColor: '#282c34' }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Process All Receipts</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Employee List */}
            {employees.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employees</h3>
                <div className="space-y-2">
                  {employees.map((emp, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded-md text-sm">
                      {emp}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uploaded Files:</span>
                  <span className="text-sm font-medium">{uploadedFiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Processed:</span>
                  <span className="text-sm font-medium">{processedReceipts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Value:</span>
                  <span className="text-sm font-medium">
                    {CURRENCIES.find(c => c.code === baseCurrency)?.symbol}{processedReceipts.reduce((sum, r) => sum + parseFloat(r.gbpAmount || '0'), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {processedReceipts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Processed Receipts</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center px-4 py-2 text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#282c34' }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {showPreview && (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Image</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Employee</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Date</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Provider</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Category</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Amount</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Currency</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">{baseCurrency}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedReceipts.map((receipt) => (
                        <tr key={receipt.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <img
                              src={receipt.imageUrl}
                              alt={receipt.fileName}
                              className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(receipt.imageUrl)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={receipt.employee}
                              onChange={(e) => updateReceipt(receipt.id, 'employee', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={receipt.date}
                              onChange={(e) => updateReceipt(receipt.id, 'date', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={receipt.provider}
                              onChange={(e) => updateReceipt(receipt.id, 'provider', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={receipt.category}
                              onChange={(e) => updateReceipt(receipt.id, 'category', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {CATEGORIES.map(category => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="0.01"
                              value={receipt.originalAmountValue}
                              onChange={(e) => updateReceipt(receipt.id, 'originalAmountValue', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={receipt.originalCurrency}
                              onChange={(e) => updateReceipt(receipt.id, 'originalCurrency', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {CURRENCIES.map(currency => (
                                <option key={currency.code} value={currency.code}>
                                  {currency.code}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 font-medium text-gray-900">
                            {CURRENCIES.find(c => c.code === baseCurrency)?.symbol}{receipt.gbpAmount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Receipt Image</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedImage}
                alt="Receipt"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}