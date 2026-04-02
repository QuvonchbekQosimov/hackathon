import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  ArrowRight, 
  Shield, 
  Zap, 
  BarChart3, 
  Menu, 
  X, 
  Factory, 
  Truck, 
  ShoppingCart,
  Bot,
  CheckCircle2
} from 'lucide-react';

function Home() {
   const navigate = useNavigate();
   const [isScrolled, setIsScrolled] = useState(false);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

   useEffect(() => {
      const handleScroll = () => setIsScrolled(window.scrollY > 20);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   const features = [
     {
       icon: <Factory className="text-blue-500" size={32} />,
       title: "To'g'ridan-to'g'ri Zavodlar",
       desc: "Vositachilarsiz savdo qiling. Eng yaxshi zavod narxlarida xarid qiling yoki o'z mahsulotlaringizni global bozorga olib chiqing."
     },
     {
       icon: <Truck className="text-emerald-500" size={32} />,
       title: "Ochiq Logistika Auksioni",
       desc: "Yukingizni yetkazib berish uchun haydovchilar o'rtasida auksion o'tkazing va eng arzon, ishonchli variantni tanlang."
     },
     {
       icon: <Bot className="text-indigo-500" size={32} />,
       title: "AI Moliyaviy Tahlilchi",
       desc: "Sizning xaridlaringiz va savdolaringizni Gemini AI tahlil qiladi hamda biznesingizni o'stirish bo'yicha maslahatlar beradi."
     },
     {
       icon: <Shield className="text-amber-500" size={32} />,
       title: "OneID Xavfsizlik Tizimi",
       desc: "Platformadagi barcha foydalanuvchilar OneID orqali tasdiqlangan. Firibgarlik xavfi 0% ga tushirilgan ishonchli muhit."
     }
   ];

   const stats = [
     { value: "25 000+", label: "Tahlil qilingan ma'lumotlar" },
     { value: "100%", label: "Xavfsiz tranzaksiyalar" },
     { value: "24/7", label: "AI yordamchi" },
     { value: "0%", label: "Yashirin vositachi haqlari" },
   ];

   return (
      <div className='min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900'>
         
         {/* NAVBAR */}
         <nav className={`fixed w-full top-0 z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-slate-200 py-4' : 'bg-transparent border-transparent py-6'}`}>
            <div className='max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center'>
               
               {/* Logo */}
               <div className='flex items-center gap-3 cursor-pointer group' onClick={() => navigate('/')}>
                  <div className='w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform'>
                     <ActivityIcon />
                  </div>
                  <span className='text-2xl font-black tracking-tight text-slate-900'>
                     BAIS<span className="text-blue-600">.</span>
                  </span>
               </div>

               {/* Desktop Menu */}
               <div className='hidden md:flex items-center space-x-8'>
                  <button onClick={() => navigate('/marketplace')} className='text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors'>B2B Bozor</button>
                  <button onClick={() => navigate('/analytics')} className='text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors'>Ochiq Tahlil</button>
                  
                  <div className="h-6 w-px bg-slate-200"></div>

                  <button onClick={() => navigate('/login')} className='text-sm font-black text-slate-900 hover:text-blue-600 transition-colors'>Kirish</button>
                  <button onClick={() => navigate('/login')} className='bg-slate-900 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-blue-600/30 flex items-center gap-2 group'>
                     Boshlash <ArrowRight size={16} className='group-hover:translate-x-1 transition-transform'/>
                  </button>
               </div>

               {/* Mobile Menu Toggle */}
               <div className="md:hidden">
                  <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-900 p-2">
                     {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
               </div>
            </div>
         </nav>

         {/* MOBILE MENU */}
         {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col space-y-4 md:hidden">
               <button onClick={() => {navigate('/marketplace'); setMobileMenuOpen(false)}} className="w-full text-left py-4 border-b font-bold text-lg flex justify-between items-center">B2B Bozor <ChevronRight size={18}/></button>
               <button onClick={() => {navigate('/analytics'); setMobileMenuOpen(false)}} className="w-full text-left py-4 border-b font-bold text-lg flex justify-between items-center">Ochiq Tahlil <ChevronRight size={18}/></button>
               <button onClick={() => {navigate('/login'); setMobileMenuOpen(false)}} className="w-full text-left py-4 border-b font-bold text-lg flex justify-between items-center">Tizimga Kirish <ChevronRight size={18}/></button>
               <button onClick={() => {navigate('/login'); setMobileMenuOpen(false)}} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 text-center">Platformani Boshlash</button>
            </div>
         )}

         {/* HERO SECTION */}
         <section className='relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]'>
            <div className='absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10 opacity-60'></div>
            
            <div className='max-w-5xl mx-auto px-6 text-center relative z-10'>
              
               <h1 className='text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100'>
                  Biznesingizni <br className='hidden md:block' />
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>Sun'iy Intellekt</span> bilan boshqaring.
               </h1>
               
               <p className='max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200'>
                  Zavodlar, xaridorlar va logistika kompaniyalarini yagona platformada birlashtiruvchi ishonchli va aqlli savdo tarmog'i. 
               </p>
               
               <div className='flex flex-col sm:flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300'>
                  <button onClick={() => navigate('/login')} className='w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white h-14 px-8 rounded-2xl text-base font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95'>
                     Platformaga kirish <ArrowRight size={18} />
                  </button>
                  <button onClick={() => navigate('/marketplace')} className='w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-14 px-8 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2 active:scale-95'>
                     <ShoppingCart size={18}/> Bozorni ko'rish
                  </button>
               </div>
            </div>
         </section>

         {/* STATS SECTION */}
         <section className="border-y border-slate-200 bg-white">
           <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
                 {stats.map((stat, idx) => (
                   <div key={idx} className="text-center px-4">
                     <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{stat.value}</h3>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                   </div>
                 ))}
              </div>
           </div>
         </section>

         {/* FEATURES SECTION */}
         <section className="py-24 bg-slate-50">
           <div className="max-w-7xl mx-auto px-6">
             <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Nega aynan BAIS?</h2>
               <p className="text-lg text-slate-500 font-medium">An'anaviy savdodagi vositachilar, tushunarsiz logistika narxlari va ishonchsizlik muammolarini bitta platformada hal qildik.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {features.map((feature, idx) => (
                 <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all group">
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     {feature.icon}
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
                   <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                 </div>
               ))}
             </div>
           </div>
         </section>

         {/* HOW IT WORKS / ROLES */}
         <section className="py-24 bg-white overflow-hidden">
           <div className="max-w-7xl mx-auto px-6">
             <div className="flex flex-col lg:flex-row items-center gap-16">
               <div className="flex-1 space-y-8">
                 <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">Uchta rol, bitta <br/> <span className="text-blue-600">mukammal zanjir</span></h2>
                 <div className="space-y-6">
                   <div className="flex gap-4">
                     <div className="mt-1"><CheckCircle2 className="text-emerald-500" size={24}/></div>
                     <div>
                       <h4 className="text-xl font-black text-slate-900 mb-1">1. Zavod (Ishlab chiqaruvchi)</h4>
                       <p className="text-slate-500 font-medium">O'z mahsulotlarini platformaga kiritadi va to'g'ridan-to'g'ri xaridorlar bilan ishlaydi.</p>
                     </div>
                   </div>
                   <div className="flex gap-4">
                     <div className="mt-1"><CheckCircle2 className="text-blue-500" size={24}/></div>
                     <div>
                       <h4 className="text-xl font-black text-slate-900 mb-1">2. Xaridor (Mijoz)</h4>
                       <p className="text-slate-500 font-medium">Bozordan tovarlarni qulay narxda topadi, AI yordamida tahlil qiladi va xaridni amalga oshiradi.</p>
                     </div>
                   </div>
                   <div className="flex gap-4">
                     <div className="mt-1"><CheckCircle2 className="text-amber-500" size={24}/></div>
                     <div>
                       <h4 className="text-xl font-black text-slate-900 mb-1">3. Logistika (Haydovchi)</h4>
                       <p className="text-slate-500 font-medium">Xaridor tomonidan e'lon qilingan yuklar bo'yicha auksionda qatnashib, buyurtmani qabul qiladi.</p>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="flex-1 w-full">
                 <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                   <div className="relative z-10">
                     <Zap className="text-blue-400 mb-6" size={40} />
                     <h3 className="text-2xl md:text-3xl font-black mb-6 leading-tight">Biznesingizni keyingi bosqichga olib chiqishga tayyormisiz?</h3>
                     <p className="text-slate-400 font-medium mb-10">Hozir ro'yxatdan o'ting va sun'iy intellekt tahlilchidan bepul maslahat oling.</p>
                     <button onClick={() => navigate('/login')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                       Ro'yxatdan o'tish <ArrowRight size={18}/>
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </section>

         {/* FOOTER */}
         <footer className="bg-slate-50 border-t border-slate-200 py-12">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className='w-8 h-8 bg-blue-600 rounded flex items-center justify-center'><ActivityIcon /></div>
                  <span className="text-xl font-black text-slate-900">BAIS.</span>
               </div>
               <p className="text-slate-500 font-medium text-sm text-center md:text-left">
                 © 2026 BAIS Enterprise. Barcha huquqlar himoyalangan. O'zbekiston.
               </p>
            </div>
         </footer>
      </div>
   );
}

// Logo icon component
function ActivityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  )
}

export default Home;