import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Recycle, Utensils, Camera, MapPin, Trophy, BookOpen, Clock, CheckCircle2, AlertCircle, Plus, Award, Loader2, Navigation, X, Eye, Truck, Radio, KeyRound, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { StatCard, PageHeader, Section } from '@/components/ui/StatCard';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { supabase, type WasteReport, type RecyclableListing, type SurplusFood, type Certificate, type VehicleLocation, type Profile } from '@/lib/supabase';
import { WASTE_TYPES, REPORT_TYPES, STATUS_COLORS, formatTimeAgo } from '@/lib/constants';
import { VehicleMap, type VehiclePos, MapPlaceholder } from '@/components/VehicleMap';
import { generateOtp, extractFoodOtp, cleanFoodDescription } from '@/lib/foodOtp';

export function CitizenDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'reports' | 'recyclable' | 'food'>('overview');

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [recyclables, setRecyclables] = useState<RecyclableListing[]>([]);
  const [foodListings, setFoodListings] = useState<(SurplusFood & { ngo?: Profile })[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [vehicles, setVehicles] = useState<(VehicleLocation & { driver?: Profile })[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRecyclableModal, setShowRecyclableModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile) return;
    const [reportsRes, recycRes, foodRes, certRes, vehiclesRes] = await Promise.all([
      supabase.from('waste_reports').select('*').eq('reporter_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('recyclable_listings').select('*').eq('citizen_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('surplus_food').select('*, ngo:profiles!surplus_food_accepted_by_fkey(*)').eq('citizen_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').eq('user_id', profile.id).order('issued_at', { ascending: false }),
      supabase.from('vehicle_locations').select('*, driver:profiles!vehicle_locations_driver_id_fkey(*)').order('updated_at', { ascending: false }),
    ]);
    setReports((reportsRes.data as WasteReport[]) ?? []);
    setRecyclables((recycRes.data as RecyclableListing[]) ?? []);
    setFoodListings((foodRes.data as (SurplusFood & { ngo?: Profile })[]) ?? []);
    setCertificates((certRes.data as Certificate[]) ?? []);
    setVehicles((vehiclesRes.data as (VehicleLocation & { driver?: Profile })[]) ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime polling for live vehicle locations every 5 seconds
  useEffect(() => {
    const pollVehicles = async () => {
      const { data } = await supabase
        .from('vehicle_locations')
        .select('*, driver:profiles!vehicle_locations_driver_id_fkey(*)')
        .order('updated_at', { ascending: false });
      if (data) {
        setVehicles(data as (VehicleLocation & { driver?: Profile })[]);
      }
    };
    const interval = setInterval(pollVehicles, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current user GPS location for map centering and distance calculation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

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

  const vehiclePositions: VehiclePos[] = vehicles.map((v) => ({
    driver_id: v.driver_id,
    driver_name: v.driver?.full_name ?? 'Collection Driver',
    latitude: v.latitude,
    longitude: v.longitude,
    speed: v.speed,
    heading: v.heading,
    updated_at: v.updated_at,
  }));

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
              <span>🌱 Wastify Citizen Dashboard</span>
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
              onClick={() => setActiveTab('tracking')}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/20 border border-white/20 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 cursor-pointer"
            >
              <Truck className="h-4 w-4" />
              <span>Track Driver</span>
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={AlertCircle} label="Pending Reports" value={pendingReports} color="amber" />
        <StatCard icon={CheckCircle2} label="Resolved Reports" value={resolvedReports} color="green" />
        <StatCard icon={Recycle} label="Recyclables Listed" value={recyclables.length} color="teal" />
        <StatCard icon={Truck} label="Active Trucks" value={vehicles.length} color="blue" />
        <StatCard icon={Trophy} label="Reward Points" value={profile.points} color="amber" />
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button onClick={() => setShowReportModal(true)} className="card-hover flex items-center gap-3 p-4 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Report Waste</p>
            <p className="text-xs text-slate-500">Auto GPS geo-tagged</p>
          </div>
        </button>
        <button onClick={() => setActiveTab('tracking')} className="card-hover flex items-center gap-3 p-4 text-left border-blue-100 bg-blue-50/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <span>Track Driver</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </p>
            <p className="text-xs text-slate-500">Live garbage trucks</p>
          </div>
        </button>
        <button onClick={() => navigate('/app/learning')} className="card-hover flex items-center gap-3 p-4 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
      <div className="mt-8 flex gap-1 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'tracking', label: '🚚 Track Driver (Live Tracking)' },
          { id: 'reports', label: 'My Reports' },
          { id: 'recyclable', label: 'Recyclables' },
          { id: 'food', label: 'Surplus Food' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
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
              {/* Live Driver / Truck Location Tracking */}
              <Section
                title="Live Garbage Collection Trucks (Real-Time Tracking)"
                action={
                  <button
                    onClick={() => setActiveTab('tracking')}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>Full Screen Track</span>
                    <span>→</span>
                  </button>
                }
              >
                {vehicles.length === 0 ? (
                  <MapPlaceholder
                    icon={<Navigation className="h-6 w-6" />}
                    message="No collection vehicles currently broadcasting GPS. Trucks appear here live as soon as drivers begin rounds."
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                      <span className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <strong className="text-slate-800">{vehicles.length}</strong> active vehicle{vehicles.length > 1 ? 's' : ''} nearby
                      </span>
                      <span className="text-slate-400">Updates live every 5s</span>
                    </div>
                    <VehicleMap vehicles={vehiclePositions} userPos={userLocation} height="320px" />
                  </div>
                )}
              </Section>

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

          {activeTab === 'tracking' && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span className="text-xs uppercase tracking-wider font-bold text-emerald-100">Live Satellite GPS</span>
                  </div>
                  <h2 className="text-xl font-bold mt-1 text-white">Garbage Collection Vehicle Tracking</h2>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                    Track real-time locations of municipal garbage collection trucks and drivers near your home.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2.5 text-center">
                    <span className="text-xl font-black">{vehicles.length}</span>
                    <p className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">Active Trucks</p>
                  </div>
                </div>
              </div>

              {vehicles.length === 0 ? (
                <MapPlaceholder
                  icon={<Navigation className="h-8 w-8" />}
                  message="No garbage collection trucks currently broadcasting live GPS. Trucks will automatically appear on this map as soon as drivers begin their morning or evening rounds."
                />
              ) : (
                <div className="space-y-4">
                  <VehicleMap vehicles={vehiclePositions} userPos={userLocation} height="460px" />

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-emerald-600" />
                      Active Drivers on Duty ({vehicles.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {vehicles.map((v) => (
                        <div key={v.id} className="card-hover rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-lg">
                                🚛
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{v.driver?.full_name ?? 'Municipal Driver'}</p>
                                <p className="text-[11px] text-slate-400">Updated {formatTimeAgo(v.updated_at)}</p>
                              </div>
                            </div>
                            <span className="badge bg-emerald-100 text-emerald-800 flex items-center gap-1 text-[11px]">
                              <Radio className="h-3 w-3 animate-pulse text-emerald-600" /> Live
                            </span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>GPS: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</span>
                            <span>Speed: {v.speed > 0 ? `${(v.speed * 3.6).toFixed(1)} km/h` : 'Stopped'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
  const [showFull, setShowFull] = useState(false);
  return (
    <div className="card-hover p-4 rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{reportType?.icon}</span>
          <div>
            <p className="text-sm font-bold text-slate-900">{reportType?.label ?? 'Report'}</p>
            <p className="text-xs text-slate-400">{formatTimeAgo(report.created_at)}</p>
          </div>
        </div>
        <span className={`badge ${STATUS_COLORS[report.status]}`}>
          {report.status.replace('_', ' ')}
        </span>
      </div>
      {report.description && <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{report.description}"</p>}
      
      {/* Uploaded Photo Display */}
      {report.photo_url && (
        <div className="mt-2.5">
          <div
            onClick={() => setShowFull(true)}
            className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 cursor-pointer group"
          >
            <img src={report.photo_url} alt="Uploaded complaint proof" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> View Photo
              </span>
            </div>
          </div>
        </div>
      )}

      {showFull && report.photo_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowFull(false)}>
          <div className="relative max-w-lg w-full bg-white rounded-2xl p-3" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowFull(false)} className="absolute top-2 right-2 rounded-full p-1 bg-slate-100 text-slate-600 hover:bg-slate-200">
              <X className="h-4 w-4" />
            </button>
            <img src={report.photo_url} alt="Enlarged proof" className="w-full max-h-[70vh] object-contain rounded-xl mt-4" />
          </div>
        </div>
      )}

      {report.address && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{report.address}</span>
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
function FoodCard({ food }: { food: SurplusFood & { ngo?: Profile } }) {
  const displayDesc = cleanFoodDescription(food.description);
  const otp = extractFoodOtp(food.description, food.id);

  let statusLabel = 'Available';
  let badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  if (food.status === 'available') {
    statusLabel = 'Pending NGO Assignment';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  } else if (food.status === 'accepted') {
    statusLabel = food.ngo ? `Assigned to ${food.ngo.full_name}` : 'Assigned to NGO (Pending Pickup)';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
  } else if (food.status === 'collected') {
    statusLabel = 'Collected / Completed';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (food.status === 'rejected') {
    statusLabel = 'Rejected';
    badgeColor = 'bg-red-100 text-red-800 border-red-200';
  }

  return (
    <div className="card-hover p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Utensils className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{food.food_type}</p>
            <p className="text-xs text-slate-400">{formatTimeAgo(food.created_at)}</p>
          </div>
        </div>
        <span className={`badge border font-semibold ${badgeColor}`}>
          {statusLabel}
        </span>
      </div>

      {food.quantity && <p className="mt-2 text-sm text-slate-600 font-medium">Quantity: {food.quantity}</p>}
      {displayDesc && <p className="mt-1 text-sm text-slate-500 italic">"{displayDesc}"</p>}
      {food.preparation_time && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" /> Prepared: {new Date(food.preparation_time).toLocaleString()}
        </div>
      )}
      {food.address && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3 text-emerald-600 shrink-0" /> {food.address}
        </div>
      )}

      {/* Secret Verification OTP for Citizen */}
      {food.status !== 'collected' && food.status !== 'rejected' && (
        <div className="mt-3.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-amber-700" />
                Pickup Verification OTP
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-tight">
                Share this OTP with the NGO collector upon food handover
              </p>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <span className="font-mono text-lg font-black tracking-widest text-amber-950 bg-white px-3 py-0.5 rounded-lg border border-amber-300 shadow-xs">
                {otp}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-amber-700 font-bold mt-0.5">Secret Code</span>
            </div>
          </div>
        </div>
      )}

      {food.status === 'collected' && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Food successfully collected & verified via Citizen OTP</span>
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

  function handleUpload(file: File) {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          setPhotoUrl(dataUrl);
        } else {
          setPhotoUrl(e.target?.result as string || '');
        }
        setLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
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
    <Modal open={open} onClose={onClose} title="Report Waste">
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
        {/* 100% Automated Live GPS Geo-Tag (No manual entry) */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              🛰️ Automatic GPS Geo-Tag
            </span>
            <button
              type="button"
              onClick={fetchLiveLocation}
              disabled={detectingLocation}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              {detectingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
              <span>{detectingLocation ? 'Locating...' : 'Re-sync GPS'}</span>
            </button>
          </div>

          {detectingLocation ? (
            <div className="py-2 flex items-center gap-2 text-xs font-medium text-emerald-800">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600 shrink-0" />
              <span>Fetching live GPS satellite coordinates for geo-tagging...</span>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                📍 {address || 'Live Satellite GPS Location'}
              </p>
              {latitude && longitude ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-900 bg-white/90 rounded-lg px-2.5 py-1 border border-emerald-200">
                  <span>GPS Lat: {latitude.toFixed(6)}°</span>
                  <span>•</span>
                  <span>Lng: {longitude.toFixed(6)}°</span>
                  <span className="ml-auto text-emerald-700 font-sans font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Geo-Tagged Complaint
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-amber-700">Please enable device GPS for precise geo-tagging.</p>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="label">Waste Photo</label>
          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 max-h-48 w-full bg-slate-900">
              <img src={photoUrl} alt="Waste preview" className="h-44 w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-red-600 transition-colors cursor-pointer"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Photo Attached (Visible to Admin)
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="btn-secondary cursor-pointer py-2 px-4 text-xs font-bold border-2 border-dashed border-slate-300 hover:border-emerald-500 flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-600" /> Upload Waste Photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
              <span className="text-xs text-slate-400">Photo will be sent directly to Admin</span>
            </div>
          )}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Submitting...' : 'Submit Report to Admin'}</button>
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
        {/* 100% Automated Live GPS Geo-Tag (No manual entry) */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              🛰️ Automatic Pickup GPS Location
            </span>
            <button
              type="button"
              onClick={fetchLiveLocation}
              disabled={detectingLocation}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              {detectingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
              <span>{detectingLocation ? 'Locating...' : 'Re-sync GPS'}</span>
            </button>
          </div>
          <p className="text-xs font-bold text-slate-900 leading-snug">
            📍 {address || 'Live Satellite GPS Pickup Point'}
          </p>
          {latitude && longitude && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-900 bg-white/90 rounded-lg px-2.5 py-1 border border-emerald-200">
              <span>GPS Lat: {latitude.toFixed(6)}°</span>
              <span>•</span>
              <span>Lng: {longitude.toFixed(6)}°</span>
              <span className="ml-auto text-emerald-700 font-sans font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Geo-Verified
              </span>
            </div>
          )}
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
    const otp = generateOtp();
    const fullDescription = `[OTP: ${otp}] ${description.trim()}`;
    const { error } = await supabase.from('surplus_food').insert({
      citizen_id: userId,
      food_type: foodType,
      quantity,
      preparation_time: prepTime ? new Date(prepTime).toISOString() : null,
      description: fullDescription,
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
    <Modal open={open} onClose={onClose} title="Donate Surplus Food">
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
        {/* 100% Automated Live GPS Geo-Tag (No manual entry) */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              🛰️ Automatic Pickup GPS Location
            </span>
            <button
              type="button"
              onClick={fetchLiveLocation}
              disabled={detectingLocation}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              {detectingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
              <span>{detectingLocation ? 'Locating...' : 'Re-sync GPS'}</span>
            </button>
          </div>

          {detectingLocation ? (
            <div className="py-2 flex items-center gap-2 text-xs font-medium text-emerald-800">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600 shrink-0" />
              <span>Fetching live GPS satellite coordinates for food donation pickup...</span>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                📍 {address || 'Live Satellite GPS Pickup Point'}
              </p>
              {latitude && longitude ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-900 bg-white/90 rounded-lg px-2.5 py-1 border border-emerald-200">
                  <span>GPS Lat: {latitude.toFixed(6)}°</span>
                  <span>•</span>
                  <span>Lng: {longitude.toFixed(6)}°</span>
                  <span className="ml-auto text-emerald-700 font-sans font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Geo-Tagged Pickup
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-amber-700">Please enable device GPS for pickup point geo-tagging.</p>
              )}
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isFresh} onChange={(e) => setIsFresh(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
          I confirm this food is fresh and safe for consumption
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Submitting...' : 'List for Donation (Notify Admin)'}</button>
      </form>
    </Modal>
  );
}
