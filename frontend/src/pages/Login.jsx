import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Activity, ArrowLeft, Shield } from "lucide-react";
import { loginUser } from "../api"; 

function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Backendga so'rov jo'natamiz
      const res = await loginUser({ phone_number: phone, password: password });

      // Haqiqiy ID va Rollarni xotiraga yozamiz
      localStorage.setItem("userPhone", res.data.phone_number);
      localStorage.setItem("userRole", res.data.role);
      localStorage.setItem("userId", res.data.id);

      navigate("/dashboard"); 
    } catch (err) {
      setError(err.response?.data?.detail || "Telefon raqam yoki parol xato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900 selection:bg-blue-200">
      
      {/* CHAP PANEL - FORMA */}
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

          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Xush kelibsiz!
          </h1>
          <p className="text-slate-500 mb-10 font-medium text-lg">
            B2B platformasiga kirish uchun ma'lumotlaringizni kiriting.
          </p>

          {error && (
            <div className="bg-rose-50 text-rose-600 font-bold text-sm p-4 rounded-2xl mb-6 border border-rose-100 flex items-center gap-3 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                Telefon raqam
              </label>
              <input
                type="tel"
                required
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-bold transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                  Parol
                </label>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-bold transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-black py-4.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 mt-4 text-lg flex justify-center items-center h-14"
            >
              {loading ? (
                <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Platformaga kirish"
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-bold text-slate-500">
            Hisobingiz yo'qmi?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 ml-1 transition-colors">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>

      {/* O'NG PANEL - DIZAYN QISMI */}
      <div className="hidden lg:flex w-1/2 bg-[#0B1121] text-white flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#1e3a8a,transparent_40%)] opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        
        <div className="max-w-lg p-12 relative z-10 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
          <div className="w-20 h-20 bg-blue-600/20 rounded-3xl mx-auto flex items-center justify-center mb-8 border border-blue-500/30 backdrop-blur-md">
             <Shield size={40} className="text-blue-400" />
          </div>
          <h2 className="text-4xl font-black mb-6 leading-tight">
            Biznesingizni yagona AI tizimida boshqaring
          </h2>
          <p className="text-slate-400 font-medium leading-relaxed text-lg">
            BAIS platformasi orqali ishonchli xaridlar, ochiq logistika auksioni
            va moliyaviy AI ko'makchisidan foydalaning. Vositachilarsiz to'g'ridan to'g'ri savdo.
          </p>
        </div>
      </div>

    </div>
  );
}

export default Login;