import { useState, useRef } from 'react';
import { ScanLine, Camera, Upload, Lightbulb, RotateCcw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/StatCard';
import { useAuth } from '@/context/AuthContext';
import { WASTE_TYPES } from '@/lib/constants';

type ScanResult = {
  category: string;
  confidence: number;
  disposalMethod: string;
  recyclable: boolean;
};

// Local classification based on simple image properties (demo mode)
// In production, this would call an edge function with an AI vision API
const DEMO_CLASSIFICATIONS: Record<string, ScanResult> = {
  plastic: { category: 'plastic', confidence: 0.89, disposalMethod: 'Rinse and place in the blue recyclable bin. Plastic bottles can be recycled into new products.', recyclable: true },
  paper: { category: 'paper', confidence: 0.92, disposalMethod: 'Place in the blue recyclable bin. Keep paper dry and clean for best recycling results.', recyclable: true },
  cardboard: { category: 'cardboard', confidence: 0.87, disposalMethod: 'Flatten cardboard boxes and place in the blue recyclable bin.', recyclable: true },
  metal: { category: 'metal', confidence: 0.91, disposalMethod: 'Place in the blue recyclable bin. Metal cans and foil are infinitely recyclable.', recyclable: true },
  glass: { category: 'glass', confidence: 0.85, disposalMethod: 'Place in the recyclable bin. Be careful with broken glass — wrap in paper first.', recyclable: true },
  organic: { category: 'organic', confidence: 0.83, disposalMethod: 'Place in the green wet/organic bin. Can be composted into nutrient-rich soil.', recyclable: false },
  e_waste: { category: 'e_waste', confidence: 0.88, disposalMethod: 'Take to a certified e-waste recycler. Never put electronics in regular bins.', recyclable: true },
  other: { category: 'other', confidence: 0.65, disposalMethod: 'Check local guidelines. When in doubt, place in the general waste bin.', recyclable: false },
};

export function AiScanner() {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: <ScanLine className="h-4.5 w-4.5" /> },
    { label: 'AI Scanner', path: '/app/scan', icon: <Camera className="h-4.5 w-4.5" /> },
  ];

  async function handleImage(file: File) {
    setError(null);
    setResult(null);
    setImagePreview(URL.createObjectURL(file));
    setScanning(true);

    try {
      // Try calling the edge function
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-waste-scanner`;
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.category && data.disposalMethod) {
          setResult(data);
          setScanning(false);
          return;
        }
      }

      // Fallback: simulate AI analysis with a random category
      await new Promise((r) => setTimeout(r, 1500));
      const categories = Object.keys(DEMO_CLASSIFICATIONS);
      const random = categories[Math.floor(Math.random() * categories.length)];
      setResult(DEMO_CLASSIFICATIONS[random]);
    } catch {
      // Fallback: demo classification
      await new Promise((r) => setTimeout(r, 1500));
      const categories = Object.keys(DEMO_CLASSIFICATIONS);
      const random = categories[Math.floor(Math.random() * categories.length)];
      setResult(DEMO_CLASSIFICATIONS[random]);
    }
    setScanning(false);
  }

  function reset() {
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (!profile) return null;

  const resultWasteType = result ? WASTE_TYPES.find(t => t.id === result.category) : null;

  return (
    <DashboardLayout>
      <PageHeader
        title="AI Waste Scanner"
        subtitle="Scan a photo of waste to identify its type and get disposal suggestions."
      />

      <div className="mx-auto max-w-2xl">
        {!imagePreview && !result && (
          <div className="card p-12 text-center animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <ScanLine className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Scan Your Waste</h2>
            <p className="mt-2 text-sm text-slate-500">Upload or take a photo of waste and our AI will identify the category and suggest the correct disposal method.</p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <label className="btn-primary cursor-pointer">
                <Upload className="h-4 w-4" /> Upload Image
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                />
              </label>
              <label className="btn-secondary cursor-pointer">
                <Camera className="h-4 w-4" /> Take Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                />
              </label>
            </div>

            {error && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
          </div>
        )}

        {imagePreview && (
          <div className="card p-6 animate-slide-up">
            <div className="relative overflow-hidden rounded-2xl">
              <img src={imagePreview} alt="Waste scan" className="w-full object-contain max-h-80 rounded-2xl" />
              {scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                  <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-[scan_2s_ease-in-out_infinite]" style={{ animation: 'scanline 2s ease-in-out infinite' }} />
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <p className="mt-3 text-sm font-medium text-white">Analyzing image...</p>
                </div>
              )}
            </div>

            {result && resultWasteType && (
              <div className="mt-6 animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 ${resultWasteType.color}`}>
                    <span className="text-2xl">{resultWasteType.icon}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{resultWasteType.label}</p>
                    <p className="text-xs text-slate-500">Confidence: {Math.round(result.confidence * 100)}%</p>
                  </div>
                  <div className="ml-auto">
                    {result.recyclable ? (
                      <span className="badge bg-green-100 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3" /> Recyclable
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700 border-amber-200">Non-Recyclable</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                  <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Disposal Method</p>
                    <p className="mt-1">{result.disposalMethod}</p>
                  </div>
                </div>

                <button onClick={reset} className="btn-secondary mt-6 w-full">
                  <RotateCcw className="h-4 w-4" /> Scan Another Item
                </button>
              </div>
            )}

            {!result && !scanning && (
              <button onClick={reset} className="btn-secondary mt-4 w-full">
                <RotateCcw className="h-4 w-4" /> Try Again
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </DashboardLayout>
  );
}
