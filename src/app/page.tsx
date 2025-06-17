'use client';

import React, { useState } from 'react';
import { Upload, FileText, Download, Eye, Trash2, Plus, Zap } from 'lucide-react';
import { parseDate, parseProvider, parseAmount, categorizeExpense } from '@/lib/parsers';
import { convertToGBP } from '@/lib/currency';

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
  gbpAmount: string;
  ocrText: string;
}

// Mock upload function for development
async function mockUploadReceiptImage(file: File, employeeName: string) {
  return new Promise<{id: string, url: string, name: string}>((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now() + Math.random().toString(),
        url: URL.createObjectURL(file),
        name: file.name
      });
    }, 1000);
  });
}

export default function ReceiptScannerApp() {
  const [employees, setEmployees] = useState<string[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processedReceipts, setProcessedReceipts] = useState<ProcessedReceipt[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    if (!currentEmployee.trim()) {
      alert('Please enter an employee name first');
      return;
    }

    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      try {
        // Use mock upload for development - replace with real Firebase later
        const uploadResult = await mockUploadReceiptImage(file, currentEmployee);
        newFiles.push({
          ...uploadResult,
          employee: currentEmployee,
          status: 'uploaded'
        });
      } catch (error) {
        console.error('Upload failed:', error);
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
        // For development, we'll use mock data
        // Later replace with actual API call
        const mockOcrText = `RECEIPT
${file.employee}'s Expense
Date: ${new Date().toLocaleDateString()}
Total: £${(Math.random() * 100).toFixed(2)}
Payment: Credit Card
Thank you!`;
        
        // Parse receipt data
        const date = parseDate(mockOcrText);
        const provider = parseProvider(mockOcrText) || "Sample Restaurant";
        const { currency, amount } = parseAmount(mockOcrText);
        const category = categorizeExpense(mockOcrText);
        
        // Convert to GBP
        const gbpAmount = await convertToGBP(amount, currency === '£' ? 'GBP' : 'USD');

        processed.push({
          id: file.id,
          fileName: file.name,
          employee: file.employee,
          date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          provider,
          category,
          paymentMethod: 'Credit Card',
          country: 'UK',
          originalAmount: `${currency}${amount.toFixed(2)}`,
          gbpAmount: gbpAmount.toFixed(2),
          ocrText: mockOcrText
        });
      } catch (error) {
        console.error('Processing failed for', file.name, error);
      }
    }

    setProcessedReceipts(processed);
    setIsProcessing(false);
  };

  const exportToCSV = () => {
    const headers = [
      'File Name', 'Employee', 'Date', 'Provider', 'Category', 
      'Payment Method', 'Country', 'Original Amount', 'GBP Amount'
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
        `"${receipt.originalAmount}"`,
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
              {/* Logo placeholder - Replace with your actual logo */}
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" 
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
                    £{processedReceipts.reduce((sum, r) => sum + parseFloat(r.gbpAmount || '0'), 0).toFixed(2)}
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
                        <th className="text-left py-2 px-3 font-medium text-gray-900">File</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Employee</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Date</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Provider</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Category</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Amount</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">GBP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedReceipts.map((receipt) => (
                        <tr key={receipt.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-900">{receipt.fileName}</td>
                          <td className="py-2 px-3 text-gray-600">{receipt.employee}</td>
                          <td className="py-2 px-3 text-gray-600">{receipt.date}</td>
                          <td className="py-2 px-3 text-gray-600">{receipt.provider}</td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {receipt.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{receipt.originalAmount}</td>
                          <td className="py-2 px-3 font-medium text-gray-900">£{receipt.gbpAmount}</td>
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
    </div>
  );
}