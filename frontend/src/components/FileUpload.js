// frontend/src/components/FileUpload.js
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const FileUpload = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filename, setFilename] = useState('');

  // Use environment variables directly
  const API_URL = process.env.REACT_APP_API_URL || 'http://65.1.112.82:8000';
  const API_KEY = process.env.REACT_APP_API_KEY;

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFilename(file.name);
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
    }));
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Sentiment Analysis Dashboard</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full mb-4"
          />
          
          {loading && <p>Analyzing...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Analysis Results</h2>
          
          <div className="mb-8">
            <BarChart width={600} height={300} data={prepareChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sentiment" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Text</th>
                  <th className="px-4 py-2">Sentiment</th>
                  <th className="px-4 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td className="border px-4 py-2">{result.id}</td>
                    <td className="border px-4 py-2">{result.text}</td>
                    <td className="border px-4 py-2">{result.sentiment}</td>
                    <td className="border px-4 py-2">{result.score.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
