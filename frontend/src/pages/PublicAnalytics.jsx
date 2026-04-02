import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';

// DIQQAT: MANA SHU YERDA Building2 va ShoppingCart TO'LIQ CHAQIRILDI!
import { Bot, LayoutDashboard, LogOut, Zap, Package, Send, TrendingUp, MapPin, DollarSign, Building2, ShoppingCart } from 'lucide-react';

export default function PublicAnalytics() {
   const navigate = useNavigate();
   const [region, setRegion] = useState('Surxondaryo');
   const [analysis, setAnalysis] = useState(null);
   const [loading, setLoading] = useState(true);
   
   // Chat State
   const [chatInput, setChatInput] = useState('');
   const [messages, setMessages] = useState([
       { sender: 'ai', text: 'Assalomu alaykum! Men BAIS tahlilchisiman. Savolingiz bormi?' }
   ]);
   const [isTyping, setIsTyping] = useState(false);
   const chatEndRef = useRef(null);

   // 1. Backenddan hudud bo'yicha tahlilni olish
   const fetchData = async (selectedRegion) => {
      setLoading(true);
      try {
         const res = await axios.get(`http://localhost:8000/api/analysis/${selectedRegion}`);
         setAnalysis(res.data);
      } catch (error) { 
          console.error("Tahlil ma'lumotlarini olishda xato:", error); 
      } finally { 
          setLoading(false); 
      }
   };

   useEffect(() => { 
       fetchData(region); 
   }, [region]);

   // Chatni eng pastiga skroll qilish
   useEffect(() => { 
       chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
   }, [messages, isTyping]);

   // 2. Chat xabarini yuborish
   const handleSendMessage = async (e) => {
      e.preventDefault();
      if (!chatInput.trim()) return;
      
      setMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
      const userText = chatInput;
      setChatInput('');
      setIsTyping(true);
      
      try {
         const chatRes = await axios.post('http://localhost:8000/api/chat', { message: userText });
         setMessages(prev => [...prev, { sender: 'ai', text: chatRes.data.reply }]);
      } catch {
         setMessages(prev => [...prev, { sender: 'ai', text: "Kechirasiz, server bilan aloqada xatolik yuz berdi." }]);
      } finally { 
          setIsTyping(false); 
      }
   };

   const formatMoney = amount => amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
   
   const handleLogout = () => { 
       localStorage.clear(); 
       navigate('/'); 
   };

   return (
      <div className='min-h-screen bg-slate-50 text-slate-900 font-sans flex selection:bg-blue-200'>
         
         {/* ASOSIY SIDEBAR */}
         <aside className='w-64 border-r border-slate-200 bg-white p-6 flex flex-col justify-between relative z-20 shadow-sm shrink-0'>
            <div className='relative z-10'>
               <h1 onClick={handleLogout} className='text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-10 tracking-widest flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity'>
                  <Zap className='text-blue-600' size={24} /> BAIS
               </h1>
               <nav className='space-y-4'>
                  <button onClick={() => navigate('/analytics')} className='w-full flex items-center space-x-3 text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm transition-all'>
                      <LayoutDashboard size={20} /> <span className='font-bold'>Ochiq Tahlil</span>
                  </button>
                  <button onClick={() => navigate('/marketplace')} className='w-full flex items-center space-x-3 text-slate-500 hover:text-blue-600 hover:bg-slate-50 p-3 rounded-xl transition-all'>
                      <Package size={20} /> <span className='font-bold'>B2B Bozor</span>
                  </button>
               </nav>
            </div>
            <button onClick={handleLogout} className='flex items-center space-x-3 text-slate-500 hover:text-rose-500 transition-all font-medium relative z-10'>
                <LogOut size={20} /> <span>Bosh sahifa</span>
            </button>
         </aside>

         {/* ASOSIY OYNA */}
         <main className='flex-1 p-8 overflow-y-auto relative z-10 custom-scrollbar'>
            <header className='flex justify-between items-center mb-8'>
               <div>
                   <h2 className='text-3xl font-black text-slate-800 mb-2'>Hududiy Tahlil: <span className='text-blue-600'>{region}</span></h2>
                   <p className='text-slate-500 text-sm font-medium'>Python Backend va AI tomonidan ochiq tahlil qilinmoqda {loading && <span className='animate-pulse text-blue-500 font-bold'>...</span>}</p>
               </div>
               <select 
                   className='bg-white border border-slate-200 py-3 px-4 rounded-xl text-blue-600 font-bold outline-none cursor-pointer hover:border-blue-400 transition-all shadow-sm' 
                   value={region} 
                   onChange={e => setRegion(e.target.value)}
               >
                  <option value='Surxondaryo'>Surxondaryo</option>
                  <option value='Toshkent'>Toshkent</option>
                  <option value='Samarqand'>Samarqand</option>
                  <option value='Andijon'>Andijon</option>
                  <option value='Buxoro'>Buxoro</option>
               </select>
            </header>

            {!loading && analysis ? (
               <>
                  <div className='bg-white border border-slate-200 p-8 rounded-3xl mb-8 shadow-sm hover:shadow-md transition-shadow'>
                     <div className='flex justify-between items-center mb-6'>
                        <div>
                            <h3 className='text-xl font-bold text-slate-800 flex items-center gap-2'>
                                <TrendingUp className="text-blue-500" size={24}/> {analysis.sector}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1 font-medium">Bozor talabi va prognoz ko'rsatkichlari (2025-2026)</p>
                        </div>
                     </div>
                     <div className='w-full min-h-[350px] h-[350px]'>
                        <ResponsiveContainer width='100%' height='100%'>
                           <ComposedChart data={analysis.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                  <linearGradient id='colorPrognoz' x1='0' y1='0' x2='0' y2='1'>
                                      <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.2} />
                                      <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' vertical={false} />
                              <XAxis dataKey='name' stroke='#94a3b8' fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke='#94a3b8' fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontWeight: 'bold' }} />
                              <Area type='monotone' dataKey='prognoz_2026' name="Kutilayotgan talab" stroke='#3b82f6' strokeWidth={3} fillOpacity={1} fill='url(#colorPrognoz)' />
                              <Line type='monotone' dataKey='olingan_2025' name="Joriy talab" stroke='#94a3b8' strokeWidth={2} dot={{ r: 4, fill: '#ffffff', stroke: '#94a3b8' }} activeDot={{ r: 6 }} />
                           </ComposedChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* KARTALAR */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                     <div className='bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group'>
                         <div className="flex items-center gap-3 mb-3">
                             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors"><Building2 className="text-slate-400 group-hover:text-blue-500" size={20}/></div>
                             <p className='text-slate-500 font-bold text-xs uppercase tracking-widest'>Zavod Narxi</p>
                         </div>
                         <p className='text-2xl font-black text-slate-800'>{formatMoney(analysis.economics?.factoryPrice || 0)} <span className="text-xs text-slate-400">UZS</span></p>
                     </div>
                     
                     <div className='bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors group'>
                         <div className="flex items-center gap-3 mb-3">
                             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-orange-50 transition-colors"><MapPin className="text-slate-400 group-hover:text-orange-500" size={20}/></div>
                             <p className='text-slate-500 font-bold text-xs uppercase tracking-widest'>Logistika</p>
                         </div>
                         <p className='text-2xl font-black text-orange-500'>+{formatMoney(analysis.economics?.logistics || 0)} <span className="text-xs text-orange-300">UZS</span></p>
                     </div>

                     <div className='bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group'>
                         <div className="flex items-center gap-3 mb-3">
                             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors"><ShoppingCart className="text-slate-400 group-hover:text-blue-500" size={20}/></div>
                             <p className='text-slate-500 font-bold text-xs uppercase tracking-widest'>Bozordagi narx</p>
                         </div>
                         <p className='text-2xl font-black text-slate-800'>{formatMoney(analysis.economics?.marketPrice || 0)} <span className="text-xs text-slate-400">UZS</span></p>
                     </div>

                     <div className='bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden'>
                         <div className="absolute -right-4 -bottom-4 text-emerald-200 opacity-30"><DollarSign size={80}/></div>
                         <div className="relative z-10">
                             <div className="flex items-center gap-3 mb-3">
                                 <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><TrendingUp className="text-emerald-600" size={20}/></div>
                                 <p className='text-emerald-600 text-xs font-black uppercase tracking-widest'>Sof Foyda</p>
                             </div>
                             <p className='text-3xl font-black text-emerald-600'>{formatMoney(analysis.economics?.profitMargin || 0)} <span className="text-xs text-emerald-400">UZS</span></p>
                         </div>
                     </div>
                  </div>
               </>
            ) : (
                <div className="flex items-center justify-center py-20">
                    <Zap className="text-blue-400 animate-pulse" size={48}/>
                </div>
            )}
         </main>

         {/* O'NG SIDEBAR - CHAT */}
         <aside className='w-[350px] bg-white border-l border-slate-200 flex flex-col z-20 shadow-sm shrink-0'>
            <div className='p-6 border-b border-slate-100'>
                <h3 className='text-lg font-black text-slate-800 flex items-center gap-3'>
                    <div className='p-2 bg-blue-50 border border-blue-100 rounded-xl'>
                        <Bot size={20} className='text-blue-600' />
                    </div>
                    BAIS Intelligence
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-2">Ochiq bozor tahlilchisi</p>
            </div>
            
            <div className='flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/50 custom-scrollbar'>
               {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                     <div className={`max-w-[85%] p-4 text-[13px] rounded-2xl shadow-sm leading-relaxed ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm font-medium' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm font-medium'}`} style={{ whiteSpace: "pre-wrap" }}>
                         {m.text}
                     </div>
                  </div>
               ))}
               
               {isTyping && (
                  <div className='flex flex-col items-start'>
                     <div className='max-w-[85%] p-4 text-sm bg-white border border-slate-200 rounded-2xl rounded-bl-sm flex items-center gap-2 shadow-sm'>
                        <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce'></span>
                        <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75'></span>
                        <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150'></span>
                     </div>
                  </div>
               )}
               <div ref={chatEndRef} />
            </div>

            <div className='p-5 border-t border-slate-200 bg-white'>
               <form onSubmit={handleSendMessage} className='relative flex'>
                  <input 
                      type='text' 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      placeholder="Tahlil bo'yicha savol bering..." 
                      disabled={isTyping}
                      className='w-full bg-slate-100 border border-transparent text-slate-900 text-sm font-medium rounded-xl pl-4 pr-12 py-4 outline-none focus:bg-white focus:border-blue-300 transition-colors disabled:opacity-50' 
                  />
                  <button 
                      type='submit' 
                      disabled={isTyping || !chatInput.trim()} 
                      className='absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-sm disabled:opacity-50 hover:bg-blue-700 transition-colors'
                  >
                      <Send size={16} />
                  </button>
               </form>
            </div>
         </aside>
      </div>
   );
}