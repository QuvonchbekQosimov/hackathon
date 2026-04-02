import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowLeft, ShieldCheck } from 'lucide-react';
import { registerUser } from '../api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone_number: '',
    password: '',
    role: 'BUYER',
    company_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Haqiqiy Backend'ga yuborish
      const res = await registerUser(formData);
      
      // Muvaffaqiyatli bo'lsa xotiraga saqlab, panelga o'tkazish
      localStorage.setItem('userPhone', res.data.phone_number);
      localStorage.setItem('userRole', res.data.role);
      localStorage.setItem('userId', res.data.id); 
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900 selection:bg-blue-200">
      
      {/* CHAP PANEL - DIZAYN QISMI */}
      <div className="hidden lg:flex w-1/2 bg-[#0B1121] text-white flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#1e3a8a,transparent_40%)] opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        
        <div className="max-w-lg p-12 relative z-10 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
          <div className="w-20 h-20 bg-blue-600/20 rounded-3xl mx-auto flex items-center justify-center mb-8 border border-blue-500/30 backdrop-blur-md">
             <ShieldCheck size={40} className="text-blue-400" />
          </div>
          <h2 className="text-4xl font-black mb-6 leading-tight">
            Xalqaro darajadagi B2B savdo ekotizimi
          </h2>
          <p className="text-slate-400 font-medium leading-relaxed text-lg">
            Maklerlarsiz va ishonchli savdo. Ochiq raqobatli logistika auksioni. Mukammal AI moliyaviy tahlillari.
          </p>
        </div>
      </div>

      {/* O'NG PANEL - FORMA */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 md:px-24 relative py-12">
        
        {/* Orqaga qaytish tugmasi */}
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-8 left-8 sm:left-12 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Bosh sahifa
        </button>

        <div className="max-w-md w-full mx-auto mt-auto mb-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Activity className="text-white" size={24} />
            </div>
            <span className="text-3xl font-black tracking-tight text-slate-900">
              BAIS<span className="text-blue-600">.</span>
            </span>
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-3">Yangi hisob yaratish</h1>
          <p className="text-slate-500 mb-10 font-medium text-lg">Platformadan to'liq foydalanish uchun ro'yxatdan o'ting.</p>

          {error && (
            <div className="bg-rose-50 text-rose-600 font-bold text-sm p-4 rounded-2xl mb-6 border border-rose-100 flex items-center gap-3 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Kim sifatida kiryapsiz?</label>
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-bold transition-all text-slate-900 cursor-pointer"
              >
                <option value="BUYER">Kompaniya / Xaridor</option>
                <option value="FACTORY">Zavod / Ishlab chiqaruvchi</option>
                <option value="DRIVER">Haydovchi / Logistika</option>
              </select>
            </div>

            {formData.role !== 'DRIVER' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Kompaniya yoki brend nomi</label>
                <input 
                  type="text" 
                  name="company_name" 
                  required 
                  value={formData.company_name} 
                  onChange={handleChange}
                  placeholder="Masalan: Artel" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-bold transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Telefon raqam</label>
              <input 
                type="tel" 
                name="phone_number" 
                required 
                value={formData.phone_number} 
                onChange={handleChange}
                placeholder="+998 90 123 45 67" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-bold transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Parol o'ylab toping</label>
              <input 
                type="password" 
                name="password" 
                required 
                value={formData.password} 
                onChange={handleChange}
                placeholder="••••••••" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-bold transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-black py-4.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 mt-6 text-lg flex justify-center items-center h-14"
            >
              {loading ? <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span> : "Hisobni yaratish"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-bold text-slate-500">
            Allaqachon hisobingiz bormi? <Link to="/login" className="text-blue-600 hover:text-blue-700 ml-1 transition-colors">Kirish</Link>
          </p>
        </div>
      </div>

    </div>
  );
}

export default Register;