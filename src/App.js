import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Applications from './pages/Applications';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/applications" element={<Applications />} />
        <Route path="*" element={<Navigate to="/applications" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
