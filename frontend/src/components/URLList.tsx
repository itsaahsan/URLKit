import { useState } from "react";
import { URLItem, deleteUrl } from "../api";

interface Props {
  urls: URLItem[];
  onRefresh: () => void;
  onAnalytics: (code: string) => void;
  onQR: (code: string) => void;
}

export default function URLList({ urls, onRefresh, onAnalytics, onQR }: Props) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (url: string, code: string) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (code: string) => {
    if (!confirm("Delete this URL?")) return;
    await deleteUrl(code);
    onRefresh();
  };

  if (urls.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">No shortened URLs yet</p>
        <p className="text-sm mt-1">Paste a URL above to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {urls.map((u) => (
        <div
          key={u.short_code}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <a
                href={u.short_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-medium hover:underline truncate"
              >
                {u.short_url.replace(/^https?:\/\//, "")}
              </a>
              <button
                onClick={() => handleCopy(u.short_url, u.short_code)}
                className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
              >
                {copiedCode === u.short_code ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-gray-500 truncate mt-0.5">{u.original_url}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {u.clicks} clicks
            </span>
            <button
              onClick={() => onAnalytics(u.short_code)}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Analytics
            </button>
            <button
              onClick={() => onQR(u.short_code)}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              QR
            </button>
            <button
              onClick={() => handleDelete(u.short_code)}
              className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
