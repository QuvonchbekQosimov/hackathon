import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  PackageOpen,
  LoaderCircle,
  X,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../auth-context";

export function Logo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-3 font-black text-2xl tracking-tight text-slate-900"
      aria-label="BAIS bosh sahifa"
    >
      <span className="bg-blue-600 text-white p-2.5 rounded-xl">
        <Activity size={21} />
      </span>
      BAIS<span className="text-blue-600 -ml-3">.</span>
    </Link>
  );
}
export function PublicShell({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#main" className="skip-link">
        Asosiy mazmunga o'tish
      </a>
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <nav
            aria-label="Asosiy navigatsiya"
            className="flex gap-3 sm:gap-6 text-sm font-bold items-center"
          >
            <NavLink
              to="/marketplace"
              className={({ isActive }) =>
                isActive ? "text-blue-600" : "text-slate-500"
              }
            >
              Bozor
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                isActive ? "text-blue-600" : "text-slate-500"
              }
            >
              Tahlil
            </NavLink>
            <Link className="btn-primary" to={user ? "/dashboard" : "/login"}>
              {user ? "Kabinet" : "Kirish"}
              <ArrowUpRight size={15} />
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} BAIS · Savdo va logistika platformasi
      </footer>
    </div>
  );
}
export function Loading({ label = "Ma'lumotlar yuklanmoqda…" }) {
  return (
    <div
      role="status"
      className="py-16 flex items-center justify-center gap-3 text-slate-500"
    >
      <LoaderCircle size={22} className="animate-spin" />
      {label}
    </div>
  );
}
export function Empty({
  title = "Ma'lumot topilmadi",
  description = "",
  children,
}) {
  return (
    <div className="panel py-14 text-center">
      <PackageOpen size={40} className="text-slate-300 mx-auto mb-4" />
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-slate-500 mt-2 mb-5">{description}</p>
      {children}
    </div>
  );
}
export function ErrorNotice({ message, retry }) {
  return (
    message && (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6"
      >
        <p>{message}</p>
        {retry && (
          <button
            type="button"
            className="underline font-bold mt-2"
            onClick={retry}
          >
            Qayta urinish
          </button>
        )}
      </div>
    )
  );
}
export function Field({ label, name, ...props }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="block mb-2">{label}</span>
      <input name={name} className="input" {...props} />
    </label>
  );
}
const labels = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Tasdiqlangan",
  CANCELLED: "Bekor qilingan",
  SEARCHING_DRIVER: "Haydovchi qidirilmoqda",
  ASSIGNED: "Haydovchi tanlangan",
  IN_TRANSIT: "Yo'lda",
  DELIVERED: "Yetkazilgan",
  REJECTED: "Tanlanmagan",
};
export function Status({ value }) {
  return (
    <span
      className={`status ${["ACCEPTED", "DELIVERED"].includes(value) ? "status-green" : ["CANCELLED", "REJECTED"].includes(value) ? "status-muted" : "status-blue"}`}
    >
      {labels[value] || value}
    </span>
  );
}
export function BackLink() {
  return (
    <Link
      to="/marketplace"
      className="inline-flex items-center gap-2 text-slate-500 font-semibold text-sm mb-8"
    >
      <ArrowLeft size={16} />
      Bozorga qaytish
    </Link>
  );
}
export function Modal({ title, children, onClose, busy = false }) {
  const container = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container.current?.focus();
    const handleKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
      if (e.key === "Tab") {
        const nodes = [
          ...container.current.querySelectorAll(
            "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
          ),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (!nodes.length) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === container.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === container.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [onClose, busy]);
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 flex items-start justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={container}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-white rounded-2xl w-full max-w-xl mt-8 shadow-xl p-6 sm:p-8 outline-none"
      >
        <header className="flex items-center justify-between mb-6">
          <h2 id="modal-title" className="text-xl font-bold">
            {title}
          </h2>
          <button
            className="p-2 rounded-lg hover:bg-slate-100"
            onClick={onClose}
            disabled={busy}
            aria-label="Yopish"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
