import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Recycle, Utensils, Camera, MapPin, Trophy, BookOpen, Clock, CheckCircle2, AlertCircle, Plus, Award, Loader2, Navigation } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { StatCard, PageHeader, Section } from '@/components/ui/StatCard';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { supabase, type WasteReport, type RecyclableListing, type SurplusFood, type Certificate } from '@/lib/supabase';
import { WASTE_TYPES, REPORT_TYPES, STATUS_COLORS, formatTimeAgo } from '@/lib/constants';

export function CitizenDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'recyclable' | 'food'>('overview');

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [recyclables, setRecyclables] = useState<RecyclableListing[]>([]);
  const [foodListings, setFoodListings] = useState<SurplusFood[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRecyclableModal, setShowRecyclableModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile) return;
    const [reportsRes, recycRes, foodRes, certRes] = await Promise.all([
      supabase.from('waste_reports').select('*').eq('reporter_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('recyclable_listings').select('*').eq('citizen_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('surplus_food').select('*').eq('citizen_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').eq('user_id', profile.id).order('issued_at', { ascending: false }),
    ]);
    setReports((reportsRes.data as WasteReport[]) ?? []);
    setRecyclables((recycRes.data as RecyclableListing[]) ?? []);
    setFoodListings((foodRes.data as SurplusFood[]) ?? []);
    setCertificates((certRes.data as Certificate[]) ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  // Listen to sidebar action events (e.g. Red Report Waste button)
  useEffect(() => {
    function handleOpenReport() {
      setShowReportModal(true);
    }
    function handleOpenFood() {
      setShowFoodModal(true);
    }
    window.addEventListener('open-report-modal', handleOpenReport);
    window.addEventListener('open-food-modal', handleOpenFood);
    return () => {
      window.removeEventListener('open-report-modal', handleOpenReport);
      window.removeEventListener('open-food-modal', handleOpenFood);
    };
  }, []);

  if (!profile) return <Spinner label="Loading..." />;

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const availableRecyc = recyclables.filter(r => r.status === 'available').length;
  const availableFood = foodListings.filter(f => f.status === 'available').length;

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: <Trash2 className="h-5 w-5 text-indigo-500" /> },
    { label: 'Learn', path: '/app/learning', icon: <BookOpen className="h-5 w-5 text-emerald-500" /> },
    {
      label: 'Report Waste',
      path: '#report',
      icon: <AlertCircle className="h-5 w-5 text-white" />,
      isAction: true,
      actionType: 'open-report-modal',
      variant: 'danger' as const,
    },
    {
      label: 'Donate Food',
      path: '#food',
      icon: <Utensils className="h-5 w-5 text-orange-500" />,
      isAction: true,
      actionType: 'open-food-modal',
    },
  ];

  return (
    <DashboardLayout>
      {/* ------------------------------------------------------------------ */}
      {/* HERO BANNER SECTION (MATCHES SCREENSHOT LAYOUT)                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left Hero Greeting (2 columns on lg) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-7 sm:p-9 text-white shadow-lg shadow-emerald-900/20 flex flex-col justify-between">
          {/* Subtle decorative glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-md mb-3">
              <span>🌱 Swachh Bharat Citizen Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, {profile.full_name || 'Citizen'}!
            </h1>
            <p className="mt-2 text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              Report roadside waste, list recyclables, learn waste segregation, or donate clean surplus food to community shelters.
            </p>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition-all hover:bg-emerald-50 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-emerald-600" />
              <span>Report Waste</span>
            </button>
            <button
              onClick={() => setShowFoodModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/20 border border-white/20 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 cursor-pointer"
            >
              <Utensils className="h-4 w-4" />
              <span>Donate Food</span>
            </button>
          </div>
        </div>

        {/* Right Hero Widget (Matches the Vibrant Purple/Blue Card in screenshot) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-xl shadow-indigo-600/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-100 backdrop-blur-md">
                Active Learning
              </span>
              <span className="text-xs font-bold text-indigo-200">
                {certificates.length > 0 ? `${certificates.length} Badge` : 'In Progress'}
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">Eco Learning Hub</h3>
                <p className="text-xs text-indigo-200 mt-0.5">Interactive Waste Lessons</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5 text-indigo-100">
                <span>Modules Progress</span>
                <span>{certificates.length > 0 ? '100%' : '65%'}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                  style={{ width: certificates.length > 0 ? '100%' : '65%' }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/app/learning')}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 border border-white/25 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-95 cursor-pointer"
          >
            <span>Continue Learning</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={AlertCircle} label="Pending Reports" value={pendingReports} color="amber" />
        <StatCard icon={CheckCircle2} label="Resolved Reports" value={resolvedReports} color="green" />
        <StatCard icon={Recycle} label="Recyclables Listed" value={recyclables.length} color="teal" />
        <StatCard icon={Trophy} label="Reward Points" value={profile.points} color="amber" />
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button onClick={() => setShowReportModal(true)} className="card-hover flex items-center gap-3 p-4 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Report Waste</p>
            <p className="text-xs text-slate-500">Report dumping or full bins</p>
          </div>
        </button>
        <button onClick={() => navigate('/app/learning')} className="card-hover flex items-center gap-3 p-4 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Learning Hub</p>
            <p className="text-xs text-slate-500">Lessons, quizzes & certificates</p>
          </div>
        </button>
        <button onClick={() => setShowFoodModal(true)} className="card-hover flex items-center gap-3 p-4 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Donate Surplus Food</p>
            <p className="text-xs text-slate-500">Help those in need</p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'reports', label: 'My Reports' },
          { id: 'recyclable', label: 'Recyclables' },
          { id: 'food', label: 'Surplus Food' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading your data..." />
      ) : (
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Section title="Recent Reports" action={<button onClick={() => setActiveTab('reports')} className="text-sm text-emerald-600 hover:text-emerald-700">View all</button>}>
                {reports.length === 0 ? (
                  <EmptyState icon={<Trash2 className="h-10 w-10" />} title="No reports yet" message="Report waste in your area to get started." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {reports.slice(0, 4).map((report) => <ReportCard key={report.id} report={report} />)}
                  </div>
                )}
              </Section>

              <Section title="Recent Recyclables" action={<button onClick={() => setActiveTab('recyclable')} className="text-sm text-emerald-600 hover:text-emerald-700">View all</button>}>
                {recyclables.length === 0 ? (
                  <EmptyState icon={<Recycle className="h-10 w-10" />} title="No recyclables listed" message="List your recyclable waste for NGO pickup." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {recyclables.slice(0, 4).map((item) => <RecyclableCard key={item.id} item={item} />)}
                  </div>
                )}
              </Section>

              {certificates.length > 0 && (
                <Section title="Your Certificates">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="card-hover flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Certificate of Completion</p>
                          <p className="text-xs text-slate-500">{new Date(cert.issued_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button onClick={() => setShowReportModal(true)} className="btn-secondary">
                  <Plus className="h-4 w-4" /> New Report
                </button>
              </div>
              {reports.length === 0 ? (
                <EmptyState icon={<Trash2 className="h-10 w-10" />} title="No waste reports yet" message="Report road waste or overflowing bins in your area." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {reports.map((report) => <ReportCard key={report.id} report={report} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recyclable' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button onClick={() => setShowRecyclableModal(true)} className="btn-secondary">
                  <Plus className="h-4 w-4" /> List Recyclable
                </button>
              </div>
              {recyclables.length === 0 ? (
                <EmptyState icon={<Recycle className="h-10 w-10" />} title="No recyclables listed" message="List your recyclable waste for NGO/recycler pickup." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recyclables.map((item) => <RecyclableCard key={item.id} item={item} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'food' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button onClick={() => setShowFoodModal(true)} className="btn-secondary">
                  <Plus className="h-4 w-4" /> Donate Food
                </button>
              </div>
              {foodListings.length === 0 ? (
                <EmptyState icon={<Utensils className="h-10 w-10" />} title="No food donations yet" message="Donate fresh surplus food to help those in need." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {foodListings.map((food) => <FoodCard key={food.id} food={food} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ReportWasteModal open={showReportModal} onClose={() => setShowReportModal(false)} userId={profile.id} onCreated={loadData} />
      <RecyclableModal open={showRecyclableModal} onClose={() => setShowRecyclableModal(false)} userId={profile.id} onCreated={loadData} />
      <SurplusFoodModal open={showFoodModal} onClose={() => setShowFoodModal(false)} userId={profile.id} onCreated={loadData} />
    </DashboardLayout>
  );
}

// ============ Report Card ============
function ReportCard({ report }: { report: WasteReport }) {
  const reportType = REPORT_TYPES.find(t => t.id === report.type);
  return (
    <div className="card-hover p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{reportType?.icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{reportType?.label ?? 'Report'}</p>
            <p className="text-xs text-slate-400">{formatTimeAgo(report.created_at)}</p>
          </div>
        </div>
        <span className={`badge ${STATUS_COLORS[report.status]}`}>
          {report.status.replace('_', ' ')}
        </span>
      </div>
      {report.description && <p className="mt-2 text-sm text-slate-600">{report.description}</p>}
      {report.address && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="h-3 w-3" /> {report.address}
        </div>
      )}
    </div>
  );
}

// ============ Recyclable Card ============
function RecyclableCard({ item }: { item: RecyclableListing }) {
  const wasteType = WASTE_TYPES.find(t => t.id === item.waste_type);
  return (
    <div className="card-hover p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{wasteType?.icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{wasteType?.label ?? item.waste_type}</p>
            <p className="text-xs text-slate-400">{formatTimeAgo(item.created_at)}</p>
          </div>
        </div>
        <span className={`badge ${STATUS_COLORS[item.status]}`}>
          {item.status}
        </span>
      </div>
      {item.quantity_kg > 0 && <p className="mt-2 text-sm text-slate-600">{item.quantity_kg} kg</p>}
      {item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}
      {item.address && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="h-3 w-3" /> {item.address}
        </div>
      )}
    </div>
  );
}

// ============ Food Card ============
function FoodCard({ food }: { food: SurplusFood }) {
  return (
    <div className="card-hover p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">{food.food_type}</p>
            <p className="text-xs text-slate-400">{formatTimeAgo(food.created_at)}</p>
          </div>
        </div>
        <span className={`badge ${STATUS_COLORS[food.status]}`}>
          {food.status}
        </span>
      </div>
      {food.quantity && <p className="mt-2 text-sm text-slate-600">Quantity: {food.quantity}</p>}
      {food.description && <p className="mt-1 text-sm text-slate-500">{food.description}</p>}
      {food.preparation_time && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" /> Prepared: {new Date(food.preparation_time).toLocaleString()}
        </div>
      )}
      {food.address && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="h-3 w-3" /> {food.address}
        </div>
      )}
    </div>
  );
}

// ============ Report Waste Modal ============
function ReportWasteModal({ open, onClose, userId, onCreated }: { open: boolean; onClose: () => void; userId: string; onCreated: () => void }) {
  const [type, setType] = useState<WasteReport['type']>('road_waste');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAddress('GPS not supported on this device');
      return;
    }
    setDetectingLocation(true);
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' },
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setAddress(addr);
          } else {
            setAddress(`Live GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch {
          setAddress(`Live GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setDetectingLocation(false);
        setLocationSuccess(true);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingLocation(false);
        setAddress('GPS location unavailable - please enable device location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (open) {
      fetchLiveLocation();
    }
  }, [open, fetchLiveLocation]);

  async function handleUpload(file: File) {
    setLoading(true);
    const ext = file.name.split('.').pop();
    const path = `reports/${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('waste-photos').upload(path, file);
    if (upErr) {
      setPhotoUrl('');
    } else {
      const { data } = supabase.storage.from('waste-photos').getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('waste_reports').insert({
      reporter_id: userId,
      type,
      description,
      address: address || 'Auto-detected Citizen Location',
      latitude,
      longitude,
      photo_url: photoUrl,
      status: 'pending',
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setType('road_waste'); setDescription(''); setAddress(''); setPhotoUrl('');
    onCreated(); onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Report Waste (कचरे की रिपोर्ट करें)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
        <div>
          <label className="label">Type of Waste</label>
          <select value={type} onChange={(e) => setType(e.target.value as WasteReport['type'])} className="input">
            {REPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px] resize-none" placeholder="Describe the waste situation..." />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Automatic Location (आपकी लोकेशन)</label>
            <button
              type="button"
              onClick={fetchLiveLocation}
              disabled={detectingLocation}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              {detectingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
              {detectingLocation ? 'Detecting GPS...' : 'Refresh Location'}
            </button>
          </div>
          <div className="relative">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input pr-10 bg-slate-50 border-emerald-300 font-medium text-slate-800"
              placeholder={detectingLocation ? "Detecting location automatically via GPS..." : "Auto-detected Location"}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {detectingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : locationSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" title="GPS Verified" />
              ) : (
                <MapPin className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
          {locationSuccess && (
            <p className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Location detected automatically via GPS (आपको टाइप करने की जरूरत नहीं)
            </p>
          )}
        </div>
        <div>
          <label className="label">Photo (optional)</label>
          <div className="flex items-center gap-3">
            <label className="btn-secondary cursor-pointer">
              <Camera className="h-4 w-4" /> Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
            {photoUrl && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Submitting...' : 'Submit Report (Admin को भेजें)'}</button>
      </form>
    </Modal>
  );
}

// ============ Recyclable Modal ============
function RecyclableModal({ open, onClose, userId, onCreated }: { open: boolean; onClose: () => void; userId: string; onCreated: () => void }) {
  const [wasteType, setWasteType] = useState<RecyclableListing['waste_type']>('plastic');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' },
          });
          if (res.ok) {
            const data = await res.json();
            setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          } else {
            setAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch {
          setAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setDetectingLocation(false);
        setLocationSuccess(true);
      },
      () => setDetectingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (open) fetchLiveLocation();
  }, [open, fetchLiveLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('recyclable_listings').insert({
      citizen_id: userId,
      waste_type: wasteType,
      quantity_kg: parseFloat(quantity) || 0,
      description,
      address: address || 'Auto-detected Citizen Location',
      latitude,
      longitude,
      status: 'available',
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setWasteType('plastic'); setQuantity(''); setDescription(''); setAddress('');
    onCreated(); onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="List Recyclable Waste">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
        <div>
          <label className="label">Waste Type</label>
          <div className="grid grid-cols-4 gap-2">
            {WASTE_TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => setWasteType(t.id as any)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  wasteType === t.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}>
                <span className="text-xl">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Quantity (kg)</label>
          <input type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" placeholder="0.0" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[60px] resize-none" placeholder="Describe the recyclable waste..." />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Pickup Address (Automatic)</label>
            <button type="button" onClick={fetchLiveLocation} className="text-xs font-semibold text-emerald-700 hover:underline">
              {detectingLocation ? 'Detecting...' : 'Auto-Detect Location'}
            </button>
          </div>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="input bg-slate-50" placeholder="Auto-detected Location" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Submitting...' : 'List for Pickup'}</button>
      </form>
    </Modal>
  );
}

// ============ Surplus Food Modal ============
function SurplusFoodModal({ open, onClose, userId, onCreated }: { open: boolean; onClose: () => void; userId: string; onCreated: () => void }) {
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [isFresh, setIsFresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAddress('GPS not supported on this device');
      return;
    }
    setDetectingLocation(true);
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' },
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setAddress(addr);
          } else {
            setAddress(`Live GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch {
          setAddress(`Live GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setDetectingLocation(false);
        setLocationSuccess(true);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingLocation(false);
        setAddress('GPS location unavailable - please enable device location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (open) {
      fetchLiveLocation();
    }
  }, [open, fetchLiveLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('surplus_food').insert({
      citizen_id: userId,
      food_type: foodType,
      quantity,
      preparation_time: prepTime ? new Date(prepTime).toISOString() : null,
      description,
      address: address || 'Auto-detected Citizen Location',
      latitude,
      longitude,
      is_fresh: isFresh,
      status: 'available',
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setFoodType(''); setQuantity(''); setPrepTime(''); setDescription(''); setAddress(''); setIsFresh(true);
    onCreated(); onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Donate Surplus Food (भोजन दान करें)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Only fresh, safe food is accepted. Expired or unsafe food will be rejected.
        </div>
        <div>
          <label className="label">Food Type</label>
          <input value={foodType} onChange={(e) => setFoodType(e.target.value)} required className="input" placeholder="e.g., Cooked rice, dal, vegetables..." />
        </div>
        <div>
          <label className="label">Quantity</label>
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" placeholder="e.g., 5 kg, 20 servings..." />
        </div>
        <div>
          <label className="label">Preparation Time</label>
          <input type="datetime-local" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[60px] resize-none" placeholder="Describe the food..." />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Automatic Pickup Location (आपकी लोकेशन)</label>
            <button
              type="button"
              onClick={fetchLiveLocation}
              disabled={detectingLocation}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              {detectingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
              {detectingLocation ? 'Detecting GPS...' : 'Refresh Location'}
            </button>
          </div>
          <div className="relative">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input pr-10 bg-slate-50 border-emerald-300 font-medium text-slate-800"
              placeholder={detectingLocation ? "Detecting location automatically via GPS..." : "Auto-detected Location"}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {detectingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : locationSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" title="GPS Verified" />
              ) : (
                <MapPin className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
          {locationSuccess && (
            <p className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Location detected automatically via GPS (लोकेशन खुद ले ली गई है)
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isFresh} onChange={(e) => setIsFresh(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
          I confirm this food is fresh and safe for consumption
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Submitting...' : 'List for Donation (Admin को सूचित करें)'}</button>
      </form>
    </Modal>
  );
}
