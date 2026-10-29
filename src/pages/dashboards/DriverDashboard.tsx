import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Crosshair,
  Trash2,
  Activity,
  Flag,
  Package,
  Radio,
  Power,
  TrendingUp,
  ShieldCheck,
  KeyRound,
  Lock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard, PageHeader, Section } from '@/components/ui/StatCard';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import {
  supabase,
  type WasteReport,
  type DriverAssignment,
  type Area,
  type CollectionTrip,
  type VehicleLocation,
  type Profile,
} from '@/lib/supabase';
import { REPORT_TYPES, STATUS_COLORS, formatTimeAgo } from '@/lib/constants';
import { VehicleMap, type VehiclePos, MapPlaceholder } from '@/components/VehicleMap';
import { cleanFoodDescription, extractFoodOtp } from '@/lib/foodOtp';

export function DriverDashboard() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<(DriverAssignment & { area: Area })[]>([]);
  const [assignedReports, setAssignedReports] = useState<(WasteReport & { reporter?: Profile })[]>([]);
  const [activeTrip, setActiveTrip] = useState<CollectionTrip | null>(null);
  const [completedTrips, setCompletedTrips] = useState<CollectionTrip[]>([]);
  const [vehicleLoc, setVehicleLoc] = useState<VehicleLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Tab state: 'tasks' | 'map' | 'completed'
  const [activeTab, setActiveTab] = useState<'tasks' | 'map' | 'completed'>('tasks');

  // Trip completion modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [tripWasteKg, setTripWasteKg] = useState('');
  const [tripDropoff, setTripDropoff] = useState('');
  const [tripNotes, setTripNotes] = useState('');

  // Report completion OTP verification modal
  const [otpModalReport, setOtpModalReport] = useState<(WasteReport & { reporter?: Profile }) | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile) return;
    const [assignRes, reportsRes, tripRes, completedRes, locRes] = await Promise.all([
      supabase
        .from('driver_assignments')
        .select('*, area:areas(*)')
        .eq('driver_id', profile.id)
        .eq('status', 'active'),
      supabase
        .from('waste_reports')
        .select('*, reporter:profiles!waste_reports_reporter_id_fkey(*)')
        .eq('assigned_to', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('collection_trips')
        .select('*')
        .eq('driver_id', profile.id)
        .eq('status', 'in_progress')
        .maybeSingle(),
      supabase
        .from('collection_trips')
        .select('*')
        .eq('driver_id', profile.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20),
      supabase
        .from('vehicle_locations')
        .select('*')
        .eq('driver_id', profile.id)
        .maybeSingle(),
    ]);
    setAssignments((assignRes.data as (DriverAssignment & { area: Area })[]) ?? []);
    setAssignedReports((reportsRes.data as (WasteReport & { reporter?: Profile })[]) ?? []);
    setActiveTrip((tripRes.data as CollectionTrip) ?? null);
    setCompletedTrips((completedRes.data as CollectionTrip[]) ?? []);
    setVehicleLoc((locRes.data as VehicleLocation) ?? null);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation || !profile) return;
    setTracking(true);
    window.dispatchEvent(
      new CustomEvent('driver-gps-state-changed', { detail: { active: true } })
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setCurrentPos({ lat: latitude, lng: longitude });
        const { data: existing } = await supabase
          .from('vehicle_locations')
          .select('id')
          .eq('driver_id', profile.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('vehicle_locations')
            .update({
              latitude,
              longitude,
              speed: speed ?? 0,
              heading: heading ?? 0,
              updated_at: new Date().toISOString(),
            })
            .eq('driver_id', profile.id);
        } else {
          await supabase.from('vehicle_locations').insert({
            driver_id: profile.id,
            latitude,
            longitude,
            speed: speed ?? 0,
            heading: heading ?? 0,
          });
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setTracking(false);
        window.dispatchEvent(
          new CustomEvent('driver-gps-state-changed', { detail: { active: false } })
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }, [profile]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    window.dispatchEvent(
      new CustomEvent('driver-gps-state-changed', { detail: { active: false } })
    );
  }, []);

  // Listen to toggle-driver-gps and driver-show-completed events from the sidebar
  useEffect(() => {
    function handleToggleGps() {
      if (tracking) {
        stopTracking();
      } else {
        startTracking();
      }
    }

    function handleShowCompleted() {
      setActiveTab('completed');
    }

    window.addEventListener('toggle-driver-gps', handleToggleGps);
    window.addEventListener('driver-show-completed', handleShowCompleted);
    return () => {
      window.removeEventListener('toggle-driver-gps', handleToggleGps);
      window.removeEventListener('driver-show-completed', handleShowCompleted);
    };
  }, [tracking, startTracking, stopTracking]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  async function startTrip() {
    if (!profile || assignments.length === 0) return;
    const area = assignments[0];
    await supabase.from('collection_trips').insert({
      driver_id: profile.id,
      area_id: area.area_id,
      status: 'in_progress',
    });
    // Auto start GPS when trip starts
    if (!tracking) startTracking();
    loadData();
  }

  async function completeTrip() {
    if (!profile || !activeTrip) return;
    await supabase
      .from('collection_trips')
      .update({
        status: 'completed',
        waste_collected_kg: parseFloat(tripWasteKg) || 0,
        dropoff_location: tripDropoff,
        notes: tripNotes,
        completed_at: new Date().toISOString(),
      })
      .eq('id', activeTrip.id);
    setShowCompleteModal(false);
    setTripWasteKg('');
    setTripDropoff('');
    setTripNotes('');
    loadData();
  }

  async function updateStatus(reportId: string, status: WasteReport['status']) {
    await supabase.from('waste_reports').update({ status }).eq('id', reportId);
    loadData();
  }

  async function handleVerifyReportOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpModalReport) return;
    setOtpError(null);

    const expectedOtp = extractFoodOtp(otpModalReport.description, otpModalReport.id);
    if (enteredOtp.trim() !== expectedOtp.trim()) {
      setOtpError('Invalid OTP! Please ask the reporting citizen for their 4-digit code shown on their dashboard.');
      return;
    }

    setVerifying(true);
    await updateStatus(otpModalReport.id, 'resolved');
    setVerifying(false);
    setOtpModalReport(null);
    setEnteredOtp('');
    setOtpError(null);
  }

  if (!profile) return <Spinner label="Loading..." />;

  const activeArea = assignments[0]?.area;
  const activeAssignment = assignments[0];
  const pendingTasks = assignedReports.filter((r) => r.status === 'pending').length;
  const inProgressTasks = assignedReports.filter((r) => r.status === 'in_progress').length;
  const resolvedTasks = assignedReports.filter((r) => r.status === 'resolved').length;

  const totalWasteCollectedKg = completedTrips.reduce(
    (sum, t) => sum + (Number(t.waste_collected_kg) || 0),
    0
  );

  const vehicles: VehiclePos[] = vehicleLoc
    ? [
        {
          driver_id: profile.id,
          driver_name: profile.full_name,
          latitude: vehicleLoc.latitude,
          longitude: vehicleLoc.longitude,
          speed: vehicleLoc.speed,
          heading: vehicleLoc.heading,
          updated_at: vehicleLoc.updated_at,
        },
      ]
    : [];

  return (
    <DashboardLayout>
      {/* ------------------------------------------------------------------ */}
      {/* HERO TELEMETRY COCKPIT & GPS CONTROLLER BANNER                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: Driver Route & Vehicle Status */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-7 sm:p-9 text-white shadow-xl flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-bold text-indigo-300">
                🚛 Waste Collection Vehicle
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300">
                {activeArea ? `${activeArea.name}, ${activeArea.city}` : 'Area Assigned'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Driver: {profile.full_name || 'Driver'}
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-lg leading-relaxed">
              Real-time route navigation, live GPS broadcast to municipality control center, and collection trip weight logging.
            </p>
          </div>

          {/* Active Trip Quick Control */}
          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            {activeTrip ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/20 px-3.5 py-2 rounded-xl border border-amber-400/30">
                  <Clock className="h-4 w-4 animate-spin" />
                  Trip In Progress (Started {formatTimeAgo(activeTrip.started_at)})
                </span>
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-emerald-400 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Trip & Log Weight
                </button>
              </div>
            ) : (
              <button
                onClick={startTrip}
                disabled={!activeArea}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:brightness-110 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Flag className="h-4 w-4" />
                Start Collection Shift
              </button>
            )}
          </div>
        </div>

        {/* Right: GPS Telemetry Switch Widget */}
        <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl transition-all flex flex-col justify-between ${
          tracking
            ? 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 shadow-emerald-700/25'
            : 'bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 shadow-slate-900/20'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Live Telemetry
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  tracking ? 'bg-emerald-400 text-slate-950 animate-pulse' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {tracking ? '● LIVE BROADCAST' : 'PAUSED'}
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${
                tracking ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}>
                <Radio className={`h-6 w-6 ${tracking ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">GPS Transmitter</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {tracking ? 'Signal active: High Accuracy' : 'Turn ON when starting route'}
                </p>
              </div>
            </div>

            {/* Live Stats */}
            <div className="mt-3 rounded-2xl bg-black/25 p-3 text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Latitude / Longitude:</span>
                <span className="font-bold text-white">
                  {currentPos ? `${currentPos.lat.toFixed(4)}, ${currentPos.lng.toFixed(4)}` : 'Waiting for GPS...'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Status:</span>
                <span className={`font-bold ${tracking ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {tracking ? 'Broadcasting to Citizens' : 'GPS Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive GPS ON/OFF Toggle Button */}
          <button
            onClick={tracking ? stopTracking : startTracking}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer ${
              tracking
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            <Power className="h-4 w-4" />
            <span>{tracking ? 'Turn OFF GPS' : 'Turn ON GPS Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* STAT CARDS                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={MapPin} label="Assigned Area" value={activeArea ? activeArea.name : 'None'} color="blue" />
        <StatCard icon={AlertCircle} label="Pending Pickups" value={pendingTasks} color="amber" />
        <StatCard icon={Clock} label="In Progress" value={inProgressTasks} color="teal" />
        <StatCard icon={CheckCircle2} label="Work Completed" value={`${completedTrips.length} Trips (${totalWasteCollectedKg} kg)`} color="green" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* NAVIGATION TABS                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-8 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <span>Active Route & Tasks ({assignedReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'map'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Navigation className="h-4 w-4" />
          <span>Vehicle Live Map</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'completed'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Work Completed ({completedTrips.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB CONTENT: TASKS                                                 */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'tasks' && (
        <div className="mt-6 space-y-6">
          {activeAssignment && (
            <div className="card p-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Driver Sector Details
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Assigned Sector</p>
                  <p className="font-semibold text-slate-800">{activeArea?.name ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">City / Ward</p>
                  <p className="font-semibold text-slate-800">
                    {activeAssignment.city || activeArea?.city || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Base House / Ward No.</p>
                  <p className="font-semibold text-slate-800">{activeAssignment.house_no || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Full Address</p>
                  <p className="font-semibold text-slate-800">{activeAssignment.full_address || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Citizen Waste Pickup Requests</h3>
            {loading ? (
              <Spinner label="Loading tasks..." />
            ) : assignedReports.length === 0 ? (
              <EmptyState
                icon={<Trash2 className="h-10 w-10" />}
                title="No pending tasks"
                message="All waste reports in your area are currently cleared!"
              />
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {assignedReports.map((report) => {
                  const cleanDesc = cleanFoodDescription(report.description);
                  let statusBadgeClass = STATUS_COLORS[report.status] || 'bg-slate-100 text-slate-700';
                  let statusBadgeText = report.status.replace('_', ' ');
                  if (report.status === 'in_progress') {
                    statusBadgeClass = 'bg-blue-100 text-blue-800 border border-blue-300';
                    statusBadgeText = 'In Progress (Pickup)';
                  } else if (report.status === 'resolved') {
                    statusBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                    statusBadgeText = 'Resolved / Done';
                  }

                  return (
                    <div key={report.id} className="card-hover p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{REPORT_TYPES.find((t) => t.id === report.type)?.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {REPORT_TYPES.find((t) => t.id === report.type)?.label}
                            </p>
                            <p className="text-xs text-slate-400">{formatTimeAgo(report.created_at)}</p>
                          </div>
                        </div>
                        <span className={`badge font-semibold ${statusBadgeClass}`}>
                          {statusBadgeText}
                        </span>
                      </div>

                      {cleanDesc && (
                        <p className="mt-3 text-sm text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg italic">"{cleanDesc}"</p>
                      )}

                      <p className="mt-2 text-xs text-slate-500">
                        Reporting Citizen: <strong className="text-slate-800">{report.reporter?.full_name || 'Citizen'}</strong>
                      </p>

                      {report.address && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{report.address}</span>
                        </div>
                      )}

                      {report.status !== 'resolved' && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {report.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(report.id, 'in_progress')}
                              className="btn-secondary text-xs w-full py-2"
                            >
                              Accept & Start Route
                            </button>
                          )}
                          {report.status === 'in_progress' && (
                            <div>
                              <button
                                onClick={() => {
                                  setOtpModalReport(report);
                                  setEnteredOtp('');
                                  setOtpError(null);
                                }}
                                className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <KeyRound className="h-4 w-4" />
                                <span>Mark Done (Enter Citizen OTP)</span>
                              </button>
                              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                                Enter the 4-digit OTP provided by the reporting citizen
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {report.status === 'resolved' && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Collection verified via Citizen OTP & marked Done</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB CONTENT: MAP                                                   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'map' && (
        <div className="mt-6 card p-6 border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Live GPS Vehicle Radar</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays vehicle live telemetry and nearby citizen complaints
              </p>
            </div>
            <button
              onClick={tracking ? stopTracking : startTracking}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                tracking ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {tracking ? 'Stop GPS' : 'Start GPS'}
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200">
            {vehicleLoc || currentPos ? (
              <VehicleMap
                vehicles={
                  currentPos && tracking
                    ? [
                        {
                          driver_id: profile.id,
                          driver_name: profile.full_name,
                          latitude: currentPos.lat,
                          longitude: currentPos.lng,
                          speed: 0,
                          heading: 0,
                          updated_at: new Date().toISOString(),
                        },
                      ]
                    : vehicles
                }
                userPos={currentPos}
                height="450px"
              />
            ) : (
              <MapPlaceholder
                icon={<Navigation className="h-8 w-8 text-slate-400" />}
                message="Turn ON GPS Telemetry to view your live vehicle on the map"
              />
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB CONTENT: WORK COMPLETED                                        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'completed' && (
        <div className="mt-6 space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-xs font-semibold text-slate-400">Total Trips Completed</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{completedTrips.length}</p>
            </div>
            <div className="card p-5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-xs font-semibold text-slate-400">Total Waste Dumped & Logged</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{totalWasteCollectedKg} kg</p>
            </div>
            <div className="card p-5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-xs font-semibold text-slate-400">Cleanliness Resolution</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{resolvedTasks} Tasks</p>
            </div>
          </div>

          {/* List of Completed Trips */}
          <div className="card p-6 border border-slate-200 rounded-3xl">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Completed Shifts & Dropoff History
            </h3>

            {completedTrips.length === 0 ? (
              <EmptyState
                icon={<Package className="h-10 w-10 text-slate-400" />}
                title="No completed trips yet"
                message="Start a collection shift and complete it to record waste weight."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {completedTrips.map((trip) => (
                  <div key={trip.id} className="card p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {trip.waste_collected_kg} kg collected
                          </p>
                          <p className="text-xs text-slate-400">
                            {trip.completed_at ? formatTimeAgo(trip.completed_at) : 'Completed'}
                          </p>
                        </div>
                      </div>
                      <span className="badge bg-emerald-100 text-emerald-700 border-emerald-200">
                        Verified
                      </span>
                    </div>

                    {trip.dropoff_location && (
                      <p className="mt-2.5 text-xs text-slate-600 font-medium">
                        📍 Dropoff: {trip.dropoff_location}
                      </p>
                    )}
                    {trip.notes && (
                      <p className="mt-1 text-xs text-slate-500 italic">"{trip.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      <Modal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Collection Shift"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Total Waste Collected (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={tripWasteKg}
              onChange={(e) => setTripWasteKg(e.target.value)}
              className="input"
              placeholder="e.g. 145.5"
            />
          </div>
          <div>
            <label className="label">Dropoff / Dumping Facility Location</label>
            <input
              type="text"
              value={tripDropoff}
              onChange={(e) => setTripDropoff(e.target.value)}
              className="input"
              placeholder="e.g. Sector 12 Waste Processing Plant"
            />
          </div>
          <div>
            <label className="label">Shift Notes / Observations</label>
            <textarea
              value={tripNotes}
              onChange={(e) => setTripNotes(e.target.value)}
              className="input min-h-[80px]"
              placeholder="e.g. Route cleared on time, wet waste segregated..."
            />
          </div>
          <button onClick={completeTrip} className="btn-primary w-full py-3">
            <CheckCircle2 className="h-4 w-4" /> Record Dropoff & Complete Trip
          </button>
        </div>
      </Modal>

      {/* Waste Collection OTP Verification Modal */}
      <Modal
        open={!!otpModalReport}
        onClose={() => {
          setOtpModalReport(null);
          setEnteredOtp('');
          setOtpError(null);
        }}
        title="Verify Waste Collection with Citizen OTP"
      >
        {otpModalReport && (
          <form onSubmit={handleVerifyReportOtp} className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800">
              <p className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                Citizen Verification Required
              </p>
              Ask the citizen who reported this waste (
              <span className="font-semibold text-amber-950">
                {otpModalReport.reporter?.full_name || 'Citizen'}
              </span>
              ) for their 4-digit verification OTP shown on their Wastify dashboard.
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
              <p className="font-medium text-slate-500">Waste Details</p>
              <p className="text-sm font-semibold text-slate-800">
                {cleanFoodDescription(otpModalReport.description) || 'Waste collection request'}
              </p>
              <p className="text-slate-500">
                📍 {otpModalReport.address || 'Reported Location'}
              </p>
            </div>

            <div>
              <label className="label">Enter 4-Digit Citizen OTP</label>
              <input
                type="text"
                maxLength={4}
                required
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-2xl font-mono tracking-widest py-3 font-bold"
                placeholder="••••"
                autoFocus
              />
            </div>

            {otpError && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                {otpError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOtpModalReport(null);
                  setEnteredOtp('');
                  setOtpError(null);
                }}
                className="btn-secondary flex-1"
                disabled={verifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifying || enteredOtp.length !== 4}
                className="btn-primary flex-1"
              >
                {verifying ? 'Verifying...' : 'Verify & Mark Done'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
