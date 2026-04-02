import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Barcha sahifalarni chaqirib olamiz
import Home from './pages/Home';
import PublicAnalytics from './pages/PublicAnalytics';
import B2BMarket from './pages/B2BMarket';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; 

export default function App() {
  return (
    <Router>
      <Routes>
        {/* =========================================
            OCHIQ TARMOQ (Public Pages)
        ========================================= */}
        <Route path="/" element={<Home />} />
        <Route path="/analytics" element={<PublicAnalytics />} />
        <Route path="/marketplace" element={<B2BMarket />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        
        {/* =========================================
            AVTORIZATSIYA (Auth Pages)
        ========================================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* =========================================
            YOPIQ TARMOQ (Private CRM Panel)
        ========================================= */}
        <Route path="/dashboard" element={<Dashboard />} /> 
        
        {/* =========================================
            XAVFSIZLIK (404 Fallback)
            Bazada yo'q manzil yozilsa, bosh sahifaga otadi
        ========================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}