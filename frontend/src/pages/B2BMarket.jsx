import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, LayoutDashboard, LogOut, Zap, ChevronRight } from 'lucide-react';
import { getProducts } from '../api'; // axios o'rniga shu ulandi

export default function B2BMarket() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Barchasi');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Kategoriyalar endi qattiq kodlanmaydi, bazaga qarab o'zgaradi
  const [categories, setCategories] = useState(["Barchasi"]);

  // 1. Backenddan barcha mahsulotlarni FAQAT BIR MARTA tortib kelamiz
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await getProducts(); // getProducts API'dan tortamiz
        const data = Array.isArray(res.data) ? res.data : [];
        setProducts(data);
        
        // Mahsulotlardagi barcha unik kategoriyalarni terib olamiz
        const uniqueCategories = ["Barchasi", ...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Xato:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatMoney = (amount) => amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // 2. Filtrlash va Qidiruvni Frontendning o'zida tezkor bajaramiz
  const filteredProducts = products.filter(product => {
    // A) Kategoriya bo'yicha tekshiramiz
    const matchCategory = category === 'Barchasi' || product.category === category;
    
    // B) Qidiruv so'zi bo'yicha tekshiramiz (xavfsiz tekshiruv uchun toLowerCase)
    const safeName = (product.name || "").toLowerCase();
    const safeFactory = (product.factory_name || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchSearch = safeName.includes(query) || safeFactory.includes(query);
    
    return matchCategory && matchSearch;
  });

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex selection:bg-blue-200">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm relative z-20 shrink-0">
        <div className="relative z-10">
          <h1 onClick={handleLogout} className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-10 tracking-widest flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Zap className="text-blue-600" size={24} /> BAIS
          </h1>
          <nav className="space-y-4">
            <button onClick={() => navigate('/analytics')} className="w-full flex items-center space-x-3 text-slate-500 hover:text-blue-600 hover:bg-slate-50 p-3 rounded-xl transition-all">
              <LayoutDashboard size={20} /> <span className="font-bold">AI Tahlil Markazi</span>
            </button>
            <button className="w-full flex items-center space-x-3 text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm transition-all">
              <Package size={20} /><span className="font-bold">B2B Buyurtmalar</span>
            </button>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center space-x-3 text-slate-500 hover:text-rose-500 transition-all font-medium relative z-10">
          <LogOut size={20} /><span>Bosh sahifa</span>
        </button>
      </aside>

      {/* ASOSIY OYNA */}
      <main className="flex-1 p-8 overflow-y-auto relative z-10 custom-scrollbar h-screen">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">B2B Ulgurji Bozor</h2>
            <p className="text-slate-500 text-sm font-medium">Vositachilarsiz to'g'ridan-to'g'ri zavodlardan xarid qiling</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Mahsulot yoki zavod izlash..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl pl-11 pr-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none w-72 transition-all focus:w-80 shadow-sm placeholder:text-slate-400" 
              />
            </div>
          </div>
        </header>

        {/* FILTRLAR */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex items-center gap-2 text-slate-500 font-bold mr-2"><Filter size={18}/> Kategoriyalar:</div>
          {categories.map(cat => (
            <button 
              key={cat} onClick={() => setCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${category === cat ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 shadow-sm'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* MAHSULOTLAR GRIDI */}
        {loading ? (
          <div className="flex justify-center py-20"><Zap className="text-blue-600 animate-pulse" size={40}/></div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
            <Search size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-bold">"{searchQuery}" yoki "{category}" bo'yicha hech narsa topilmadi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-300 transition-all group flex flex-col justify-between hover:shadow-xl shadow-sm">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg">{product.category || "Kategoriya"}</span>
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-lg">Zavod narxi</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors leading-tight">{product.name}</h3>
                  <p className="text-sm text-slate-500 mb-5 font-medium">{product.factory_name || "BAIS Zavod"}</p>
                  
                  {/* Xavfsiz narxni chiqarish */}
                  <div className="text-2xl font-black text-emerald-600 mb-5">{formatMoney(product.price || product.factory_price || 0)} <span className="text-xs font-bold text-slate-400">UZS</span></div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-bold">Zaxira: <span className="text-slate-800">{product.stock_quantity || product.stock || 0} dona</span></p>
                  <button 
                    onClick={() => navigate(`/product/${product.id}`)} 
                    className="w-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-100 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    Tahlilni ko'rish <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}