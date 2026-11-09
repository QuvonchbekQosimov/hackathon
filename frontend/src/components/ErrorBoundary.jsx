import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("BAIS interface error:", error);
  }
  render() {
    return this.state.failed ? (
      <main className="max-w-xl mx-auto p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Sahifani ochishda xatolik yuz berdi
        </h1>
        <p className="text-slate-500 mb-6">Sahifani qayta yuklab ko'ring.</p>
        <button
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          Qayta yuklash
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
