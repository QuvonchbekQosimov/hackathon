import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Package, Search, MapPin } from "lucide-react";
import { getCatalog } from "../api";
import { PublicShell, Loading, Empty, ErrorNotice } from "../components/UI";
import { money } from "../utils";

export default function B2BMarket() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "",
    category = params.get("category") || "",
    sort = params.get("sort") || "newest",
    page = Math.max(1, Number(params.get("page")) || 1);
  const [draft, setDraft] = useState(search),
    [result, setResult] = useState({ items: [], categories: [], total: 0 });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    setDraft(search);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getCatalog(
      { search, category, sort, page, page_size: 12 },
      controller.signal,
    )
      .then((r) => setResult(r.data))
      .catch((e) => {
        if (e.code !== "ERR_CANCELED") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [search, category, sort, page, retry]);
  const update = (change) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries({ page: 1, ...change }))
      v ? next.set(k, String(v)) : next.delete(k);
    setParams(next);
  };
  const pages = Math.max(1, Math.ceil(result.total / 12));
  return (
    <PublicShell>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">
            BAIS katalogi
          </p>
          <h1 className="text-3xl sm:text-4xl font-black">B2B ulgurji bozor</h1>
          <p className="text-slate-500 mt-3">
            Ishlab chiqaruvchilar mahsulotlarini toping va solishtiring.
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {result.total} ta mahsulot
        </span>
      </div>
      <div className="panel flex flex-col sm:flex-row gap-3 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ search: draft.trim() });
          }}
          className="flex gap-2 flex-1"
        >
          <label className="relative flex-1">
            <span className="sr-only">Mahsulot yoki zavod qidirish</span>
            <Search
              size={18}
              className="absolute left-3.5 top-3.5 text-slate-400"
            />
            <input
              className="input pl-10"
              maxLength={100}
              placeholder="Mahsulot yoki zavod nomi…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button className="btn-primary">Qidirish</button>
        </form>
        <select
          aria-label="Kategoriya"
          className="input sm:w-48"
          value={category}
          onChange={(e) => update({ category: e.target.value })}
        >
          <option value="">Barcha kategoriyalar</option>
          {result.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Saralash"
          className="input sm:w-44"
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
        >
          <option value="newest">Eng yangi</option>
          <option value="price_asc">Narx: arzon avval</option>
          <option value="price_desc">Narx: qimmat avval</option>
          <option value="name">Nom bo'yicha</option>
        </select>
      </div>
      <ErrorNotice message={error} retry={() => setRetry((x) => x + 1)} />
      {loading ? (
        <Loading />
      ) : (
        !error &&
        (result.items.length ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {result.items.map((p) => (
                <article
                  className="panel flex flex-col hover:border-blue-300 transition-colors"
                  key={p.id}
                >
                  <div className="flex justify-between items-center mb-5">
                    <span className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl">
                      <Package size={24} />
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-50 rounded-full px-3 py-1">
                      {p.category}
                    </span>
                  </div>
                  <h2 className="font-bold text-lg mb-2">{p.name}</h2>
                  <p className="text-sm text-slate-500">{p.factory_name}</p>
                  {p.location && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                      <MapPin size={12} />
                      {p.location}
                    </p>
                  )}
                  <div className="mt-auto pt-7">
                    <p className="text-2xl font-black">
                      {money(p.price)}{" "}
                      <span className="text-xs text-slate-400 font-medium">
                        UZS
                      </span>
                    </p>
                    <p
                      className={`text-xs mt-2 ${p.stock_quantity > 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      Qoldiq: {p.stock_quantity} ta
                    </p>
                    <Link
                      to={`/product/${p.id}`}
                      className="btn-secondary w-full mt-5"
                    >
                      Batafsil ko'rish
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <nav
              aria-label="Katalog sahifalari"
              className="flex justify-center items-center gap-4 mt-8"
            >
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => update({ page: page - 1 })}
              >
                Oldingi
              </button>
              <span className="text-sm text-slate-500">
                {page} / {pages}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= pages}
                onClick={() => update({ page: page + 1 })}
              >
                Keyingi
              </button>
            </nav>
          </>
        ) : (
          <Empty
            title="Mahsulot topilmadi"
            description="Qidiruv so'zini yoki kategoriya filtrini o'zgartiring."
          >
            <button
              className="btn-secondary"
              onClick={() => {
                setDraft("");
                setParams({});
              }}
            >
              Filtrlarni tozalash
            </button>
          </Empty>
        ))
      )}
    </PublicShell>
  );
}
