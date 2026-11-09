import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Package, MapPin, Phone, Building2 } from "lucide-react";
import { getProductDetail, createOrder } from "../api";
import { useAuth } from "../auth-context";
import {
  PublicShell,
  Loading,
  Empty,
  ErrorNotice,
  BackLink,
  Field,
} from "../components/UI";
import ChatPanel from "../components/ChatPanel";
import { money } from "../utils";

export default function ProductDetail() {
  const { id } = useParams(),
    { user } = useAuth();
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  const [quantity, setQuantity] = useState(1),
    [busy, setBusy] = useState(false),
    [orderError, setOrderError] = useState(""),
    [success, setSuccess] = useState(false),
    [key, setKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSuccess(false);
    getProductDetail(id)
      .then((r) => {
        if (active) setData(r.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, retry]);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setOrderError("");
    try {
      await createOrder({ product_id: id, quantity: Number(quantity) }, key);
      setSuccess(true);
      setKey(crypto.randomUUID());
      setData((await getProductDetail(id)).data);
    } catch (e) {
      setOrderError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const product = data?.product;
  return (
    <PublicShell>
      <BackLink />
      <ErrorNotice message={error} retry={() => setRetry((x) => x + 1)} />
      {loading ? (
        <Loading />
      ) : !error && product ? (
        <>
          <div className="grid lg:grid-cols-[1fr_350px] gap-7">
            <section className="panel">
              <div className="h-44 rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center mb-7">
                <Package
                  size={68}
                  strokeWidth={1.3}
                  className="text-blue-400"
                />
              </div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-3">
                {product.category}
              </p>
              <h1 className="text-3xl font-black mb-5">{product.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-7">
                <span className="flex gap-2 items-center">
                  <Building2 size={16} />
                  {product.factory_name}
                </span>
                {product.location && (
                  <span className="flex gap-2 items-center">
                    <MapPin size={16} />
                    {product.location}
                  </span>
                )}
                {product.contact_phone && (
                  <span className="flex gap-2 items-center">
                    <Phone size={16} />
                    {product.contact_phone}
                  </span>
                )}
              </div>
              <h2 className="font-bold mb-3">Mahsulot haqida</h2>
              <p className="text-slate-500 leading-relaxed whitespace-pre-wrap">
                {product.description || "Tavsif hali kiritilmagan."}
              </p>
              {product.min_order && (
                <p className="text-sm text-slate-500 mt-4">
                  Zavodning minimal buyurtma sharti: {product.min_order}
                </p>
              )}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h2 className="font-bold mb-3">Hududiy talab</h2>
                {data.data_mode === "demo" && (
                  <p className="text-xs text-amber-700 mb-3">
                    Quyidagi statistika namuna ma'lumotlariga asoslangan.
                  </p>
                )}
                {data.top_regions.length ? (
                  data.top_regions.map((r) => (
                    <div
                      className="flex justify-between text-sm py-2 border-b border-slate-50"
                      key={r.region}
                    >
                      <span className="text-slate-500">{r.region}</span>
                      <strong>{money(r.total_sold)}</strong>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Mahsulot uchun tarixiy statistika mavjud emas.
                  </p>
                )}
              </div>
            </section>
            <div className="space-y-6">
              <section className="panel">
                <p className="text-sm text-slate-500 mb-2">Birlik narxi</p>
                <p className="text-3xl font-black">
                  {money(product.price)}{" "}
                  <span className="text-sm text-slate-400">UZS</span>
                </p>
                <p className="text-sm text-slate-500 mt-3 mb-6">
                  Omborda: {product.stock_quantity} ta
                </p>
                {success ? (
                  <div
                    role="status"
                    className="bg-emerald-50 text-emerald-700 rounded-xl p-4 text-sm"
                  >
                    Buyurtma yaratildi. Zavod tasdig'ini kuting.
                    <Link
                      className="block font-bold underline mt-2"
                      to="/dashboard?tab=orders"
                    >
                      Buyurtmalarim
                    </Link>
                  </div>
                ) : user?.role === "BUYER" ? (
                  <form onSubmit={submit} className="space-y-4">
                    <Field
                      label="Miqdor"
                      type="number"
                      min={1}
                      max={product.stock_quantity}
                      step={1}
                      required
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setKey(crypto.randomUUID());
                      }}
                    />
                    <p className="text-sm text-slate-500">
                      Jami:{" "}
                      <strong className="text-slate-900">
                        {money(Number(quantity) * Number(product.price))} UZS
                      </strong>
                    </p>
                    <ErrorNotice message={orderError} />
                    <button
                      type="submit"
                      className="btn-primary w-full"
                      disabled={busy || !product.stock_quantity}
                    >
                      {busy ? "Yuborilmoqda…" : "Buyurtma berish"}
                    </button>
                  </form>
                ) : !user ? (
                  <Link
                    className="btn-primary w-full"
                    to="/login"
                    state={{ from: `/product/${id}` }}
                  >
                    Buyurtma uchun kirish
                  </Link>
                ) : (
                  <p className="text-sm text-slate-500">
                    Buyurtmalar xaridor hisobidan yaratiladi.
                  </p>
                )}
              </section>
              <ChatPanel />
            </div>
          </div>
        </>
      ) : (
        !error && <Empty title="Mahsulot topilmadi" />
      )}
    </PublicShell>
  );
}
