import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Factory,
  Truck,
  ShoppingBag,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../auth-context";
import { loginUser, registerUser } from "../api";
import { Logo, Field, ErrorNotice, Loading } from "../components/UI";

export default function AuthPage({ register = false }) {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate(),
    location = useLocation();
  const [form, setForm] = useState({
    phone_number: "",
    password: "",
    role: "BUYER",
    company_name: "",
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const destination =
    location.state?.from?.startsWith("/") &&
    !location.state.from.startsWith("//") &&
    !location.state.from.includes("\\") &&
    /^\/(dashboard|marketplace|product\/[^/?#]+)(\?|$)/.test(
      location.state.from,
    )
      ? location.state.from
      : "/dashboard";
  if (loading) return <Loading />;
  if (user) return <Navigate to={destination} replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = (
        await (register
          ? registerUser(form)
          : loginUser({
              phone_number: form.phone_number,
              password: form.password,
            }))
      ).data;
      setUser(data);
      navigate(destination, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="p-6 sm:p-12 lg:p-16 flex flex-col bg-white">
        <Link
          to="/"
          className="flex gap-2 items-center text-slate-500 text-sm mb-12"
        >
          <ArrowLeft size={16} />
          Bosh sahifa
        </Link>
        <div className="max-w-md w-full mx-auto my-auto">
          <Logo />
          <h1 className="text-3xl sm:text-4xl font-black mt-10 mb-3">
            {register ? "Hisobingizni yarating" : "Xush kelibsiz"}
          </h1>
          <p className="text-slate-500 mb-8">
            {register
              ? "Biznesingiz uchun yagona savdo va logistika kabineti."
              : "Buyurtmalaringiz va savdolaringizni boshqaring."}
          </p>
          <ErrorNotice message={error} />
          <form onSubmit={submit} className="space-y-5">
            {register && (
              <>
                <label className="block text-sm font-semibold">
                  Hisob turi
                  <select
                    name="role"
                    className="input mt-2"
                    value={form.role}
                    onChange={change}
                  >
                    <option value="BUYER">Xaridor / Kompaniya</option>
                    <option value="FACTORY">Zavod / Ishlab chiqaruvchi</option>
                    <option value="DRIVER">Haydovchi / Logistika</option>
                  </select>
                </label>
                {form.role !== "DRIVER" && (
                  <Field
                    label="Kompaniya nomi"
                    name="company_name"
                    required
                    maxLength={255}
                    value={form.company_name}
                    onChange={change}
                    placeholder="Kompaniyangiz nomi"
                  />
                )}
              </>
            )}
            <Field
              label="Telefon raqam"
              type="tel"
              name="phone_number"
              required
              autoComplete="tel"
              maxLength={30}
              placeholder="+998 90 123 45 67"
              value={form.phone_number}
              onChange={change}
            />
            <Field
              label="Parol"
              type="password"
              name="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder="Kamida 8 belgi"
              value={form.password}
              onChange={change}
            />
            <button
              className="btn-primary w-full"
              type="submit"
              disabled={busy}
            >
              {busy ? "Kutilmoqda…" : register ? "Ro'yxatdan o'tish" : "Kirish"}
            </button>
          </form>
          <p className="text-sm text-slate-500 text-center mt-7">
            {register ? "Hisobingiz bormi?" : "Yangi foydalanuvchimisiz?"}{" "}
            <Link
              className="text-blue-600 font-bold"
              to={register ? "/login" : "/register"}
              state={location.state}
            >
              {register ? "Kirish" : "Ro'yxatdan o'tish"}
            </Link>
          </p>
        </div>
      </section>
      <aside className="hidden lg:flex flex-col justify-center bg-slate-950 text-white p-16 relative overflow-hidden">
        <div className="absolute w-80 h-80 bg-blue-600/20 blur-3xl rounded-full right-0 top-0" />
        <p className="text-blue-400 uppercase tracking-[.25em] text-xs font-bold mb-6">
          BAIS biznes platformasi
        </p>
        <h2 className="text-4xl font-black leading-tight mb-6">
          Savdo, ombor va logistika.
          <br />
          <span className="text-blue-400">Bitta tizimda.</span>
        </h2>
        <p className="text-slate-400 leading-relaxed mb-10">
          Mahsulot topishdan yetkazib berishni tasdiqlashgacha — barcha
          bosqichlarni kuzatib boring.
        </p>
        <div className="space-y-5">
          {[
            [Factory, "Ishlab chiqaruvchidan xarid"],
            [ShoppingBag, "Buyurtma va ombor nazorati"],
            [Truck, "Haydovchilar takliflarini solishtirish"],
            [ShieldCheck, "Hisobingiz uchun alohida ruxsatlar"],
          ].map(([Icon, text]) => (
            <div key={text} className="flex gap-4 items-center text-slate-300">
              <Icon size={20} className="text-blue-400" />
              {text}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
