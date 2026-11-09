import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { sendAiChat } from "../api";
import { ErrorNotice } from "./UI";

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Assalomu alaykum! Katalog va shaxsiy buyurtmalaringiz bo'yicha yordam beraman.",
    },
  ]);
  const [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [mode, setMode] = useState("");
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);
  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setBusy(true);
    setError("");
    setMessages((prev) => [...prev.slice(-39), { sender: "user", text }]);
    try {
      let history = messages
        .slice(1)
        .slice(-6)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text.slice(0, 1000),
        }));
      const firstUser = history.findIndex((m) => m.role === "user");
      history = firstUser < 0 ? [] : history.slice(firstUser);
      const { data } = await sendAiChat(text, history);
      setMode(data.mode);
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: data.reply },
      ]);
    } catch (e) {
      setError(e.message);
      setInput(text);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel">
      <header className="flex items-center gap-3 mb-5">
        <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Bot size={21} />
        </span>
        <div>
          <h2 className="font-bold">BAIS yordamchi</h2>
          <p className="text-xs text-slate-500">
            {mode === "gemini"
              ? "Gemini AI"
              : mode === "database"
                ? "Baza ma'lumotlari rejimi"
                : "Katalog va buyurtmalar"}
          </p>
        </div>
      </header>
      <div
        role="log"
        aria-live="polite"
        aria-label="Yordamchi suhbatlari"
        className="max-h-96 overflow-y-auto space-y-4 mb-5"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${m.sender === "user" ? "bg-blue-600 text-white ml-8" : "bg-slate-50 text-slate-700 mr-3"}`}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <p role="status" className="text-sm text-slate-400">
            Javob tayyorlanmoqda…
          </p>
        )}
        <div ref={end} />
      </div>
      <ErrorNotice message={error} />
      <form className="flex gap-2" onSubmit={send}>
        <label className="flex-1">
          <span className="sr-only">Savolingiz</span>
          <input
            className="input"
            maxLength={2000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Savolingizni yozing…"
          />
        </label>
        <button
          className="btn-primary"
          disabled={busy || !input.trim()}
          aria-label="Xabar yuborish"
        >
          <Send size={18} />
        </button>
      </form>
      <p className="text-xs text-slate-400 mt-3">
        Javoblarni tekshiring. Yordamchi natijalarni kafolatlamaydi.
      </p>
    </section>
  );
}
