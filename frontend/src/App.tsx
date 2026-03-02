import { useState, useEffect, useCallback } from "react";
import { listUrls, URLItem } from "./api";
import ShortenForm from "./components/ShortenForm";
import URLList from "./components/URLList";
import Analytics from "./components/Analytics";
import QRCodeModal from "./components/QRCodeModal";

export default function App() {
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "analytics">("list");

  const refresh = useCallback(() => {
    listUrls().then((r) => setUrls(r.data));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
            onClick={() => { setView("list"); setSelectedCode(null); }}
          >
            URLKit
          </h1>
          {view === "analytics" && (
            <button
              onClick={() => { setView("list"); setSelectedCode(null); }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              &larr; Back to URLs
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {view === "list" ? (
          <>
            <ShortenForm onSuccess={refresh} />
            <URLList
              urls={urls}
              onRefresh={refresh}
              onAnalytics={(code) => { setSelectedCode(code); setView("analytics"); }}
              onQR={(code) => setQrCode(code)}
            />
          </>
        ) : selectedCode ? (
          <Analytics code={selectedCode} />
        ) : null}
      </main>

      {qrCode && (
        <QRCodeModal code={qrCode} onClose={() => setQrCode(null)} />
      )}
    </div>
  );
}
