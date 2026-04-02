import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import {
    ArrowLeft,
    MapPin,
    TrendingUp,
    Package,
    Zap,
    Building2,
    Phone,
    Bot,
    Send,
} from 'lucide-react';

export default function ProductDetail() {
    const navigate = useNavigate();
    const { id: productId } = useParams();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: "Siz tanlagan mahsulot tahlili bo'yicha yordam berishga tayyorman. Boshlang'ich sarmoyangizni yozing.",
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axios.get(
                    `http://localhost:8000/api/products/${productId}`
                );
                setData(res.data);
            } catch (error) {
                console.error('Xato:', error);
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchDetail();
    }, [productId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        setMessages((prev) => [...prev, { sender: 'user', text: chatInput }]);
        const userText = chatInput;
        setChatInput('');
        setIsTyping(true);
        try {
            const chatRes = await axios.post('http://localhost:8000/api/chat/', {
                message: userText,
            });
            setMessages((prev) => [...prev, { sender: 'ai', text: chatRes.data.reply }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { sender: 'ai', text: "Server bilan aloqa yo'qolgan." },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const formatMoney = (amount) =>
        amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    if (loading)
        return (
            <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
                <Zap className='text-blue-500 animate-pulse' size={60} />
            </div>
        );
    if (!data || !data.product)
        return (
            <div className='p-10 text-center text-rose-500 font-bold'>
                Mahsulot topilmadi!
            </div>
        );

    const {
        product: info,
        top_regions: topRegions = [],
        yearly_trend: yearlyTrend = [],
    } = data;

    const aiSummary =
        data.aiSummary ||
        "Ushbu mahsulot bo'yicha sun'iy intellekt tahlili jarayonda.";

    return (
        <div className='min-h-screen bg-slate-50 text-slate-900 font-sans flex selection:bg-blue-200'>
            {/* ASOSIY OYNA */}
            <main className='flex-1 p-8 overflow-y-auto relative z-10 custom-scrollbar'>
                <button
                    onClick={() => navigate('/marketplace')}
                    className='flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-8 font-bold bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm w-max'
                >
                    <ArrowLeft size={20} /> Bozorga qaytish
                </button>

                <div className='grid lg:grid-cols-3 gap-8 mb-8'>
                    {/* Chap Ustun: Zavod ma'lumotlari */}
                    <div className='lg:col-span-1 space-y-6'>
                        <div className='bg-white border border-slate-200 p-8 rounded-3xl relative overflow-hidden shadow-sm'>
                            <div className='absolute top-0 right-0 p-4 opacity-5 text-blue-600'>
                                <Package size={120} />
                            </div>
                            <span className='text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg mb-4 inline-block'>
                                {info.category || 'Mahsulot'}
                            </span>
                            <h1 className='text-3xl font-black text-slate-800 mb-2 leading-tight relative z-10'>
                                {info.name}
                            </h1>
                            <p className='text-emerald-600 text-4xl font-black mb-6 mt-4'>
                                {formatMoney(info.price || info.factory_price || 0)}{' '}
                                <span className='text-sm font-bold text-slate-500'>UZS</span>
                            </p>

                            <div className='space-y-5 pt-6 border-t border-slate-100 relative z-10'>
                                <div className='flex items-start gap-3'>
                                    <Building2 className='text-blue-500 mt-1' size={20} />
                                    <div>
                                        <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                                            Zavod
                                        </p>
                                        <p className='font-bold text-slate-800'>
                                            {info.factory_name || 'BAIS Zavod'}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-start gap-3'>
                                    <MapPin className='text-rose-500 mt-1' size={20} />
                                    <div>
                                        <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                                            Manzil
                                        </p>
                                        <p className='font-bold text-slate-800'>
                                            {info.location || "O'zbekiston"}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-start gap-3'>
                                    <Package className='text-emerald-500 mt-1' size={20} />
                                    <div>
                                        <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                                            Ombor Zaxirasi
                                        </p>
                                        <p className='font-bold text-slate-800'>
                                            {info.stock_quantity || info.stock || 0} dona
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-start gap-3'>
                                    <Phone className='text-amber-500 mt-1' size={20} />
                                    <div>
                                        <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                                            Aloqa uchun
                                        </p>
                                        <p className='font-bold text-slate-800'>
                                            {info.contact_phone || "Mavjud emas"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white border border-slate-200 p-8 rounded-3xl shadow-sm'>
                             <h3 className='text-lg font-bold text-slate-800 mb-4'>Mahsulot tavsifi</h3>
                             <p className='text-slate-600 font-medium text-sm leading-relaxed'>
                                 {info.description || "Ushbu mahsulot uchun batafsil tavsif kiritilmagan. Mahsulot to'g'ridan to'g'ri ishlab chiqaruvchi tomonidan taqdim etiladi."}
                             </p>
                        </div>
                    </div>

                    {/* O'ng Ustun: AI Xulosasi va Grafiklar */}
                    <div className='lg:col-span-2 space-y-6'>
                        <div className='bg-blue-50/50 p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden'>
                            <div className='absolute -right-4 -bottom-4 text-blue-200 opacity-50'>
                                <Bot size={100} />
                            </div>
                            <div className='relative z-10'>
                                <h3 className='text-blue-700 font-bold mb-3 flex items-center gap-2'>
                                    <Bot size={20} className='text-blue-600' /> Tahlil Xulosasi
                                </h3>
                                <p className='text-slate-600 leading-relaxed text-sm font-medium'>
                                    {aiSummary}
                                </p>
                            </div>
                        </div>

                        <div className='grid md:grid-cols-2 gap-6'>
                            <div className='bg-white border border-slate-200 p-6 rounded-3xl shadow-sm'>
                                <h3 className='text-base font-bold text-slate-800 mb-4 flex items-center gap-2'>
                                    <MapPin size={18} className='text-blue-500' /> Hududiy Talab
                                </h3>
                                <div className='h-48 w-full'>
                                    <ResponsiveContainer width='100%' height='100%'>
                                        <BarChart
                                            data={
                                                topRegions.length > 0
                                                    ? topRegions
                                                    : [
                                                          { region: 'Toshkent', total_sold: 50 },
                                                          { region: 'Samarqand', total_sold: 30 },
                                                      ]
                                            }
                                            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                                            layout='vertical'
                                        >
                                            <CartesianGrid
                                                strokeDasharray='3 3'
                                                stroke='#f1f5f9'
                                                horizontal={true}
                                                vertical={false}
                                            />
                                            <XAxis
                                                type='number'
                                                stroke='#94a3b8'
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                dataKey='region'
                                                type='category'
                                                stroke='#64748b'
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                width={80}
                                            />
                                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                                            <Bar
                                                dataKey='total_sold'
                                                fill='#3b82f6'
                                                radius={[0, 4, 4, 0]}
                                                barSize={16}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className='bg-white border border-slate-200 p-6 rounded-3xl shadow-sm'>
                                <h3 className='text-base font-bold text-slate-800 mb-4 flex items-center gap-2'>
                                    <TrendingUp size={18} className='text-emerald-500' /> Yillik Dinamika
                                </h3>
                                <div className='h-48 w-full'>
                                    <ResponsiveContainer width='100%' height='100%'>
                                        <AreaChart
                                            data={
                                                yearlyTrend.length > 0
                                                    ? yearlyTrend
                                                    : [
                                                          { year: '2024', total_volume: 100 },
                                                          { year: '2025', total_volume: 150 },
                                                      ]
                                            }
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id='colorTrend'
                                                    x1='0'
                                                    y1='0'
                                                    x2='0'
                                                    y2='1'
                                                >
                                                    <stop
                                                        offset='5%'
                                                        stopColor='#10b981'
                                                        stopOpacity={0.2}
                                                    />
                                                    <stop
                                                        offset='95%'
                                                        stopColor='#10b981'
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray='3 3'
                                                stroke='#f1f5f9'
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey='year'
                                                stroke='#94a3b8'
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke='#94a3b8'
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(val) => `${val / 1000}k`}
                                            />
                                            <RechartsTooltip />
                                            <Area
                                                type='monotone'
                                                dataKey='total_volume'
                                                stroke='#10b981'
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill='url(#colorTrend)'
                                                activeDot={{ r: 6 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* O'NG PANEL (AI CHATBOT) */}
            <aside className='w-[350px] bg-white border-l border-slate-200 flex flex-col z-20 shadow-sm shrink-0'>
                <div className='p-6 border-b border-slate-100'>
                    <h3 className='text-lg font-bold text-slate-800 flex items-center gap-3'>
                        <div className='p-2.5 bg-blue-50 border border-blue-100 rounded-xl'>
                            <Bot size={20} className='text-blue-600' />
                        </div>
                        Moliya Maslahatchisi
                    </h3>
                    <p className='text-xs text-slate-500 mt-2 font-medium'>
                        Ushbu mahsulot bo'yicha hisob-kitoblar
                    </p>
                </div>

                <div className='flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/50 custom-scrollbar'>
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-4 text-sm font-medium leading-relaxed rounded-2xl shadow-sm ${
                                    m.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                                }`}
                                style={{ whiteSpace: "pre-wrap" }}
                            >
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
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder='Savol yoki byudjet yozing...'
                            disabled={isTyping}
                            className='w-full bg-slate-100 border border-transparent text-slate-900 text-sm font-medium rounded-xl pl-4 pr-12 py-4 outline-none focus:bg-white focus:border-blue-300 transition-colors'
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