import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_URL } from '../config';

const FileUpload = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateCSVFormat = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        if (lines.length < 2) {
          reject('File must contain at least one data row');
          return;
        }
        
        // Check for required headers
        const headers = lines[0].toLowerCase().trim().split(',');
        if (!headers.includes('id') || !headers.includes('text')) {
          reject('CSV must contain "id" and "text" columns');
          return;
        }
        
        resolve(true);
      };
      reader.onerror = () => reject('Error reading file');
      reader.readAsText(file);
    });
  };

  const processFile = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    try {
      // Validate CSV format
      await validateCSVFormat(file);
      
      setFileName(file.name);
      const formData = new FormData();
      formData.append('file', file);

      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = (event) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const prepareChartData = () => {
    const sentimentCounts = results.reduce((acc, curr) => {
      acc[curr.sentiment] = (acc[curr.sentiment] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      sentiment,
      count,
      percentage: ((count / results.length) * 100).toFixed(1)
    }));
  };

  const getAverageSentiment = () => {
    if (!results.length) return null;
    const avgScore = results.reduce((sum, curr) => sum + curr.score, 0) / results.length;
    return avgScore.toFixed(3);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* File Upload Section */}
      <div 
        className={`p-8 border-2 border-dashed rounded-lg text-center mb-6 transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${error ? 'border-red-500 bg-red-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label 
          htmlFor="file-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-800"
        >
          <div className="flex flex-col items-center">
            <svg 
              className="w-12 h-12 mb-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg mb-2">
              Drop your CSV file here or <span className="underline">browse</span>
            </p>
            <p className="text-sm text-gray-500">
              Required columns: id, text
              <br />
              Maximum file size: 5MB
            </p>
          </div>
        </label>
        {fileName && (
          <p className="mt-2 text-sm text-gray-600">
            Selected file: {fileName}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-3">Analyzing sentiments...</p>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-700">Total Entries</h4>
              <p className="text-2xl font-bold">{results.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-green-700">Average Sentiment</h4>
              <p className="text-2xl font-bold">{getAverageSentiment()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-700">Most Common</h4>
              <p className="text-2xl font-bold capitalize">
                {prepareChartData().sort((a, b) => b.count - a.count)[0]?.sentiment || 'N/A'}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-8 h-[400px]">
            <h3 className="text-xl font-semibold mb-4">Sentiment Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sentiment" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 shadow rounded border">
                          <p className="font-semibold capitalize">{payload[0].payload.sentiment}</p>
                          <p>Count: {payload[0].payload.count}</p>
                          <p>Percentage: {payload[0].payload.percentage}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sentiment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {result.text}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          result.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          result.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {result.sentiment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.score.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(result.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export & Reset Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => {
                const csv = [
                  ['ID', 'Text', 'Sentiment', 'Score', 'Timestamp'],
                  ...results.map(r => [
                    r.id,
                    r.text,
                    r.sentiment,
                    r.score,
                    r.timestamp || ''
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sentiment-analysis-results.csv';
                a.click();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Export Results
            </button>
            <button
              onClick={() => {
                setResults([]);
                setError(null);
                setFileName('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Clear Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
