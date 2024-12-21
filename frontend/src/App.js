// import logo from './logo.svg';
import './App.css';

// frontend/src/App.js
import React from 'react';
import FileUpload from './components/FileUpload';

function App() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Sentiment Analysis Dashboard</h1>
      <FileUpload />
    </div>
  );
}

export default App;