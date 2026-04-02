import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, TrendingUp, CreditCard, Truck, Search, Bell, Plus, User, LogOut,
  X, Send, Bot, ShoppingCart, ClipboardList, Map, CheckCircle, Clock,
  DollarSign, Activity, ChevronRight, Sun, Moon, Shield, Target, Zap, BarChart3,
  Camera, Crown, Download
} from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { getProducts, createProduct, getTrips, createTrip, createBid, sendAiChat, createOrder, getOrders, acceptOrder } from "../api";

const demandData = [
  { name: "Yan", Tekstil: 4000, Qurilish: 2400 },
  { name: "Fev", Tekstil: 3000, Qurilish: 1398 },
  { name: "Mar", Tekstil: 2000, Qurilish: 9800 },
  { name: "Apr", Tekstil: 2780, Qurilish: 3908 },
  { name: "May", Tekstil: 1890, Qurilish: 4800 },
  { name: "Iyun", Tekstil: 2390, Qurilish: 3800 },
  { name: "Iyul", Tekstil: 3490, Qurilish: 4300 },
];

function Dashboard() {
  const navigate = useNavigate();
  
  // TIZIMGA KIRGAN USER ID SINI QAT'IY OLISH
  const savedUserId = localStorage.getItem("userId");

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState(savedUserId || "");
  const [activeMenu, setActiveMenu] = useState("");

  // ==============================================================
  // LOCAL STORAGE: BARCHA MA'LUMOTLAR USER ID GA BOG'LAB SAQLANADI
  // ==============================================================
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [isOneIdVerified, setIsOneIdVerified] = useState(
    localStorage.getItem(`isOneIdVerified_${savedUserId}`) === "true"
  );
  
  const [profileData, setProfileData] = useState({
    firstName: localStorage.getItem(`firstName_${savedUserId}`) || "Foydalanuvchi",
    lastName: localStorage.getItem(`lastName_${savedUserId}`) || "",
    email: localStorage.getItem(`email_${savedUserId}`) || "",
    address: localStorage.getItem(`address_${savedUserId}`) || "",
    avatarUrl: localStorage.getItem(`avatarUrl_${savedUserId}`) || "",
  });

  const [isPremium, setIsPremium] = useState(
    localStorage.getItem(`isPremium_${savedUserId}`) === "true"
  );
  
  const [aiTimeLeft, setAiTimeLeft] = useState(() => {
    const savedDate = localStorage.getItem(`aiTimerDate_${savedUserId}`);
    const today = new Date().toDateString();
    if (savedDate !== today) {
      localStorage.setItem(`aiTimerDate_${savedUserId}`, today);
      localStorage.setItem(`aiTimeLeft_${savedUserId}`, "1200");
      return 1200;
    }
    return parseInt(localStorage.getItem(`aiTimeLeft_${savedUserId}`) || "1200", 10);
  });

  const [products, setProducts] = useState([]);
  const [trips, setTrips] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [isAddProductModal, setIsAddProductModal] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    category: "Erkaklar kiyimi",
    price: "",
    stock_quantity: "",
  });
  const [bidPrices, setBidPrices] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Assalomu alaykum! Men BAIS platformasining moliyaviy tahlilchisiman. Men sizning hozirgi holatingiz, daromadingiz va xaridlaringizni ko'rib turibman. Sizga qanday yordam bera olaman?",
    },
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    
    if (!savedRole || !savedUserId) {
      navigate("/login");
      return;
    }

    setRole(savedRole);
    setPhone(localStorage.getItem("userPhone") || "");
    
    if (savedRole === "FACTORY") setActiveMenu("orders_received");
    else if (savedRole === "BUYER") setActiveMenu("marketplace");
    else if (savedRole === "DRIVER") setActiveMenu("logistics_board");

    fetchData();
  }, [navigate, savedUserId]);

  useEffect(() => {
    let interval = null;
    if (activeMenu === "ai_consultant" && !isPremium && aiTimeLeft > 0) {
      interval = setInterval(() => {
        setAiTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          localStorage.setItem(`aiTimeLeft_${savedUserId}`, newTime.toString());
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeMenu, isPremium, aiTimeLeft, savedUserId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, tripRes, ordRes] = await Promise.all([
        getProducts().catch(() => ({ data: [] })),
        getTrips().catch(() => ({ data: [] })),
        getOrders().catch(() => ({ data: [] })),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setTrips(Array.isArray(tripRes.data) ? tripRes.data : []);
      setOrders(Array.isArray(ordRes.data) ? ordRes.data : []);
    } catch (error) {
      console.error("Xatolik:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // DIQQAT: Faqat tizimdan chiqish ma'lumotlari tozalanadi. 
    // Rasmlar va profil saqlanib qoladi!
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        stock_quantity: Number(productForm.stock_quantity)
      };
      
      await createProduct(userId, payload);
      
      setIsAddProductModal(false);
      setProductForm({ name: "", category: "Erkaklar kiyimi", price: "", stock_quantity: "" });
      
      await fetchData(); 
      showToast("Mahsulot muvaffaqiyatli qo'shildi! Bozor sahifasida ham ko'rinadi.");
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.detail || "Mahsulot qo'shishda xatolik yuz berdi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await acceptOrder(orderId);
      await fetchData();
      showToast("Buyurtma qabul qilindi!");
    } catch (error) {
      showToast("Xatolik yuz berdi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const qty = parseInt(orderQuantity, 10);
    if (isNaN(qty) || qty <= 0) return alert("To'g'ri miqdor kiriting!");
    if (qty > selectedProduct.stock_quantity) return alert("Omborda bunday miqdorda mahsulot yo'q!");

    setIsSubmitting(true);
    try {
      await createOrder({
        buyer_id: userId,
        product_id: selectedProduct.id,
        quantity: qty,
      });
      setIsOrderModalOpen(false);
      setSelectedProduct(null);
      setOrderQuantity(1);
      await fetchData();
      showToast(`Muvaffaqiyatli! ${selectedProduct.name} xarid qilindi.`);
    } catch (error) {
      showToast("Zakaz berishda xatolik yuz berdi!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceBid = async (tripId) => {
    const price = parseFloat(bidPrices[tripId]);
    if (!price || isNaN(price) || price <= 0) return alert("To'g'ri narx kiriting!");
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createBid({
        trip_id: tripId,
        driver_id: userId,
        offered_price: price,
      });
      setBidPrices({ ...bidPrices, [tripId]: "" });
      showToast("Taklifingiz yuborildi!");
    } catch (error) {
      showToast("Taklif yuborishda xato.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // SHAXSIY MA'LUMOTLARNI SAQLASH
  // ==========================================
  const handleProfileSave = (e) => {
    e.preventDefault();
    localStorage.setItem(`firstName_${userId}`, profileData.firstName);
    localStorage.setItem(`lastName_${userId}`, profileData.lastName);
    localStorage.setItem(`email_${userId}`, profileData.email);
    localStorage.setItem(`address_${userId}`, profileData.address);
    setIsEditingProfile(false);
    showToast("Shaxsiy ma'lumotlar muvaffaqiyatli saqlandi!");
  };

  // ==========================================
  // RASMNI BAZAGA SAQLASH (BASE64)
  // ==========================================
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileData({ ...profileData, avatarUrl: base64String });
        localStorage.setItem(`avatarUrl_${userId}`, base64String); 
      };
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // ONE ID TASDIQLASH SAQLANISHI
  // ==========================================
  const handleOneIdVerify = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsOneIdVerified(true);
      localStorage.setItem(`isOneIdVerified_${userId}`, "true");
      setIsSubmitting(false);
      showToast("OneID orqali muvaffaqiyatli tasdiqlandingiz!");
    }, 1500);
  };

  const handleSendChat = async (presetMessage = null) => {
    if (aiTimeLeft === 0 && !isPremium) return; 
    const textToSend = presetMessage || chatInput.trim();
    if (!textToSend || isAiTyping) return;

    setMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setChatInput("");
    setIsAiTyping(true);

    try {
      let userDataContext = "";
      if (role === "FACTORY") {
        const factoryProducts = products.filter((p) => p.factory_id === userId);
        const factoryOrders = orders.filter((o) => products.find((p) => p.id === o.product_id)?.factory_id === userId);
        const revenue = factoryOrders.filter(o => o.status === "ACCEPTED").reduce((sum, o) => sum + (o.total_amount || 0), 0);
        userDataContext = `Mening joriy holatim: Omborimda ${factoryProducts.length} xil mahsulot bor. Tushgan jami zakazlar: ${factoryOrders.length} ta. Jami tasdiqlangan daromadim: ${revenue} UZS.`;
      } else if (role === "BUYER") {
        const myOrders = orders.filter((o) => o.buyer_id === userId);
        const spent = myOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        userDataContext = `Mening joriy holatim: Tizimdan jami ${myOrders.length} ta buyurtma qilganman. Bular uchun jami xarajatim: ${spent} UZS.`;
      }

      const contextPrompt = `Sen biznes analitik AIsan. Foydalanuvchi roli: ${role}. ${userDataContext} So'rov: ${textToSend}. Mening shaxsiy statistikalarimni hisobga olgan holda aniq maslahat yoki tahlil yozib ber. Juda uzun yozma.`;
      const { data } = await sendAiChat(contextPrompt);
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "ai", text: "⚠️ AI tizimida xatolik. Tahlilni amalga oshirib bo'lmadi." }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const downloadCSV = (dataToExport, fileName) => {
    if (dataToExport.length === 0) {
        showToast("Yuklab olish uchun ma'lumot yo'q", "error");
        return;
    }
    const headers = Object.keys(dataToExport[0]).join(",");
    const rows = dataToExport.map(obj => 
        Object.values(obj).map(val => `"${val}"`).join(",")
    ).join("\n");
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getProductName = (id) => products.find((p) => p.id === id)?.name || "O'chirilgan tovar";
  const safeSearchQuery = (searchQuery || "").toLowerCase();
  const filteredProducts = products.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(safeSearchQuery) ||
      (p.category || "").toLowerCase().includes(safeSearchQuery)
  );

  const myFactoryOrders = orders.filter((o) => products.find((p) => p.id === o.product_id)?.factory_id === userId);

  const getMenus = () => {
    const baseMenus = [];
    if (role === "FACTORY") {
      baseMenus.push(
        { id: "orders_received", name: "Tushgan Zakazlar", icon: <ClipboardList size={20} /> },
        { id: "my_products", name: "Zavod Ombori", icon: <Package size={20} /> },
        { id: "factory_analytics", name: "Daromad Tahlili", icon: <TrendingUp size={20} /> }
      );
    } else if (role === "BUYER") {
      baseMenus.push(
        { id: "marketplace", name: "Kiyim-kechak Bozori", icon: <ShoppingCart size={20} /> },
        { id: "my_purchases", name: "Mening Xaridlarim", icon: <Package size={20} /> }
      );
    } else if (role === "DRIVER") {
      baseMenus.push(
        { id: "logistics_board", name: "Ochiq Auksion", icon: <Map size={20} /> }
      );
    }
    baseMenus.push(
      { id: "ai_consultant", name: "AI Tahlilchi", icon: <Bot size={20} /> },
      { id: "my_profile", name: "Shaxsiy Profil", icon: <Shield size={20} /> }
    );
    return baseMenus;
  };

  const theme = {
    bg: isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]",
    sidebarBg: isDarkMode ? "bg-[#0B1121]" : "bg-white",
    text: isDarkMode ? "text-slate-200" : "text-slate-900",
    textMuted: isDarkMode ? "text-slate-400" : "text-slate-500",
    border: isDarkMode ? "border-slate-800" : "border-slate-200",
    cardBg: isDarkMode ? "bg-[#131C31]" : "bg-white",
    inputBg: isDarkMode ? "bg-slate-900" : "bg-slate-50",
    hoverBg: isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-50",
    tableHeader: isDarkMode ? "bg-slate-800/80" : "bg-slate-50",
    tableRowHover: isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50",
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right fade-in duration-300 print:hidden">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                {toast.type === "success" ? <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle className="text-emerald-500" size={16}/></div> : <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"><X className="text-red-500" size={16}/></div>}
                <span className="font-bold text-sm">{toast.message}</span>
            </div>
        </div>
      )}

      {/* ----------------- SIDEBAR ----------------- */}
      <aside className={`w-[280px] border-r flex flex-col z-10 flex-shrink-0 transition-colors duration-300 print:hidden ${theme.sidebarBg} ${theme.border} ${isDarkMode ? "shadow-2xl" : "shadow-[4px_0_24px_rgba(0,0,0,0.02)]"}`}>
        <div className={`h-20 flex items-center px-8 border-b transition-colors duration-300 ${theme.border} ${isDarkMode ? "bg-gradient-to-r from-blue-900/20 to-transparent" : ""}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-600/30">
            <Activity className="text-white" size={22} />
          </div>
          <span className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            BAIS<span className="text-blue-500">.</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 custom-scrollbar">
          <p className={`px-4 text-[10px] font-black uppercase tracking-widest mb-4 ${theme.textMuted}`}>
            {role === "FACTORY" ? "Zavod Tizimi" : role === "BUYER" ? "Mijoz Tizimi" : "Logistika"}
          </p>
          <nav className="space-y-2">
            {getMenus().map((menu) => {
              const isActive = activeMenu === menu.id;
              return (
                <button key={menu.id} onClick={() => setActiveMenu(menu.id)} className={`w-full flex items-center px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : `${theme.textMuted} ${theme.hoverBg} ${isDarkMode ? "hover:text-slate-200" : "hover:text-slate-900"}`}`}>
                  <span className={`mr-4 ${isActive ? "text-blue-200" : theme.textMuted}`}>
                    {menu.icon}
                  </span>
                  {menu.name}
                  {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className={`p-5 border-t transition-colors duration-300 ${theme.border} ${theme.sidebarBg}`}>
          <div className={`flex items-center w-full p-3 rounded-xl border cursor-pointer transition-colors duration-300 ${isDarkMode ? "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-red-50"}`} onClick={handleLogout}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 overflow-hidden ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {profileData.firstName !== "Foydalanuvchi" ? profileData.firstName : phone}
              </p>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                {role}
              </p>
            </div>
            <LogOut size={16} className="text-red-500" />
          </div>
        </div>
      </aside>

      {/* ----------------- ASOSIY OYNA ----------------- */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-colors duration-300 print:bg-white ${theme.bg}`}>
        <header className={`h-20 backdrop-blur-xl border-b flex items-center justify-between px-8 sticky top-0 z-20 transition-colors duration-300 print:hidden ${theme.border} ${isDarkMode ? "bg-[#0B1121]/80" : "bg-white/80"}`}>
          <div className="max-w-lg w-full relative group">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme.textMuted} group-focus-within:text-blue-500`} size={18} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Qidiruv (Ism, Kategoriya)..." className={`w-full pl-12 pr-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme.inputBg} ${theme.border} ${theme.text} placeholder:${theme.textMuted}`} />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-white border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50"}`} title="Rejimni o'zgartirish">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
              <span className="text-[11px] font-black text-green-500 uppercase tracking-widest">Onlayn</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative print:p-0 print:overflow-visible">
          {isLoading && (
            <div className={`absolute inset-0 z-10 backdrop-blur-sm flex items-center justify-center print:hidden ${isDarkMode ? "bg-[#0F172A]/50" : "bg-white/50"}`}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* SHAXSIY PROFIL */}
          {activeMenu === "my_profile" && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-6 print:hidden">
              <div className={`p-8 rounded-3xl border shadow-lg flex flex-col sm:flex-row items-center sm:items-start gap-8 ${theme.cardBg} ${theme.border}`}>
                <div className="relative group">
                  <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-white'}`}>
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Profil rasmi" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-blue-500 opacity-50" />
                    )}
                  </div>
                  <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white mb-1" size={24} />
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Yuklash</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Shaxsiy ID: {userId}</p>
                      <h1 className={`text-4xl font-black mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {profileData.firstName} {profileData.lastName}
                      </h1>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${isDarkMode ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                          Rol: {role}
                        </span>
                        {isOneIdVerified ? (
                          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle size={14}/> OneID Tasdiqlangan
                          </span>
                        ) : (
                          <button onClick={handleOneIdVerify} disabled={isSubmitting} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all active:scale-95 disabled:bg-slate-400">
                            {isSubmitting ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <Shield size={14}/>}
                            OneID orqali tasdiqlash
                          </button>
                        )}
                      </div>
                    </div>
                    {!isEditingProfile && (
                      <button onClick={() => setIsEditingProfile(true)} className={`px-6 py-2.5 rounded-xl font-bold border shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95'}`}>
                        Tahrirlash
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-3xl border shadow-sm ${theme.cardBg} ${theme.border}`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  <User size={20} className="text-blue-500" /> Shaxsiy ma'lumotlar
                </h3>
                {isEditingProfile ? (
                  <form onSubmit={handleProfileSave} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Ism <span className="text-red-500">*</span></label>
                        <input type="text" required value={profileData.firstName} onChange={e => setProfileData({...profileData, firstName: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`} placeholder="Masalan: Alisher" />
                      </div>
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Familiya <span className="text-red-500">*</span></label>
                        <input type="text" required value={profileData.lastName} onChange={e => setProfileData({...profileData, lastName: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`} placeholder="Masalan: Usmonov" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Telefon raqam</label>
                        <input type="text" disabled value={phone} className={`w-full px-4 py-3 border rounded-xl outline-none font-bold opacity-60 cursor-not-allowed ${theme.inputBg} ${theme.border} ${theme.text}`} />
                      </div>
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Email (Gmail) <span className="text-red-500">*</span></label>
                        <input type="email" required value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`} placeholder="example@gmail.com" />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Yashash manzili <span className="text-red-500">*</span></label>
                      <input type="text" required value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`} placeholder="Masalan: Toshkent shahar, Yunusobod tumani" />
                    </div>
                    <div className={`mt-8 pt-6 border-t flex justify-end gap-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <button type="button" onClick={() => setIsEditingProfile(false)} className={`px-6 py-3 font-bold rounded-xl transition-colors ${isDarkMode ? 'text-slate-300 bg-slate-800 hover:bg-slate-700' : 'text-slate-700 bg-white border hover:bg-slate-50'}`}>Bekor qilish</button>
                      <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">Saqlash</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>Ism</p>
                        <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{profileData.firstName === "Foydalanuvchi" ? <span className="text-red-400 italic text-sm">Kiritilmagan</span> : profileData.firstName}</p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>Familiya</p>
                        <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{!profileData.lastName ? <span className="text-red-400 italic text-sm">Kiritilmagan</span> : profileData.lastName}</p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>Telefon raqam</p>
                        <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{phone}</p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>Email (Gmail)</p>
                        <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{!profileData.email ? <span className="text-red-400 italic text-sm">Kiritilmagan</span> : profileData.email}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>Yashash manzili</p>
                        <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{!profileData.address ? <span className="text-red-400 italic text-sm">Kiritilmagan</span> : profileData.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI TAHLILCHI */}
          {activeMenu === "ai_consultant" && (
            <div className="max-w-6xl mx-auto h-[80vh] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 print:hidden">
              <div className={`flex-1 flex flex-col rounded-3xl border shadow-2xl overflow-hidden min-h-[500px] relative ${theme.cardBg} ${theme.border}`}>
                <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Bot className="text-white" size={24} /></div>
                    <div>
                      <h3 className={`font-black text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}>AI Moliyaviy Tahlilchi</h3>
                      <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Gemini 2.5 Ulangan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isPremium && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${aiTimeLeft < 300 ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                        <Clock size={14} /> {formatTime(aiTimeLeft)}
                      </div>
                    )}
                    <button onClick={() => {
                        const newStatus = !isPremium;
                        setIsPremium(newStatus);
                        localStorage.setItem(`isPremium_${userId}`, newStatus.toString());
                    }} className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all active:scale-95">
                      <Crown size={14} /> {isPremium ? "PRO FAOL" : "PRO OLISH"}
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-[14px] font-medium leading-relaxed ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-br-sm" : `${isDarkMode ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-200"} border rounded-bl-sm`}`} style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                    </div>
                  ))}
                  {isAiTyping && (
                    <div className="flex justify-start"><div className={`px-5 py-4 rounded-2xl rounded-bl-sm border flex gap-2 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span></div></div>
                  )}
                </div>

                <div className={`p-4 border-t flex gap-2 overflow-x-auto ${isDarkMode ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}>
                  <button disabled={aiTimeLeft === 0 && !isPremium} onClick={() => handleSendChat("Mening hozirgi statistikamdan kelib chiqib qisqacha tahlil va maslahat ber.")} className={`px-4 py-2 text-xs font-bold rounded-full border transition-all flex whitespace-nowrap items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"}`}><BarChart3 size={14} /> Mening statistikamni tahlil qil</button>
                  <button disabled={aiTimeLeft === 0 && !isPremium} onClick={() => handleSendChat("Daromad yoki savdoni qanday oshirsam bo'ladi?")} className={`px-4 py-2 text-xs font-bold rounded-full border transition-all flex whitespace-nowrap items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"}`}><Zap size={14} /> Savdoni oshirish</button>
                </div>

                <div className={`p-5 border-t flex gap-3 ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}>
                  <input type="text" disabled={aiTimeLeft === 0 && !isPremium} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSendChat()} placeholder={aiTimeLeft === 0 && !isPremium ? "Vaqtingiz tugadi..." : "AI ga savol bering..."} className={`flex-1 border px-5 py-4 rounded-2xl focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.inputBg} ${theme.border} ${theme.text}`} />
                  <button onClick={() => handleSendChat()} disabled={isAiTyping || !chatInput.trim() || (aiTimeLeft === 0 && !isPremium)} className={`px-6 rounded-2xl flex items-center justify-center transition-all ${isAiTyping || !chatInput.trim() || (aiTimeLeft === 0 && !isPremium) ? `${isDarkMode ? "bg-slate-800 text-slate-600" : "bg-slate-200 text-slate-400"}` : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"}`}><Send size={20} /></button>
                </div>

                {aiTimeLeft === 0 && !isPremium && (
                  <div className="absolute inset-0 top-[88px] z-20 backdrop-blur-md bg-slate-900/80 flex flex-col items-center justify-center p-6 text-center">
                     <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.4)]"><Crown size={40} className="text-white" /></div>
                     <h2 className="text-3xl font-black text-white mb-3">Kunlik bepul vaqt tugadi!</h2>
                     <p className="text-slate-300 font-medium mb-8 max-w-md text-lg">Siz bugungi 20 daqiqalik bepul AI limitidan to'liq foydalandingiz. Cheksiz tahlil va maslahatlar uchun PRO obunaga o'ting.</p>
                     <button onClick={() => {setIsPremium(true); localStorage.setItem(`isPremium_${userId}`, 'true');}} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-lg"><Crown size={22} /> PRO Obuna Sotib Olish (Demo)</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ZAVOD: DAROMAD TAHLILI */}
          {role === "FACTORY" && activeMenu === "factory_analytics" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className={`p-8 rounded-3xl border shadow-lg flex justify-between items-center ${theme.cardBg} ${theme.border}`}>
                <div>
                    <h1 className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Daromad va Tahlil</h1>
                    <p className={`font-medium mt-2 ${theme.textMuted}`}>Zavodning moliyaviy ko'rsatkichlari va statistika.</p>
                </div>
                <button 
                  onClick={() => downloadCSV(myFactoryOrders, "Zavod_Daromad_Hisoboti")} 
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Download size={18}/> Excel (CSV) yuklab olish
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-3xl border shadow-sm ${theme.cardBg} ${theme.border}`}>
                  <div className="flex items-center justify-between mb-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}><DollarSign className="text-emerald-500" size={24} /></div></div>
                  <p className={`text-sm font-bold uppercase tracking-widest ${theme.textMuted}`}>Jami Tasdiqlangan Daromad</p>
                  <h2 className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{myFactoryOrders.filter(o => o.status === 'ACCEPTED').reduce((a, b) => a + (b.total_amount||0), 0).toLocaleString()} <span className="text-sm text-emerald-500">UZS</span></h2>
                </div>
                <div className={`p-6 rounded-3xl border shadow-sm ${theme.cardBg} ${theme.border}`}>
                  <div className="flex items-center justify-between mb-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}><ShoppingCart className="text-blue-500" size={24} /></div></div>
                  <p className={`text-sm font-bold uppercase tracking-widest ${theme.textMuted}`}>Tasdiqlangan Buyurtmalar</p>
                  <h2 className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{myFactoryOrders.filter(o => o.status === 'ACCEPTED').length} <span className="text-sm text-blue-500">ta</span></h2>
                </div>
                <div className={`p-6 rounded-3xl border shadow-sm ${theme.cardBg} ${theme.border}`}>
                  <div className="flex items-center justify-between mb-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}><Package className="text-amber-500" size={24} /></div></div>
                  <p className={`text-sm font-bold uppercase tracking-widest ${theme.textMuted}`}>Ombordagi Tovar Xillari</p>
                  <h2 className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{products.filter(p => p.factory_id === userId).length} <span className="text-sm text-amber-500">xil</span></h2>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border shadow-lg ${theme.cardBg} ${theme.border}`}>
                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Bozor talabi dinamikasi</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={demandData}>
                      <defs><linearGradient id="colorTekstil" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={isDarkMode ? '#64748b' : '#94a3b8'} />
                      <YAxis stroke={isDarkMode ? '#64748b' : '#94a3b8'} />
                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="Tekstil" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTekstil)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ZAVOD: TUSHGAN BUYURTMALAR */}
          {role === "FACTORY" && activeMenu === "orders_received" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className={`p-6 rounded-2xl border shadow-sm flex justify-between items-end ${theme.cardBg} ${theme.border}`}>
                <div>
                  <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Tushgan Buyurtmalar</h1>
                </div>
              </div>
              <div className={`rounded-2xl border shadow-lg overflow-hidden ${theme.cardBg} ${theme.border}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[800px]">
                    <thead className={`border-b tracking-widest font-black text-[10px] uppercase ${theme.tableHeader} ${theme.border} ${theme.textMuted}`}>
                      <tr><th className="px-6 py-5">Mahsulot Nomi</th><th className="px-6 py-5">Miqdor</th><th className="px-6 py-5">Summa (UZS)</th><th className="px-6 py-5">Holat</th><th className="px-6 py-5 text-right">Harakat</th></tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? "divide-slate-800/50" : "divide-slate-100"}`}>
                      {myFactoryOrders.length === 0 ? <tr><td colSpan="5" className={`px-6 py-16 text-center font-bold ${theme.textMuted}`}>Buyurtmalar yo'q.</td></tr> : myFactoryOrders.map((order) => (
                        <tr key={order.id} className={`transition-colors ${theme.tableRowHover}`}>
                          <td className={`px-6 py-5 font-bold ${theme.text}`}>{getProductName(order.product_id)}</td>
                          <td className={`px-6 py-5 font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{order.quantity} dona</td>
                          <td className="px-6 py-5 font-black text-emerald-500">{(order.total_amount || 0).toLocaleString()}</td>
                          <td className="px-6 py-5"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${order.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>{order.status === "ACCEPTED" ? "Tasdiqlangan" : "Kutilmoqda"}</span></td>
                          <td className="px-6 py-5 text-right">{order.status === "PENDING" ? <button disabled={isSubmitting} onClick={() => handleAcceptOrder(order.id)} className="text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 font-bold px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 ml-auto text-xs"><CheckCircle size={14} /> Qabul qilish</button> : <span className={`font-bold text-xs flex items-center justify-end gap-1 ${theme.textMuted}`}><Clock size={14} /> Yopilgan</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ZAVOD: OMBOR */}
          {role === "FACTORY" && activeMenu === "my_products" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-2xl border shadow-sm gap-4 ${theme.cardBg} ${theme.border}`}>
                <div><h1 className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Zavod Ombori</h1></div>
                <button onClick={() => { if (!isOneIdVerified) { alert("⚠️ Diqqat! Avval OneID orqali tasdiqlang."); setActiveMenu("my_profile"); } else { setIsAddProductModal(true); } }} className={`px-5 py-3 rounded-xl font-bold flex items-center shadow-lg transition-all w-full sm:w-auto justify-center text-white ${!isOneIdVerified ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"}`}><Plus size={18} className="mr-2" /> Yangi tovar qo'shish</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.filter((p) => p.factory_id === userId).map((item) => (
                    <div key={item.id} className={`border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col ${theme.cardBg} ${theme.border} ${isDarkMode ? "hover:border-blue-500/50" : "hover:border-blue-300"}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}><Package className="text-blue-500" size={24} /></div>
                      <h3 className={`font-bold text-lg mb-2 leading-tight line-clamp-2 flex-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{item.name}</h3>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-5">{item.category}</p>
                      <div className={`flex justify-between items-end p-4 rounded-xl border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <div><p className={`text-[10px] uppercase tracking-widest mb-1 font-bold ${theme.textMuted}`}>Zaxira</p><p className={`font-black ${item.stock_quantity > 0 ? "text-emerald-500" : "text-red-500"}`}>{item.stock_quantity}</p></div>
                        <div className="text-right"><p className={`text-[10px] uppercase tracking-widest mb-1 font-bold ${theme.textMuted}`}>Narx (UZS)</p><p className={`font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{(item.price || 0).toLocaleString()}</p></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* MIJOZ: BOZOR */}
          {role === "BUYER" && activeMenu === "marketplace" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className={`p-8 rounded-3xl border shadow-lg ${theme.cardBg} ${theme.border}`}>
                <h1 className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Global B2B Market</h1>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.filter((p) => p.stock_quantity > 0).map((item) => (
                    <div key={item.id} className={`border rounded-3xl p-6 flex flex-col transition-all hover:shadow-xl group ${theme.cardBg} ${theme.border} ${isDarkMode ? "hover:border-blue-500/50" : "hover:border-blue-300"}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600/20 transition-colors ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}><Package size={24} className="text-blue-500" /></div>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">{item.category}</span>
                      <h3 className={`font-bold text-lg mb-4 line-clamp-2 leading-tight flex-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{item.name}</h3>
                      <div className={`rounded-xl p-4 mb-5 border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <div className="flex justify-between mb-2"><span className={`text-xs font-bold ${theme.textMuted}`}>Narxi:</span><span className="text-sm font-black text-emerald-500">{(item.price || 0).toLocaleString()} UZS</span></div>
                        <div className="flex justify-between"><span className={`text-xs font-bold ${theme.textMuted}`}>Zaxira:</span><span className={`text-sm font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{item.stock_quantity} ta</span></div>
                      </div>
                      <button onClick={() => { if (!isOneIdVerified) { alert("⚠️ Diqqat! Avval OneID orqali tasdiqlang."); setActiveMenu("my_profile"); } else { setSelectedProduct(item); setIsOrderModalOpen(true); } }} className={`w-full py-3.5 rounded-xl transition-all shadow-lg active:scale-95 text-sm font-bold text-white ${!isOneIdVerified ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-500"}`}>Xarid Qilish</button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* MIJOZ: MENING XARIDLARIM */}
          {role === "BUYER" && activeMenu === "my_purchases" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className={`p-8 rounded-3xl border shadow-lg flex justify-between items-center ${theme.cardBg} ${theme.border}`}>
                <div>
                    <h1 className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Mening Xaridlarim</h1>
                    <p className={`font-medium mt-2 ${theme.textMuted}`}>Siz amalga oshirgan barcha buyurtmalar tarixi.</p>
                </div>
                <button 
                  onClick={() => downloadCSV(orders.filter(o => o.buyer_id === userId), "Xaridor_Xaridlari")} 
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Download size={18}/> Excel (CSV)
                </button>
              </div>

              <div className={`rounded-2xl border shadow-lg overflow-hidden ${theme.cardBg} ${theme.border}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[800px]">
                    <thead className={`border-b tracking-widest font-black text-[10px] uppercase ${theme.tableHeader} ${theme.border} ${theme.textMuted}`}>
                      <tr><th className="px-6 py-5">Buyurtma ID</th><th className="px-6 py-5">Mahsulot Nomi</th><th className="px-6 py-5">Miqdor</th><th className="px-6 py-5">Jami Summa</th><th className="px-6 py-5">Holat</th></tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? "divide-slate-800/50" : "divide-slate-100"}`}>
                      {orders.filter(o => o.buyer_id === userId).length === 0 ? <tr><td colSpan="5" className={`px-6 py-16 text-center font-bold ${theme.textMuted}`}>Siz hali hech narsa xarid qilmagansiz.</td></tr> : orders.filter(o => o.buyer_id === userId).map((order) => (
                          <tr key={order.id} className={`transition-colors ${theme.tableRowHover}`}>
                            <td className={`px-6 py-5 font-bold uppercase tracking-wider ${theme.textMuted}`}>#{String(order.id).substring(0, 6)}</td>
                            <td className={`px-6 py-5 font-bold ${theme.text}`}>{getProductName(order.product_id)}</td>
                            <td className={`px-6 py-5 font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{order.quantity} dona</td>
                            <td className="px-6 py-5 font-black text-emerald-500">{(order.total_amount || 0).toLocaleString()} UZS</td>
                            <td className="px-6 py-5"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${order.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>{order.status === "ACCEPTED" ? "Tasdiqlangan" : "Kutilmoqda"}</span></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* HAYDOVCHI: LOGISTIKA AUKSIONI */}
          {role === "DRIVER" && activeMenu === "logistics_board" && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 sm:p-8 rounded-3xl border shadow-lg gap-4 ${theme.cardBg} ${theme.border}`}>
                <div><h1 className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Logistika Auksioni</h1></div>
              </div>
              <div className="grid gap-4">
                {trips.length === 0 && !isLoading && <div className={`text-center py-16 rounded-3xl border font-bold ${theme.cardBg} ${theme.border} ${theme.textMuted}`}>Hozircha auksionda yuklar yo'q.</div>}
                {trips.map((trip) => (
                  <div key={trip.id} className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-6 transition-all ${theme.cardBg} ${theme.border} ${isDarkMode ? "hover:border-blue-500/50" : "hover:border-blue-300"}`}>
                    <div className="flex items-center gap-5 w-full md:w-auto">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? "bg-slate-800" : "bg-blue-50"}`}><Map className="text-blue-500" size={24} /></div>
                      <div><h3 className={`text-xl font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{trip.order_id}</h3><span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[10px] font-black uppercase tracking-widest">Auksionda</span></div>
                    </div>
                    <div className={`flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl border w-full md:w-auto ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <div className={`text-center sm:text-right sm:border-r sm:pr-6 sm:mr-2 w-full sm:w-auto ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>Mijoz Taklifi</p>
                        <p className="text-2xl font-black text-emerald-500">{(trip.customer_price || 0).toLocaleString()} <span className={`text-xs font-bold ${theme.textMuted}`}>UZS</span></p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input type="number" placeholder="Narx..." value={bidPrices[trip.id] || ""} onChange={(e) => setBidPrices({ ...bidPrices, [trip.id]: e.target.value })} className={`w-full sm:w-36 px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`} />
                        <button disabled={isSubmitting} onClick={() => { if (!isOneIdVerified) { alert("⚠️ Diqqat! Avval OneID orqali tasdiqlang."); setActiveMenu("my_profile"); } else { handlePlaceBid(trip.id); } }} className={`px-6 py-3 rounded-xl active:scale-95 whitespace-nowrap text-white font-bold transition-all ${!isOneIdVerified ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-500"}`}>Taklif yuborish</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================= MODALLAR ======================= */}
      {isOrderModalOpen && selectedProduct && (
        <div className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${isDarkMode ? "bg-[#0F172A]/80" : "bg-slate-900/40"}`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-md border overflow-hidden animate-in zoom-in-95 ${theme.cardBg} ${theme.border}`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
              <h3 className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Xaridni tasdiqlash</h3>
              <button onClick={() => setIsOrderModalOpen(false)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "text-slate-400 hover:text-white bg-slate-800" : "text-slate-400 hover:text-slate-900 bg-white border shadow-sm"}`}><X size={20} /></button>
            </div>
            <div className={`p-6 border-b ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-blue-50/50 border-slate-100"}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>Tanlangan Tovar:</p>
              <h4 className={`text-xl font-black leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedProduct.name}</h4>
              <p className="text-sm font-bold text-blue-500 mt-2">1 dona: {(selectedProduct.price || 0).toLocaleString()} UZS</p>
            </div>
            <form onSubmit={handlePlaceOrder} className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Miqdor (dona)</label>
                <input type="number" min="1" max={selectedProduct.stock_quantity} required value={orderQuantity} onChange={(e) => setOrderQuantity(e.target.value)} className={`w-full px-4 py-4 border rounded-xl focus:border-blue-500 outline-none font-black text-2xl text-center ${theme.inputBg} ${theme.border} ${theme.text}`} />
              </div>
              <div className={`p-5 rounded-xl border flex justify-between items-center ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}>
                <span className={`text-xs font-bold uppercase ${theme.textMuted}`}>Jami summa:</span>
                <span className="text-2xl font-black text-emerald-500">{((selectedProduct.price || 0) * (parseInt(orderQuantity, 10) || 0)).toLocaleString()} UZS</span>
              </div>
              <div className={`mt-8 pt-6 border-t flex justify-end gap-3 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                <button type="button" disabled={isSubmitting} onClick={() => setIsOrderModalOpen(false)} className={`px-6 py-3 font-bold rounded-xl transition-colors ${isDarkMode ? "text-slate-300 bg-slate-800 hover:bg-slate-700" : "text-slate-700 bg-white border hover:bg-slate-50"}`}>Bekor qilish</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg transition-all">Tasdiqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddProductModal && (
        <div className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${isDarkMode ? 'bg-[#0F172A]/80' : 'bg-slate-900/40'}`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-md border overflow-hidden animate-in zoom-in-95 ${theme.cardBg} ${theme.border}`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Yangi mahsulot qo'shish</h3>
              <button onClick={() => setIsAddProductModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-400 hover:text-slate-900 bg-white border shadow-sm'}`}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Mahsulot nomi</label>
                <input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`} placeholder="Masalan: Paxta tolali ko'ylak" />
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Kategoriya</label>
                <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`}>
                  <option value="Erkaklar kiyimi">Erkaklar kiyimi</option>
                  <option value="Ayollar kiyimi">Ayollar kiyimi</option>
                  <option value="Bolalar kiyimi">Bolalar kiyimi</option>
                  <option value="Poyabzal">Poyabzal</option>
                  <option value="Aksessuarlar">Aksessuarlar</option>
                  <option value="Qurilish">Qurilish</option>
                  <option value="Texnika">Texnika</option>
                  <option value="To'qimachilik">To'qimachilik</option>
                  <option value="Boshqa">Boshqa</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Narxi (UZS)</label>
                  <input type="number" min="0" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`} placeholder="0" />
                </div>
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Zaxira (dona)</label>
                  <input type="number" min="1" required value={productForm.stock_quantity} onChange={e => setProductForm({...productForm, stock_quantity: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:border-blue-500 outline-none font-bold ${theme.inputBg} ${theme.border} ${theme.text}`} placeholder="0" />
                </div>
              </div>
              <div className={`mt-8 pt-6 border-t flex justify-end gap-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <button type="button" disabled={isSubmitting} onClick={() => setIsAddProductModal(false)} className={`px-6 py-3 font-bold rounded-xl transition-colors ${isDarkMode ? 'text-slate-300 bg-slate-800 hover:bg-slate-700' : 'text-slate-700 bg-white border hover:bg-slate-50'}`}>Bekor qilish</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg transition-all">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;