import { useState, useEffect, useCallback } from 'react';
import { Shield, MapPin, Trash2, Truck, Trophy, AlertCircle, CheckCircle2, Clock, Navigation, Award, Plus, Utensils, Bell } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { StatCard, PageHeader, Section } from '@/components/ui/StatCard';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { supabase, type WasteReport, type Profile, type Area, type DriverAssignment, type VehicleLocation, type Reward, type SurplusFood } from '@/lib/supabase';
import { REPORT_TYPES, STATUS_COLORS, formatTimeAgo } from '@/lib/constants';
import { VehicleMap, type VehiclePos, MapPlaceholder } from '@/components/VehicleMap';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'food' | 'drivers' | 'vehicles' | 'rewards' | 'learning'>('overview');
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [foodListings, setFoodListings] = useState<(SurplusFood & { citizen?: Profile })[]>([]);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [assignments, setAssignments] = useState<(DriverAssignment & { driver: Profile; area: Area })[]>([]);
  const [vehicles, setVehicles] = useState<(VehicleLocation & { driver: Profile })[]>([]);
  const [rewards, setRewards] = useState<(Reward & { user: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [assignReport, setAssignReport] = useState<WasteReport | null>(null);

  const loadData = useCallback(async () => {
    const [reportsRes, foodRes, profilesRes, areasRes, assignRes, vehiclesRes, rewardsRes] = await Promise.all([
      supabase.from('waste_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('surplus_food').select('*, citizen:profiles!surplus_food_citizen_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('areas').select('*'),
      supabase.from('driver_assignments').select('*, driver:profiles!driver_assignments_driver_id_fkey(*), area:areas(*)').order('created_at', { ascending: false }),
      supabase.from('vehicle_locations').select('*, driver:profiles!vehicle_locations_driver_id_fkey(*)').order('updated_at', { ascending: false }),
      supabase.from('rewards').select('*, user:profiles!rewards_user_id_fkey(*)').order('created_at', { ascending: false }),
    ]);
    setReports((reportsRes.data as WasteReport[]) ?? []);
    setFoodListings((foodRes.data as (SurplusFood & { citizen?: Profile })[]) ?? []);
    const profiles = (profilesRes.data as Profile[]) ?? [];
    setAllProfiles(profiles);
    setDrivers(profiles.filter(p => p.role === 'driver'));
    setAreas((areasRes.data as Area[]) ?? []);
    setAssignments((assignRes.data as (DriverAssignment & { driver: Profile; area: Area })[]) ?? []);
    setVehicles((vehiclesRes.data as (VehicleLocation & { driver: Profile })[]) ?? []);
    setRewards((rewardsRes.data as (Reward & { user: Profile })[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    function handleSwitchTab(e: Event) {
      const customEvent = e as CustomEvent<{ tab: string }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab as typeof activeTab);
      }
    }
    window.addEventListener('admin-switch-tab', handleSwitchTab);
    return () => window.removeEventListener('admin-switch-tab', handleSwitchTab);
  }, []);

  async function assignReportToDriver(reportId: string, driverId: string) {
    await supabase.from('waste_reports').update({ assigned_to: driverId, status: 'in_progress' }).eq('id', reportId);
    setShowAssignModal(false);
    setAssignReport(null);
    loadData();
  }

  async function updateReportStatus(reportId: string, status: WasteReport['status']) {
    await supabase.from('waste_reports').update({ status }).eq('id', reportId);
    loadData();
  }

  if (!profile) return <Spinner label="Loading..." />;

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const activeDrivers = assignments.filter(a => a.status === 'active').length;
  const availableFood = foodListings.filter(f => f.status === 'available').length;

  const vehiclePositions: VehiclePos[] = vehicles.map((v) => ({
    driver_id: v.driver_id,
    driver_name: v.driver?.full_name ?? 'Driver',
    latitude: v.latitude,
    longitude: v.longitude,
    speed: v.speed,
    heading: v.heading,
    updated_at: v.updated_at,
  }));

  async function updateFoodStatus(id: string, status: SurplusFood['status']) {
    await supabase.from('surplus_food').update({ status }).eq('id', id);
    loadData();
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="City Operations & Oversight"
        subtitle="Manage fleet telemetry, assign drivers to complaints, review food donations, and oversee municipal waste zones."
        action={
          <button onClick={() => setShowAreaModal(true)} className="btn-secondary">
            <Plus className="h-4 w-4" /> Add Area
          </button>
        }
      />

      {/* Admin Notification Alert Banner */}
      {(pendingReports > 0 || availableFood > 0) && (
        <div className="mb-6 rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 text-emerald-950 shadow-sm animate-slide-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-xs">
              <Bell className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">🔔 Admin Operations Center (नया अलर्ट)</h4>
              <p className="text-xs text-slate-600">
                You have received <strong>{pendingReports} new Waste Reports</strong> and <strong>{availableFood} Food Donations</strong> from citizens with live GPS coordinates.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {pendingReports > 0 && (
              <button onClick={() => setActiveTab('reports')} className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer">
                View Reports ({pendingReports})
              </button>
            )}
            {availableFood > 0 && (
              <button onClick={() => setActiveTab('food')} className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-xs cursor-pointer">
                View Food ({availableFood})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={AlertCircle} label="Pending Reports" value={pendingReports} color="amber" />
        <StatCard icon={Clock} label="In Progress" value={inProgressReports} color="blue" />
        <StatCard icon={CheckCircle2} label="Resolved Reports" value={resolvedReports} color="green" />
        <StatCard icon={Utensils} label="Food Donations" value={availableFood} color="amber" />
        <StatCard icon={Truck} label="Active Drivers" value={activeDrivers} color="teal" />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'reports', label: `Waste Reports (${pendingReports})` },
          { id: 'food', label: `Food Donations (${availableFood})` },
          { id: 'drivers', label: 'Drivers & Areas' },
          { id: 'vehicles', label: 'Vehicle Tracking' },
          { id: 'rewards', label: 'Rewards' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading data..." />
      ) : (
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Section title="Recent Reports">
                {reports.length === 0 ? (
                  <EmptyState icon={<Trash2 className="h-10 w-10" />} title="No reports" />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {reports.slice(0, 6).map((report) => <AdminReportCard key={report.id} report={report} onAssign={(r) => { setAssignReport(r); setShowAssignModal(true); }} onUpdate={updateReportStatus} />)}
                  </div>
                )}
              </Section>

              <Section title="Live Vehicle Locations">
                {vehicles.length === 0 ? (
                  <MapPlaceholder icon={<Navigation className="h-6 w-6" />} message="No vehicles tracking. Drivers need to start GPS tracking." />
                ) : (
                  <VehicleMap vehicles={vehiclePositions} height="350px" />
                )}
              </Section>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              {reports.length === 0 ? (
                <EmptyState icon={<Trash2 className="h-10 w-10" />} title="No waste reports" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {reports.map((report) => <AdminReportCard key={report.id} report={report} onAssign={(r) => { setAssignReport(r); setShowAssignModal(true); }} onUpdate={updateReportStatus} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'food' && (
            <div>
              {foodListings.length === 0 ? (
                <EmptyState icon={<Utensils className="h-10 w-10" />} title="No food donations" message="No citizen has donated food yet." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {foodListings.map((food) => (
                    <div key={food.id} className="card-hover rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-xl font-bold">
                            🍱
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{food.food_type}</h4>
                            <p className="text-xs text-slate-500 font-medium">Quantity: {food.quantity || 'N/A'}</p>
                          </div>
                        </div>
                        <span className={`badge ${STATUS_COLORS[food.status] || 'bg-slate-100 text-slate-700'}`}>
                          {food.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-600">
                        {food.description && <p className="italic bg-slate-50 p-2 rounded-lg text-slate-700">"{food.description}"</p>}
                        <div className="flex items-center gap-2 text-emerald-800 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{food.address}</span>
                        </div>
                        {food.latitude && food.longitude && (
                          <p className="text-[11px] text-slate-400 pl-5">GPS: {food.latitude.toFixed(5)}, {food.longitude.toFixed(5)}</p>
                        )}
                        <p className="text-slate-500 pt-1 border-t border-slate-100">
                          Donor: <strong className="text-slate-800">{food.citizen?.full_name || 'Citizen'}</strong> • {formatTimeAgo(food.created_at)}
                        </p>
                      </div>

                      <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
                        {food.status === 'available' && (
                          <>
                            <button
                              onClick={() => updateFoodStatus(food.id, 'accepted')}
                              className="btn-primary text-xs py-1.5 px-3 flex-1 justify-center"
                            >
                              Approve Donation
                            </button>
                            <button
                              onClick={() => updateFoodStatus(food.id, 'rejected')}
                              className="btn-secondary text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 justify-center"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {food.status === 'accepted' && (
                          <button
                            onClick={() => updateFoodStatus(food.id, 'collected')}
                            className="btn-secondary text-xs py-1.5 px-3 w-full text-emerald-700 hover:bg-emerald-50 justify-center"
                          >
                            Mark as Collected by Shelter
                          </button>
                        )}
                        {food.status === 'collected' && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Successfully Distributed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="space-y-6">
              <Section title="Driver Assignments" action={
                <button onClick={() => setShowAssignModal(true)} className="btn-secondary text-sm">
                  <Plus className="h-4 w-4" /> Assign Driver
                </button>
              }>
                {assignments.length === 0 ? (
                  <EmptyState icon={<Truck className="h-10 w-10" />} title="No driver assignments" message="Assign drivers to areas to get started." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {assignments.map((a) => (
                      <div key={a.id} className="card-hover p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                              <Truck className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{a.driver?.full_name ?? 'Driver'}</p>
                              <p className="text-xs text-slate-500">{a.area?.name ?? 'No area'}</p>
                            </div>
                          </div>
                          <span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                        </div>
                        {(a.house_no || a.full_address || a.city) && (
                          <div className="mt-3 space-y-1 text-xs text-slate-500">
                            {a.house_no && <p>House: {a.house_no}</p>}
                            {a.full_address && <p>Address: {a.full_address}</p>}
                            <p>City: {a.city || a.area?.city || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Areas">
                {areas.length === 0 ? (
                  <EmptyState icon={<MapPin className="h-10 w-10" />} title="No areas defined" message="Add areas to assign drivers to." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {areas.map((area) => (
                      <div key={area.id} className="card-hover p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{area.name}</p>
                            <p className="text-xs text-slate-500">{area.city}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              {vehicles.length === 0 ? (
                <MapPlaceholder icon={<Navigation className="h-6 w-6" />} message="No vehicles tracking. Drivers need to start GPS tracking from their dashboard." />
              ) : (
                <>
                  <VehicleMap vehicles={vehiclePositions} height="400px" />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {vehicles.map((v) => (
                      <div key={v.id} className="card-hover p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <Truck className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{v.driver?.full_name ?? 'Driver'}</p>
                            <p className="text-xs text-slate-400">Updated {formatTimeAgo(v.updated_at)}</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p>Lat: {v.latitude.toFixed(4)}, Lng: {v.longitude.toFixed(4)}</p>
                          {v.speed > 0 && <p>Speed: {v.speed.toFixed(1)} m/s</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button onClick={() => setShowRewardModal(true)} className="btn-secondary">
                  <Award className="h-4 w-4" /> Award Points
                </button>
              </div>
              {rewards.length === 0 ? (
                <EmptyState icon={<Trophy className="h-10 w-10" />} title="No rewards given yet" message="Reward good-performing drivers and citizens." />
              ) : (
                <div className="space-y-3">
                  {rewards.map((r) => (
                    <div key={r.id} className="card-hover flex items-center gap-3 p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Trophy className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{r.user?.full_name ?? 'User'}</p>
                        <p className="text-xs text-slate-500">{r.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">+{r.points} pts</p>
                        <p className="text-xs text-slate-400">{formatTimeAgo(r.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Modals */}
      <AssignDriverModal
        open={showAssignModal && !assignReport}
        onClose={() => setShowAssignModal(false)}
        drivers={drivers}
        areas={areas}
        adminId={profile.id}
        onCreated={loadData}
      />
      <AssignReportModal
        open={showAssignModal && !!assignReport}
        onClose={() => { setShowAssignModal(false); setAssignReport(null); }}
        report={assignReport}
        drivers={drivers}
        onAssign={assignReportToDriver}
      />
      <AreaModal open={showAreaModal} onClose={() => setShowAreaModal(false)} onCreated={loadData} />
      <RewardModal open={showRewardModal} onClose={() => setShowRewardModal(false)} profiles={allProfiles} adminId={profile.id} onCreated={loadData} />
    </DashboardLayout>
  );
}

// ============ Admin Report Card ============
function AdminReportCard({ report, onAssign, onUpdate }: { report: WasteReport; onAssign: (r: WasteReport) => void; onUpdate: (id: string, status: WasteReport['status']) => void }) {
  const reportType = REPORT_TYPES.find(t => t.id === report.type);
  return (
    <div className="card-hover p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{reportType?.icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{reportType?.label}</p>
            <p className="text-xs text-slate-400">{formatTimeAgo(report.created_at)}</p>
          </div>
        </div>
        <span className={`badge ${STATUS_COLORS[report.status]}`}>{report.status.replace('_', ' ')}</span>
      </div>
      {report.description && <p className="mt-2 text-sm text-slate-600">{report.description}</p>}
      {report.address && <div className="mt-2 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" /> {report.address}</div>}
      <div className="mt-3 flex gap-2">
        {report.status === 'pending' && (
          <button onClick={() => onAssign(report)} className="btn-primary text-xs">
            Assign to Driver
          </button>
        )}
        {report.status === 'in_progress' && (
          <button onClick={() => onUpdate(report.id, 'resolved')} className="btn-secondary text-xs">
            Mark Resolved
          </button>
        )}
      </div>
    </div>
  );
}

// ============ Assign Driver to Area Modal ============
function AssignDriverModal({ open, onClose, drivers, areas, adminId, onCreated }: {
  open: boolean; onClose: () => void; drivers: Profile[]; areas: Area[]; adminId: string; onCreated: () => void;
}) {
  const [driverId, setDriverId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.from('driver_assignments').insert({
      driver_id: driverId, area_id: areaId, assigned_by: adminId, status: 'active',
      house_no: houseNo, full_address: fullAddress, city,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDriverId(''); setAreaId(''); setHouseNo(''); setFullAddress(''); setCity('');
    onCreated(); onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Driver to Area">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
        {drivers.length === 0 ? (
          <p className="text-sm text-slate-500">No drivers registered yet. Ask drivers to sign up first.</p>
        ) : areas.length === 0 ? (
          <p className="text-sm text-slate-500">No areas defined. Add an area first.</p>
        ) : (
          <>
            <div>
              <label className="label">Driver</label>
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)} required className="input">
                <option value="">Select driver...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Area</label>
              <select value={areaId} onChange={(e) => setAreaId(e.target.value)} required className="input">
                <option value="">Select area...</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}, {a.city}</option>)}
              </select>
            </div>
            <div>
              <label className="label">House No.</label>
              <input value={houseNo} onChange={(e) => setHouseNo(e.target.value)} className="input" placeholder="e.g., 42A" />
            </div>
            <div>
              <label className="label">Full Address</label>
              <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} className="input" placeholder="e.g., MG Road, Near Park" />
            </div>
            <div>
              <label className="label">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="input" placeholder="e.g., Mumbai" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Assigning...' : 'Assign Driver'}</button>
          </>
        )}
      </form>
    </Modal>
  );
}

// ============ Assign Report to Driver Modal ============
function AssignReportModal({ open, onClose, report, drivers, onAssign }: {
  open: boolean; onClose: () => void; report: WasteReport | null; drivers: Profile[]; onAssign: (reportId: string, driverId: string) => void;
}) {
  const [driverId, setDriverId] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Assign Report to Driver">
      <div className="space-y-4">
        {report && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-900">{REPORT_TYPES.find(t => t.id === report.type)?.label}</p>
            {report.description && <p className="mt-1 text-slate-600">{report.description}</p>}
            {report.address && <p className="mt-1 text-xs text-slate-400">{report.address}</p>}
          </div>
        )}
        {drivers.length === 0 ? (
          <p className="text-sm text-slate-500">No drivers registered yet.</p>
        ) : (
          <>
            <div>
              <label className="label">Select Driver</label>
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="input">
                <option value="">Select driver...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <button
              disabled={!driverId || !report}
              onClick={() => report && onAssign(report.id, driverId)}
              className="btn-primary w-full"
            >
              Assign & Start
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ============ Area Modal ============
function AreaModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.from('areas').insert({ name, city });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setName(''); setCity('');
    onCreated(); onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Area">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
        <div>
          <label className="label">Area Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="e.g., Sector 22" />
        </div>
        <div>
          <label className="label">City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} required className="input" placeholder="e.g., Mumbai" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Adding...' : 'Add Area'}</button>
      </form>
    </Modal>
  );
}

// ============ Reward Modal ============
function RewardModal({ open, onClose, profiles, adminId, onCreated }: {
  open: boolean; onClose: () => void; profiles: Profile[]; adminId: string; onCreated: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const pts = parseInt(points);
    if (!pts || pts <= 0) { setError('Enter a valid point value.'); setLoading(false); return; }
    const { error } = await supabase.from('rewards').insert({
      user_id: userId, points: pts, reason, awarded_by: adminId,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    const userProfile = profiles.find(p => p.id === userId);
    if (userProfile) {
      await supabase.from('profiles').update({ points: userProfile.points + pts }).eq('id', userId);
    }
    setLoading(false);
    setUserId(''); setPoints(''); setReason('');
    onCreated(); onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Award Points">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
        <div>
          <label className="label">Select User</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} required className="input">
            <option value="">Select user...</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Points</label>
          <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} required className="input" placeholder="e.g., 50" />
        </div>
        <div>
          <label className="label">Reason</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} required className="input" placeholder="e.g., Excellent waste collection performance" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Awarding...' : 'Award Points'}</button>
      </form>
    </Modal>
  );
}
