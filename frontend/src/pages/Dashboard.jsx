import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Truck,
  Bot,
  User,
  LogOut,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Download,
  Pencil,
  Archive,
} from "lucide-react";
import { useAuth } from "../auth-context";
import {
  getProducts,
  getOrders,
  getTrips,
  getSummary,
  createProduct,
  editProduct,
  archiveProduct,
  restoreProduct,
  acceptOrder,
  cancelOrder,
  completeOrder,
  createTrip,
  createBid,
  getBids,
  acceptBid,
  startTrip,
  deliverTrip,
  saveProfile,
  changePassword,
} from "../api";
import {
  Logo,
  Loading,
  Empty,
  ErrorNotice,
  Field,
  Status,
  Modal,
} from "../components/UI";
import ChatPanel from "../components/ChatPanel";
import { money, date, roles, exportCSV } from "../utils";

const blankProduct = {
  name: "",
  category: "",
  price: "",
  stock_quantity: 0,
  location: "",
  min_order: "",
  contact_phone: "",
  description: "",
};
const productFields = [
  ["name", "Mahsulot nomi"],
  ["category", "Kategoriya"],
  ["price", "Birlik narxi (UZS)", "number"],
  ["stock_quantity", "Ombor qoldig‘i", "number"],
  ["location", "Manzil"],
  ["min_order", "Minimal buyurtma sharti"],
  ["contact_phone", "Aloqa telefoni"],
];
const profileFields = [
  ["first_name", "Ism"],
  ["last_name", "Familiya"],
  ["company_name", "Kompaniya nomi"],
  ["email", "Email", "email"],
  ["address", "Manzil"],
];

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]),
    [orders, setOrders] = useState([]),
    [trips, setTrips] = useState([]),
    [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null),
    [form, setForm] = useState({}),
    [busy, setBusy] = useState(false),
    [modalError, setModalError] = useState(""),
    [bids, setBids] = useState([]),
    [bidsLoading, setBidsLoading] = useState(false);
  const [page, setPage] = useState(1),
    [bidAmounts, setBidAmounts] = useState({});
  const requestSequence = useRef(0);
  const [includeArchived, setIncludeArchived] = useState(false);
  const menus = [
    ["overview", "Umumiy holat", LayoutDashboard],
    ...(user.role === "FACTORY" ? [["products", "Mahsulotlar", Package]] : []),
    ...(user.role !== "DRIVER"
      ? [
          [
            "orders",
            user.role === "FACTORY" ? "Tushgan buyurtmalar" : "Xaridlarim",
            ClipboardList,
          ],
        ]
      : []),
    ["logistics", "Logistika", Truck],
    ["assistant", "Yordamchi", Bot],
    ["profile", "Profil", User],
  ];
  const requested = params.get("tab") || "overview";
  const tab = menus.some((m) => m[0] === requested) ? requested : "overview";
  const title = menus.find((m) => m[0] === tab)?.[1];
  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setRefreshing(true);
    setError("");
    try {
      const offset = (page - 1) * 25;
      const [p, o, t, s] = await Promise.all([
        user.role === "FACTORY"
          ? getProducts({
              mine: true,
              include_archived: includeArchived,
              limit: 25,
              offset,
            })
          : Promise.resolve({ data: [] }),
        user.role !== "DRIVER"
          ? getOrders({ limit: 25, offset })
          : Promise.resolve({ data: [] }),
        getTrips({ limit: 25, offset }),
        getSummary(),
      ]);
      if (sequence === requestSequence.current) {
        setProducts(p.data);
        setOrders(o.data);
        setTrips(t.data);
        setSummary(s.data);
      }
    } catch (e) {
      if (sequence === requestSequence.current) setError(e.message);
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [page, user.role, includeArchived]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 30000);
    return () => clearInterval(timer);
  }, [load]);
  const close = useCallback(() => {
    setModal(null);
    setModalError("");
  }, []);
  const open = (kind, item) => {
    setModal({ kind, item });
    setModalError("");
    setNotice("");
    if (kind === "product")
      setForm(
        item
          ? Object.fromEntries(
              Object.keys(blankProduct).map((k) => [
                k,
                item[k] ?? blankProduct[k],
              ]),
            )
          : { ...blankProduct },
      );
    if (kind === "trip")
      setForm({
        from_location: "",
        to_location: user.address || "",
        customer_price: "",
        weight_tons: "",
      });
  };
  const act = async (operation, message, closeModal = false) => {
    if (busy) return false;
    setBusy(true);
    setError("");
    setModalError("");
    setNotice("");
    try {
      await operation();
      if (closeModal) close();
      setNotice(message);
      await load();
      return true;
    } catch (e) {
      if (modal) setModalError(e.message);
      else setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const change = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    if (modal.kind === "product") {
      const data = {
        ...form,
        price: String(form.price),
        stock_quantity: Number(form.stock_quantity),
      };
      act(
        () =>
          modal.item ? editProduct(modal.item.id, data) : createProduct(data),
        "Mahsulot saqlandi.",
        true,
      );
    } else if (modal.kind === "trip")
      act(
        () => createTrip({ ...form, order_id: modal.item.id }),
        "Logistika auksioni yaratildi.",
        true,
      );
  };
  const showBids = async (trip) => {
    open("bids", trip);
    setBidsLoading(true);
    setBids([]);
    try {
      setBids((await getBids(trip.id)).data);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setBidsLoading(false);
    }
  };
  const switchTab = (next) => {
    setPage(1);
    setParams({ tab: next });
    setNotice("");
  };
  const rows =
    tab === "products" ? products : tab === "orders" ? orders : trips;
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <a href="#cabinet-main" className="skip-link">
        Kabinet mazmuniga o'tish
      </a>
      <aside className="lg:fixed lg:inset-y-0 lg:w-64 bg-white border-b lg:border-r border-slate-200 z-20 flex flex-col">
        <div className="px-6 py-6 flex justify-between items-center">
          <Logo />
          <Link
            to="/marketplace"
            className="lg:hidden text-sm text-blue-600 font-bold"
          >
            Bozor
          </Link>
        </div>
        <div className="px-5 pb-3 hidden lg:block">
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            {roles[user.role]} kabineti
          </p>
        </div>
        <nav
          aria-label="Kabinet bo'limlari"
          className="flex lg:flex-col overflow-x-auto px-3 pb-3 gap-1 lg:flex-1"
        >
          {menus.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left ${tab === id ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-5 border-t border-slate-100 hidden lg:block">
          <p className="font-bold text-sm truncate">
            {user.company_name || user.first_name || "Foydalanuvchi"}
          </p>
          <p className="text-xs text-slate-400 mt-1">{user.phone_number}</p>
          <button
            className="flex gap-2 text-sm font-semibold text-slate-500 mt-4 hover:text-red-600"
            onClick={() => act(logout, "Hisobdan chiqildi.")}
            disabled={busy}
          >
            <LogOut size={16} />
            Chiqish
          </button>
        </div>
      </aside>
      <div className="lg:ml-64 flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex justify-between gap-3 items-center">
          <p className="text-sm text-slate-500">
            {roles[user.role]}{" "}
            <span className="hidden sm:inline">
              / {user.company_name || user.phone_number}
            </span>
          </p>
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary"
              onClick={load}
              disabled={refreshing}
              aria-label="Ma'lumotlarni yangilash"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Yangilash</span>
            </button>
            <Link to="/marketplace" className="btn-primary hidden lg:flex">
              Bozor
              <ArrowUpRight size={15} />
            </Link>
            <button
              className="lg:hidden p-2 text-slate-500"
              aria-label="Hisobdan chiqish"
              disabled={busy}
              onClick={() => act(logout, "Hisobdan chiqildi.")}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="cabinet-main" className="p-4 sm:p-8 max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
            <div>
              <h1 className="text-3xl font-black">{title}</h1>
              <p className="text-slate-500 text-sm mt-2">
                {tab === "overview"
                  ? "Hisobingizdagi joriy savdo va logistika holati."
                  : "Amallar server tomonidan hisobingiz huquqlariga muvofiq tekshiriladi."}
              </p>
            </div>
            {tab === "products" && (
              <button className="btn-primary" onClick={() => open("product")}>
                <Plus size={17} />
                Mahsulot qo'shish
              </button>
            )}
            {tab === "orders" && (
              <button
                className="btn-secondary"
                disabled={!orders.length}
                onClick={() =>
                  exportCSV(orders, "BAIS_buyurtmalar_sahifa_" + page)
                }
              >
                <Download size={16} />
                CSV eksport
              </button>
            )}
          </div>
          <ErrorNotice message={error} retry={load} />
          {notice && (
            <div
              role="status"
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 mb-6"
            >
              {notice}
            </div>
          )}
          {loading ? (
            <Loading />
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                    {[
                      ["Jami buyurtmalar", summary.total || 0],
                      ["Yakunlangan", summary.completed || 0],
                      ["Yetkazilgan summa", money(summary.revenue) + " UZS"],
                      [
                        user.role === "FACTORY"
                          ? "Faol mahsulotlar"
                          : "Kutilayotgan",
                        user.role === "FACTORY"
                          ? summary.products || 0
                          : summary.pending || 0,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="panel">
                        <p className="text-sm text-slate-500 mb-4">{label}</p>
                        <p className="text-2xl font-black break-words">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <section className="panel">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-3">
                      Keyingi qadam
                    </p>
                    <h2 className="font-bold text-xl mb-3">
                      {user.role === "FACTORY"
                        ? "Katalogingizni to‘ldiring va buyurtmalarni tasdiqlang"
                        : user.role === "BUYER"
                          ? "Mahsulot tanlang, zavod tasdig‘idan so‘ng logistika yarating"
                          : "Ochiq yuklarga narx taklif qiling"}
                    </h2>
                    <p className="text-slate-500 text-sm mb-6">
                      {user.role === "DRIVER"
                        ? "Taklifingiz tanlanganda yukni olish va yetkazish bosqichlarini kabinetdan boshqaring."
                        : "Buyurtmalar bo‘yicha har bir bosqich alohida qayd etiladi. Narx va miqdor buyurtma vaqtida saqlanadi."}
                    </p>
                    <button
                      className="btn-primary"
                      onClick={() =>
                        switchTab(
                          user.role === "FACTORY"
                            ? "products"
                            : user.role === "DRIVER"
                              ? "logistics"
                              : "orders",
                        )
                      }
                    >
                      Ishni boshlash
                      <ArrowUpRight size={16} />
                    </button>
                  </section>
                  <p className="text-xs text-slate-400 mt-5">
                    Yetkazilgan summa to'lov qabul qilinganini tasdiqlamaydi.
                    Tashqi to'lov integratsiyasi hali ulanmagan.
                  </p>
                </>
              )}
              {tab === "products" && (
                <label className="flex items-center gap-2 text-sm text-slate-500 mb-5">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => {
                      setPage(1);
                      setIncludeArchived(e.target.checked);
                    }}
                  />
                  Arxivlangan mahsulotlarni ham ko'rsatish
                </label>
              )}
              {tab === "products" &&
                (products.length ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <article key={p.id} className="panel">
                        <p className="text-xs font-semibold text-blue-600 mb-3">
                          {p.category}
                        </p>
                        <h2 className="font-bold text-lg">{p.name}</h2>
                        {!p.is_active && (
                          <span className="status status-muted mt-2">
                            Arxivlangan
                          </span>
                        )}
                        {!p.is_active && (
                          <button
                            className="btn-secondary mt-3"
                            disabled={busy}
                            onClick={() =>
                              act(
                                () => restoreProduct(p.id),
                                "Mahsulot katalogga qaytarildi.",
                              )
                            }
                          >
                            Katalogga qaytarish
                          </button>
                        )}

                        <p className="text-2xl font-black my-4">
                          {money(p.price)}{" "}
                          <span className="text-xs text-slate-400">UZS</span>
                        </p>
                        <p className="text-sm text-slate-500 mb-5">
                          Qoldiq: {p.stock_quantity} ta
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn-secondary"
                            onClick={() => open("product", p)}
                          >
                            <Pencil size={14} />
                            Tahrirlash
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => open("archive", p)}
                          >
                            <Archive size={14} />
                            Arxiv
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="Omboringizda mahsulot yo'q"
                    description="Birinchi mahsulotingizni katalogga qo'shing."
                  >
                    <button
                      className="btn-primary"
                      onClick={() => open("product")}
                    >
                      Mahsulot qo'shish
                    </button>
                  </Empty>
                ))}
              {tab === "orders" &&
                (orders.length ? (
                  <div className="panel p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Mahsulot</th>
                          <th className="px-5 py-4">Miqdor</th>
                          <th className="px-5 py-4">Jami</th>
                          <th className="px-5 py-4">Holat</th>
                          <th className="px-5 py-4">Amallar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className="border-t border-slate-100">
                            <td className="px-5 py-5 min-w-48">
                              <strong>{o.product_name}</strong>
                              <p className="text-xs text-slate-400 mt-1">
                                {date(o.created_at)} · #{o.id.slice(0, 8)}
                              </p>
                            </td>
                            <td className="px-5 py-5">{o.quantity}</td>
                            <td className="px-5 py-5 font-semibold whitespace-nowrap">
                              {money(o.total_amount)} UZS
                            </td>
                            <td className="px-5 py-5">
                              <Status value={o.status} />
                            </td>
                            <td className="px-5 py-5">
                              <div className="flex flex-wrap gap-2 min-w-48">
                                {user.role === "FACTORY" &&
                                  o.status === "PENDING" && (
                                    <button
                                      className="btn-primary"
                                      disabled={busy}
                                      onClick={() =>
                                        act(
                                          () => acceptOrder(o.id),
                                          "Buyurtma tasdiqlandi.",
                                        )
                                      }
                                    >
                                      Tasdiqlash
                                    </button>
                                  )}
                                {["PENDING", "ACCEPTED"].includes(o.status) && (
                                  <button
                                    className="btn-danger"
                                    disabled={busy}
                                    onClick={() => open("cancel", o)}
                                  >
                                    Bekor qilish
                                  </button>
                                )}
                                {user.role === "BUYER" &&
                                  o.status === "ACCEPTED" && (
                                    <>
                                      <button
                                        className="btn-secondary"
                                        onClick={() => open("trip", o)}
                                      >
                                        Logistika yaratish
                                      </button>
                                      <button
                                        className="btn-secondary"
                                        onClick={() => open("complete", o)}
                                      >
                                        Qabul qildim
                                      </button>
                                    </>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="Buyurtmalar mavjud emas"
                    description={
                      user.role === "BUYER"
                        ? "Bozordan mahsulot tanlab buyurtma bering."
                        : "Yangi buyurtmalar shu yerda paydo bo'ladi."
                    }
                  >
                    {user.role === "BUYER" && (
                      <Link className="btn-primary" to="/marketplace">
                        Bozorga o'tish
                      </Link>
                    )}
                  </Empty>
                ))}
              {tab === "logistics" &&
                (trips.length ? (
                  <div className="space-y-4">
                    {trips.map((t) => (
                      <article className="panel" key={t.id}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-2">
                              Yuk #{t.id.slice(0, 8)}
                            </p>
                            <h2 className="text-lg font-bold">
                              {t.product_name}
                            </h2>
                            <p className="text-sm text-slate-500 mt-2">
                              {t.from_location} → {t.to_location}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              {money(t.weight_tons)} tonna · {t.quantity} ta
                              mahsulot
                            </p>
                          </div>
                          <Status value={t.status} />
                        </div>
                        <div className="flex flex-wrap justify-between items-end gap-5 mt-6">
                          <div>
                            <p className="text-xs text-slate-500">
                              {t.accepted_price
                                ? "Kelishilgan narx"
                                : "Xaridor taklif qilgan narx"}
                            </p>
                            <p className="text-xl font-black mt-1">
                              {money(t.accepted_price || t.customer_price)} UZS
                            </p>
                            {t.my_bid && (
                              <p className="text-sm text-blue-600 mt-2">
                                Sizning taklifingiz:{" "}
                                {money(t.my_bid.offered_price)} UZS
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {user.role === "DRIVER" &&
                              t.status === "SEARCHING_DRIVER" && (
                                <form
                                  className="flex gap-2"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    act(
                                      () =>
                                        createBid({
                                          trip_id: t.id,
                                          offered_price: bidAmounts[t.id],
                                        }),
                                      "Taklif yuborildi.",
                                    );
                                  }}
                                >
                                  <input
                                    aria-label="Taklif narxi (UZS)"
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    max="1000000000000"
                                    className="input w-40"
                                    placeholder="Narx (UZS)"
                                    value={bidAmounts[t.id] || ""}
                                    onChange={(e) =>
                                      setBidAmounts((prev) => ({
                                        ...prev,
                                        [t.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <button
                                    className="btn-primary"
                                    disabled={busy}
                                  >
                                    Taklif qilish
                                  </button>
                                </form>
                              )}
                            {user.role !== "DRIVER" && (
                              <button
                                className="btn-secondary"
                                onClick={() => showBids(t)}
                              >
                                Takliflarni ko'rish
                              </button>
                            )}
                            {user.role === "DRIVER" &&
                              t.status === "ASSIGNED" && (
                                <button
                                  className="btn-primary"
                                  disabled={busy}
                                  onClick={() =>
                                    act(
                                      () => startTrip(t.id),
                                      "Yuk yo‘lga chiqdi.",
                                    )
                                  }
                                >
                                  Yo'lga chiqdim
                                </button>
                              )}
                            {user.role === "DRIVER" &&
                              t.status === "IN_TRANSIT" && (
                                <button
                                  className="btn-primary"
                                  disabled={busy}
                                  onClick={() =>
                                    act(
                                      () => deliverTrip(t.id),
                                      "Yetkazish qayd etildi. Xaridor tasdig‘i kutilmoqda.",
                                    )
                                  }
                                >
                                  Yetkazdim
                                </button>
                              )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="Yuklar mavjud emas"
                    description={
                      user.role === "BUYER"
                        ? "Tasdiqlangan buyurtmangiz uchun Xaridlarim bo‘limida logistika yarating."
                        : "Faol yuklar shu yerda ko‘rinadi."
                    }
                  />
                ))}
              {["products", "orders", "logistics"].includes(tab) && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    className="btn-secondary"
                    disabled={page === 1 || refreshing}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Oldingi
                  </button>
                  <span className="text-sm text-slate-500">
                    {page}-sahifa · 25 tadan
                  </span>
                  <button
                    className="btn-secondary"
                    disabled={rows.length < 25 || refreshing}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Keyingi
                  </button>
                </div>
              )}
              {tab === "assistant" && (
                <div className="max-w-3xl">
                  <ChatPanel />
                </div>
              )}
              {tab === "profile" && (
                <ProfileEditor
                  user={user}
                  busy={busy}
                  save={(data) =>
                    act(async () => {
                      setUser((await saveProfile(data)).data);
                    }, "Profil saqlandi.")
                  }
                />
              )}
            </>
          )}
        </main>
      </div>
      {modal && (
        <Modal
          title={
            modal.kind === "product"
              ? modal.item
                ? "Mahsulotni tahrirlash"
                : "Yangi mahsulot"
              : modal.kind === "trip"
                ? "Logistika auksioni"
                : modal.kind === "bids"
                  ? "Haydovchilar takliflari"
                  : "Amalni tasdiqlash"
          }
          onClose={close}
          busy={busy}
        >
          <ErrorNotice message={modalError} />
          {["product", "trip"].includes(modal.kind) ? (
            <form onSubmit={submit} className="space-y-4">
              {modal.kind === "product" ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {productFields.map(([name, label, type = "text"]) => (
                      <Field
                        key={name}
                        label={label}
                        name={name}
                        type={type}
                        required={[
                          "name",
                          "category",
                          "price",
                          "stock_quantity",
                        ].includes(name)}
                        value={form[name]}
                        onChange={change}
                        min={
                          type === "number"
                            ? name === "price"
                              ? ".01"
                              : 0
                            : undefined
                        }
                        step={
                          name === "price"
                            ? ".01"
                            : type === "number"
                              ? 1
                              : undefined
                        }
                        maxLength={
                          name === "category"
                            ? 100
                            : name === "min_order"
                              ? 100
                              : name === "contact_phone"
                                ? 50
                                : 255
                        }
                      />
                    ))}
                  </div>
                  <label className="block text-sm font-semibold">
                    Tavsif
                    <textarea
                      className="input mt-2 min-h-24"
                      name="description"
                      value={form.description}
                      onChange={change}
                      maxLength={5000}
                    />
                  </label>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-4">
                    {modal.item.product_name}
                  </p>
                  <Field
                    label="Yuk olinadigan manzil"
                    name="from_location"
                    required
                    minLength={2}
                    maxLength={255}
                    value={form.from_location}
                    onChange={change}
                  />
                  <Field
                    label="Yetkazish manzili"
                    name="to_location"
                    required
                    minLength={2}
                    maxLength={255}
                    value={form.to_location}
                    onChange={change}
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field
                      label="Yuk vazni (tonna)"
                      name="weight_tons"
                      type="number"
                      min=".001"
                      max="1000"
                      step=".001"
                      required
                      value={form.weight_tons}
                      onChange={change}
                    />
                    <Field
                      label="Taklif narxi (UZS)"
                      name="customer_price"
                      type="number"
                      min=".01"
                      max="1000000000000"
                      step=".01"
                      required
                      value={form.customer_price}
                      onChange={change}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={close}
                  disabled={busy}
                >
                  Yopish
                </button>
                <button className="btn-primary" disabled={busy}>
                  {busy ? "Saqlanmoqda…" : "Saqlash"}
                </button>
              </div>
            </form>
          ) : modal.kind === "bids" ? (
            bidsLoading ? (
              <Loading />
            ) : bids.length ? (
              <div className="space-y-3">
                {bids.map((b) => (
                  <div
                    className="border border-slate-200 rounded-xl p-4 flex flex-wrap justify-between gap-3 items-center"
                    key={b.id}
                  >
                    <div>
                      <p className="font-bold">
                        {b.first_name ||
                          b.company_name ||
                          `Haydovchi #${b.driver_id.slice(0, 6)}`}
                      </p>
                      <p className="text-lg font-black mt-1">
                        {money(b.offered_price)} UZS
                      </p>
                      <Status value={b.status} />
                    </div>
                    {user.role === "BUYER" &&
                      modal.item.status === "SEARCHING_DRIVER" &&
                      b.status === "PENDING" && (
                        <button
                          className="btn-primary"
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => acceptBid(b.id),
                              "Haydovchi tanlandi.",
                              true,
                            )
                          }
                        >
                          Tanlash
                        </button>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="Hali taklif yo'q"
                description="Haydovchilar taklif qilganda shu yerda ko'rinadi."
              />
            )
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-6">
                {modal.kind === "archive"
                  ? `“${modal.item.name}” katalogdan arxivlanadi. Eski buyurtmalar saqlanadi.`
                  : modal.kind === "cancel"
                    ? "Buyurtma bekor qilinadi va ajratilgan mahsulot omborga qaytariladi."
                    : "Mahsulotni olganingizni tasdiqlaysiz. Buyurtma yakunlanadi."}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="btn-secondary"
                  onClick={close}
                  disabled={busy}
                >
                  Ortga
                </button>
                <button
                  className={
                    modal.kind === "complete" ? "btn-primary" : "btn-danger"
                  }
                  disabled={busy}
                  onClick={() =>
                    act(
                      () =>
                        modal.kind === "archive"
                          ? archiveProduct(modal.item.id)
                          : modal.kind === "cancel"
                            ? cancelOrder(modal.item.id)
                            : completeOrder(modal.item.id),
                      "Amal bajarildi.",
                      true,
                    )
                  }
                >
                  Tasdiqlash
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function ProfileEditor({ user, busy, save }) {
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false),
    [passwordError, setPasswordError] = useState(""),
    [passwordNotice, setPasswordNotice] = useState("");
  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordBusy) return;
    setPasswordError("");
    setPasswordNotice("");
    if (passwords.new_password !== passwords.confirm) {
      setPasswordError("Yangi parol takrori mos kelmaydi.");
      return;
    }
    setPasswordBusy(true);
    try {
      await changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: "", new_password: "", confirm: "" });
      setPasswordNotice(
        "Parol yangilandi. Boshqa qurilmalardagi sessiyalar yopildi.",
      );
    } catch (e) {
      setPasswordError(e.message);
    } finally {
      setPasswordBusy(false);
    }
  };

  const [profile, setProfile] = useState(() =>
    Object.fromEntries(profileFields.map(([k]) => [k, user[k] || ""])),
  );
  return (
    <section className="panel max-w-2xl">
      <h2 className="text-xl font-bold mb-2">Shaxsiy ma'lumotlar</h2>
      <p className="text-sm text-slate-500 mb-6">
        Telefon: {user.phone_number} · Rol: {roles[user.role]}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(profile);
        }}
        className="space-y-5"
      >
        <div className="grid sm:grid-cols-2 gap-5">
          {profileFields.map(([name, label, type = "text"]) => (
            <Field
              key={name}
              name={name}
              label={label}
              type={type}
              required={name === "company_name" && user.role !== "DRIVER"}
              maxLength={
                name === "email"
                  ? 254
                  : ["first_name", "last_name"].includes(name)
                    ? 100
                    : 255
              }
              value={profile[name]}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, [name]: e.target.value }))
              }
            />
          ))}
        </div>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saqlanmoqda…" : "Profilni saqlash"}
        </button>
      </form>
      <section className="border-t border-slate-100 mt-7 pt-6">
        <h3 className="font-bold mb-4">Parolni yangilash</h3>
        <ErrorNotice message={passwordError} />
        {passwordNotice && (
          <p role="status" className="text-sm text-emerald-700 mb-4">
            {passwordNotice}
          </p>
        )}
        <form onSubmit={submitPassword} className="space-y-4">
          {[
            ["current_password", "Joriy parol"],
            ["new_password", "Yangi parol"],
            ["confirm", "Yangi parol takrori"],
          ].map(([name, label]) => (
            <Field
              key={name}
              label={label}
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete={
                name === "current_password"
                  ? "current-password"
                  : "new-password"
              }
              value={passwords[name]}
              onChange={(e) =>
                setPasswords((prev) => ({ ...prev, [name]: e.target.value }))
              }
            />
          ))}
          <button className="btn-secondary" disabled={passwordBusy}>
            {passwordBusy ? "Yangilanmoqda?" : "Parolni yangilash"}
          </button>
        </form>
      </section>
      <div className="border-t border-slate-100 mt-7 pt-5 text-sm text-slate-500">
        <p>
          OneID tasdiqlash va pullik obuna xizmatlari hozir ulanmagan.
          Hisobingizga ruxsatlar server tomonidan belgilanadi.
        </p>
      </div>
    </section>
  );
}
