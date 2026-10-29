import { useState, useEffect, useCallback } from 'react';
import { Recycle, Utensils, MapPin, Clock, CheckCircle2, Package, AlertCircle, Activity, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard, PageHeader, Section } from '@/components/ui/StatCard';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { supabase, type RecyclableListing, type SurplusFood, type Profile } from '@/lib/supabase';
import { WASTE_TYPES, STATUS_COLORS, formatTimeAgo } from '@/lib/constants';

export function NgoDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'recyclable' | 'food'>('recyclable');
  const [recyclables, setRecyclables] = useState<(RecyclableListing & { citizen: Profile })[]>([]);
  const [foodListings, setFoodListings] = useState<(SurplusFood & { citizen: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [recycRes, foodRes] = await Promise.all([
      supabase.from('recyclable_listings').select('*, citizen:profiles!recyclable_listings_citizen_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('surplus_food').select('*, citizen:profiles!surplus_food_citizen_id_fkey(*)').order('created_at', { ascending: false }),
    ]);
    setRecyclables((recycRes.data as (RecyclableListing & { citizen: Profile })[]) ?? []);
    setFoodListings((foodRes.data as (SurplusFood & { citizen: Profile })[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    function handleSwitchTab(e: Event) {
      const customEvent = e as CustomEvent<{ tab: string }>;
      const tab = customEvent.detail?.tab;
      if (tab === 'food') setActiveTab('food');
      if (tab === 'recyclable' || tab === 'recyclables') setActiveTab('recyclable');
    }
    window.addEventListener('ngo-switch-tab', handleSwitchTab);

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'food') setActiveTab('food');
    if (tabParam === 'recyclable' || tabParam === 'recyclables') setActiveTab('recyclable');

    return () => window.removeEventListener('ngo-switch-tab', handleSwitchTab);
  }, []);

  async function updateRecyclable(id: string, status: RecyclableListing['status']) {
    const update: Record<string, unknown> = { status };
    if (status === 'accepted' && profile) update.accepted_by = profile.id;
    await supabase.from('recyclable_listings').update(update).eq('id', id);
    loadData();
  }

  async function updateFood(id: string, status: SurplusFood['status']) {
    const update: Record<string, unknown> = { status };
    if (status === 'accepted' && profile) update.accepted_by = profile.id;
    await supabase.from('surplus_food').update(update).eq('id', id);
    loadData();
  }

  if (!profile) return <Spinner label="Loading..." />;

  const availableRecyc = recyclables.filter(r => r.status === 'available').length;
  const collectedRecyc = recyclables.filter(r => r.status === 'collected').length;
  const availableFood = foodListings.filter(f => f.status === 'available').length;
  const collectedFood = foodListings.filter(f => f.status === 'collected').length;

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: <Recycle className="h-4.5 w-4.5" /> },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={`NGO / Recycler: ${profile.full_name || 'Partner'}`}
        subtitle="Collect recyclable waste and surplus food from citizens."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Package} label="Available Recyclables" value={availableRecyc} color="teal" />
        <StatCard icon={CheckCircle2} label="Collected" value={collectedRecyc} color="green" />
        <StatCard icon={Utensils} label="Available Food" value={availableFood} color="orange" />
        <StatCard icon={CheckCircle2} label="Food Collected" value={collectedFood} color="green" />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-slate-200">
        {[
          { id: 'recyclable', label: 'Recyclable Waste' },
          { id: 'food', label: 'Surplus Food' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading listings..." />
      ) : (
        <div className="mt-6">
          {activeTab === 'recyclable' && (
            <div>
              {recyclables.length === 0 ? (
                <EmptyState icon={<Recycle className="h-10 w-10" />} title="No recyclable listings" message="Citizen recyclable listings will appear here for pickup." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recyclables.map((item) => {
                    const wasteType = WASTE_TYPES.find(t => t.id === item.waste_type);
                    return (
                      <div key={item.id} className="card-hover p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{wasteType?.icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{wasteType?.label ?? item.waste_type}</p>
                              <p className="text-xs text-slate-400">by {item.citizen?.full_name ?? 'Citizen'} · {formatTimeAgo(item.created_at)}</p>
                            </div>
                          </div>
                          <span className={`badge ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                        </div>
                        {item.quantity_kg > 0 && <p className="mt-2 text-sm text-slate-600">{item.quantity_kg} kg</p>}
                        {item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}
                        {item.address && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" /> {item.address}</div>
                        )}
                        {item.status === 'available' && (
                          <button onClick={() => updateRecyclable(item.id, 'accepted')} className="btn-primary mt-3 text-xs">
                            Accept & Collect
                          </button>
                        )}
                        {item.status === 'accepted' && (
                          <button onClick={() => updateRecyclable(item.id, 'collected')} className="btn-primary mt-3 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Collected
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'food' && (
            <div>
              {foodListings.length === 0 ? (
                <EmptyState icon={<Utensils className="h-10 w-10" />} title="No food donations" message="Citizen surplus food listings will appear here." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {foodListings.map((food) => (
                    <div key={food.id} className="card-hover p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{food.food_type}</p>
                            <p className="text-xs text-slate-400">by {food.citizen?.full_name ?? 'Citizen'} · {formatTimeAgo(food.created_at)}</p>
                          </div>
                        </div>
                        <span className={`badge ${STATUS_COLORS[food.status]}`}>{food.status}</span>
                      </div>
                      {food.quantity && <p className="mt-2 text-sm text-slate-600">Quantity: {food.quantity}</p>}
                      {food.description && <p className="mt-1 text-sm text-slate-500">{food.description}</p>}
                      {food.preparation_time && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" /> Prepared: {new Date(food.preparation_time).toLocaleString()}
                        </div>
                      )}
                      {food.address && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" /> {food.address}</div>
                      )}
                      {food.status === 'available' && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => updateFood(food.id, 'accepted')} className="btn-primary text-xs">
                            Accept
                          </button>
                          <button onClick={() => updateFood(food.id, 'rejected')} className="btn-danger text-xs">
                            Reject
                          </button>
                        </div>
                      )}
                      {food.status === 'accepted' && (
                        <button onClick={() => updateFood(food.id, 'collected')} className="btn-primary mt-3 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Collected
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
