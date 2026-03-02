import { useEffect, useState } from "react";
import { getQRCode } from "../api";

interface Props {
  code: string;
  onClose: () => void;
}

const STYLES = [
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "gapped", label: "Gapped" },
];

export default function QRCodeModal({ code, onClose }: Props) {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [fillColor, setFillColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [style, setStyle] = useState("rounded");
  const [loading, setLoading] = useState(false);

  const fetchQR = () => {
    setLoading(true);
    getQRCode(code, fillColor, bgColor, style)
      .then((r) => setQrBase64(r.data.qr_code))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQR(); }, [code]);

  const handleDownload = () => {
    if (!qrBase64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${qrBase64}`;
    link.download = `urlkit-${code}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex justify-center mb-4">
          {loading ? (
            <div className="w-64 h-64 flex items-center justify-center text-gray-400">Generating...</div>
          ) : qrBase64 ? (
            <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code" className="w-64 h-64" />
          ) : null}
        </div>

        {/* Customization */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-4">
            <label className="flex-1">
              <span className="text-sm text-gray-600">Fill Color</span>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-full h-9 rounded border border-gray-300 cursor-pointer"
              />
            </label>
            <label className="flex-1">
              <span className="text-sm text-gray-600">Background</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full h-9 rounded border border-gray-300 cursor-pointer"
              />
            </label>
          </div>
          <div>
            <span className="text-sm text-gray-600">Style</span>
            <div className="flex gap-2 mt-1">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    style === s.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchQR}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 disabled:opacity-50 transition-colors"
          >
            Regenerate
          </button>
          <button
            onClick={handleDownload}
            disabled={!qrBase64}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
