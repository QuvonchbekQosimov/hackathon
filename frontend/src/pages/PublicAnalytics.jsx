import { useEffect, useState } from "react";
import {
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { getAnalysis } from "../api";
import { PublicShell, Loading, ErrorNotice } from "../components/UI";
import ChatPanel from "../components/ChatPanel";
import { money } from "../utils";

export default function PublicAnalytics() {
  const [region, setRegion] = useState("Toshkent"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getAnalysis(region, controller.signal)
      .then((r) => setData(r.data))
      .catch((e) => {
        if (e.code !== "ERR_CANCELED") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [region, retry]);
  return (
    <PublicShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-blue-600 uppercase tracking-widest font-bold text-xs mb-3">
            Hududiy ko'rsatkichlar
          </p>
          <h1 className="text-3xl sm:text-4xl font-black">Bozor tahlili</h1>
          <p className="mt-3 text-slate-500">
            Hududlar kesimida narx va talab ko'rsatkichlari.
          </p>
        </div>
        <select
          aria-label="Hudud"
          className="input sm:w-52"
          value={region}
          onChange={(e) => {
            setLoading(true);
            setError("");
            setRegion(e.target.value);
          }}
        >
          {(data?.regions || ["Toshkent"]).map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <ErrorNotice
        message={error}
        retry={() => {
          setLoading(true);
          setError("");
          setRetry((v) => v + 1);
        }}
      />
      {loading ? (
        <Loading />
      ) : (
        !error &&
        data && (
          <>
            <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 p-4 text-sm mb-7">
              {data.data_mode === "demo"
                ? "Namuna statistikasi. Ushbu ko'rsatkichlar haqiqiy bozor o'lchovlari emas."
                : "Bazaga kiritilgan tarixiy statistika."}{" "}
              {data.forecast_method}
            </div>
            <div className="grid lg:grid-cols-[1fr_350px] gap-6">
              <div>
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  {[
                    ["Zavod: o‘rtacha narx", data.economics.factoryPrice],
                    ["Bozor: o‘rtacha narx", data.economics.marketPrice],
                    ["Yalpi narx farqi", data.economics.grossDifference],
                  ].map(([title, value]) => (
                    <div className="panel" key={title}>
                      <p className="text-xs font-semibold text-slate-500 mb-3">
                        {title}
                      </p>
                      <p className="text-xl font-black">
                        {money(value)}{" "}
                        <span className="text-xs font-medium text-slate-400">
                          UZS
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="panel">
                  <h2 className="font-bold text-lg mb-2">{data.sector}</h2>
                  <p className="text-sm text-slate-500 mb-6">
                    {data.year} yil hajmi va +5% taqqoslash ssenariysi
                  </p>
                  <div
                    className="h-80 min-w-0"
                    role="img"
                    aria-label={`${data.year} yilning oylik savdo hajmi grafigi`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={data.chartData}
                        margin={{ left: 0, right: 10, top: 10 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e2e8f0"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          width={55}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) => money(value)}
                          contentStyle={{ borderRadius: 12 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="actual"
                          name="Tarixiy hajm"
                          stroke="#2563eb"
                          fill="#dbeafe"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="estimate"
                          name="+5% ssenariy"
                          stroke="#10b981"
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <details className="text-sm mt-4">
                    <summary className="cursor-pointer text-slate-500">
                      Oylik jadval
                    </summary>
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-left">
                        <thead>
                          <tr>
                            <th className="py-2">Oy</th>
                            <th>Tarixiy hajm</th>
                            <th>+5% ssenariy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.chartData.map((r) => (
                            <tr
                              key={r.name}
                              className="border-t border-slate-100"
                            >
                              <td className="py-2">{r.name}</td>
                              <td>{money(r.actual)}</td>
                              <td>{money(r.estimate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                  <p className="text-xs text-slate-400 mt-4">
                    Narx farqi sof foyda emas: transport, soliqlar va boshqa
                    xarajatlar hisoblanmagan.
                  </p>
                </div>
              </div>
              <ChatPanel />
            </div>
          </>
        )
      )}
    </PublicShell>
  );
}
