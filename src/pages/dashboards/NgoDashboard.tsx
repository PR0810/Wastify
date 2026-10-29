import { useState, useEffect, useCallback } from 'react';
import {
  Recycle,
  Utensils,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  AlertCircle,
  Activity,
  Trash2,
  KeyRound,
  ShieldCheck,
  Lock,
  HeartHandshake,
  Coins,
  Sparkles,
  Filter,
  SlidersHorizontal,
  Building2,
  User,
  Award,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { StatCard, PageHeader, Section } from '@/components/ui/StatCard';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { supabase, type RecyclableListing, type SurplusFood, type Profile } from '@/lib/supabase';
import { WASTE_TYPES, STATUS_COLORS, formatTimeAgo } from '@/lib/constants';
import { cleanFoodDescription, extractFoodOtp } from '@/lib/foodOtp';
import {
  NGO_CATEGORIES,
  extractNgoCategories,
  formatNgoAddress,
  cleanNgoAddress,
  extractListingCategory,
  extractListingPoints,
  formatListingDescription,
  cleanListingDescription,
} from '@/lib/ngoCategories';

export function NgoDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'recyclable' | 'food'>('recyclable');
  const [recyclables, setRecyclables] = useState<(RecyclableListing & { citizen: Profile })[]>([]);
  const [foodListings, setFoodListings] = useState<(SurplusFood & { citizen: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  // Category filter state for recyclables: 'matched' (default) vs 'all'
  const [categoryFilter, setCategoryFilter] = useState<'matched' | 'all'>('matched');

  // NGO Categories Profile modal
  const [showEditCategoriesModal, setShowEditCategoriesModal] = useState(false);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editAddress, setEditAddress] = useState('');
  const [savingCategories, setSavingCategories] = useState(false);

  // Award Points to Citizen Modal state
  const [awardModalItem, setAwardModalItem] = useState<(RecyclableListing & { citizen: Profile }) | null>(null);
  const [awardPointsInput, setAwardPointsInput] = useState<string>('');
  const [awardSubmitting, setAwardSubmitting] = useState(false);

  // OTP Verification Modal state for food donations
  const [otpModalFood, setOtpModalFood] = useState<(SurplusFood & { citizen: Profile }) | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Extract NGO categories registered in address or fallback
  const myCategories = extractNgoCategories(profile?.address);

  useEffect(() => {
    if (profile) {
      setEditCategories(extractNgoCategories(profile.address));
      setEditAddress(cleanNgoAddress(profile.address));
    }
  }, [profile]);

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

  // Check if a recyclable listing matches this NGO / Dealer's categories
  function isListingMatched(item: RecyclableListing): boolean {
    const cat = extractListingCategory(item);
    if (myCategories.includes('scrap shop and dealer') || myCategories.includes('other')) return true;
    return myCategories.includes(cat);
  }

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

  // Handle Awarding Points to Citizen upon collection
  async function handleConfirmAwardPoints(e: React.FormEvent) {
    e.preventDefault();
    if (!awardModalItem || !profile) return;
    setAwardSubmitting(true);

    const pts = parseInt(awardPointsInput, 10) || 0;
    const catId = extractListingCategory(awardModalItem);
    const catObj = NGO_CATEGORIES.find(c => c.id === catId);
    const cleanDesc = cleanListingDescription(awardModalItem.description);
    const updatedDesc = formatListingDescription(catId, cleanDesc, pts);

    // 1. Update listing status to collected with recorded points in description
    await supabase
      .from('recyclable_listings')
      .update({
        status: 'collected',
        accepted_by: profile.id,
        description: updatedDesc,
      })
      .eq('id', awardModalItem.id);

    // 2. Award points directly to citizen profile
    if (pts > 0) {
      try {
        const citizenCurrentPoints = awardModalItem.citizen?.points || 0;
        await supabase
          .from('profiles')
          .update({ points: citizenCurrentPoints + pts })
          .eq('id', awardModalItem.citizen_id);
      } catch (err) {
        console.warn('Profile points update note:', err);
      }

      // 3. Log transaction in rewards table
      try {
        await supabase.from('rewards').insert({
          user_id: awardModalItem.citizen_id,
          points: pts,
          reason: `Sold ${awardModalItem.quantity_kg}kg ${catObj?.label || 'recyclable'} waste to ${profile.full_name}`,
          awarded_by: profile.id,
        });
      } catch (err) {
        console.warn('Rewards log note:', err);
      }
    }

    setAwardSubmitting(false);
    setAwardModalItem(null);
    setAwardPointsInput('');
    loadData();
  }

  // Handle saving updated NGO categories
  async function handleSaveCategories(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSavingCategories(true);
    const formatted = formatNgoAddress(editCategories, editAddress);
    await supabase.from('profiles').update({ address: formatted }).eq('id', profile.id);
    await refreshProfile();
    setSavingCategories(false);
    setShowEditCategoriesModal(false);
  }

  async function handleVerifyOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpModalFood) return;
    setOtpError(null);

    const expectedOtp = extractFoodOtp(otpModalFood.description, otpModalFood.id);
    if (enteredOtp.trim() !== expectedOtp.trim()) {
      setOtpError('Invalid OTP! Please ask the citizen for the 4-digit code shown on their Wastify dashboard.');
      return;
    }

    setVerifying(true);
    await updateFood(otpModalFood.id, 'collected');
    setVerifying(false);
    setOtpModalFood(null);
    setEnteredOtp('');
    setOtpError(null);
  }

  if (!profile) return <Spinner label="Loading..." />;

  const matchedRecyclables = recyclables.filter(isListingMatched);
  const displayRecyclables = categoryFilter === 'matched' ? matchedRecyclables : recyclables;
  const availableMatched = matchedRecyclables.filter(r => r.status === 'available').length;

  const availableRecyc = recyclables.filter(r => r.status === 'available').length;
  const collectedRecyc = recyclables.filter(r => r.status === 'collected').length;
  const availableFood = foodListings.filter(f => f.status === 'available').length;
  const collectedFood = foodListings.filter(f => f.status === 'collected').length;

  return (
    <DashboardLayout>
      <PageHeader
        title={`NGO / Scrap Dealer: ${profile.full_name || 'Partner'}`}
        subtitle="Collect citizen recyclable waste, purchase scrap materials, and award reward points."
      />

      {/* Specialization Categories Card */}
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/90 p-4 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs">
                <Building2 className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-emerald-950">
                Registered Waste Specializations ({myCategories.length})
              </h3>
            </div>
            <p className="text-xs text-emerald-800 mt-1 leading-snug">
              You will automatically receive targeted notifications when citizens sell waste in these categories:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {myCategories.map((catId) => {
                const catObj = NGO_CATEGORIES.find(c => c.id === catId);
                return (
                  <span
                    key={catId}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-200 shadow-xs"
                  >
                    <span>{catObj?.icon || '♻️'}</span>
                    <span>{catObj?.label || catId}</span>
                  </span>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowEditCategoriesModal(true)}
            className="self-start sm:self-center shrink-0 rounded-xl bg-white border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>Edit Categories</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Coins} label="Matching Sell Requests" value={availableMatched} color="teal" />
        <StatCard icon={CheckCircle2} label="Waste Collected" value={collectedRecyc} color="green" />
        <StatCard icon={Utensils} label="Available Food Donations" value={availableFood} color="orange" />
        <StatCard icon={CheckCircle2} label="Food Rescued" value={collectedFood} color="green" />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'recyclable', label: `💰 Citizen Waste Sell Requests (${availableRecyc})` },
          { id: 'food', label: `🍲 Surplus Food Donations (${availableFood})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
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
            <div className="space-y-4">
              {/* Category Filter and Notification Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
                    <Filter className="h-3.5 w-3.5 text-emerald-600" /> Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('matched')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      categoryFilter === 'matched'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🎯 Matching My Specialization ({matchedRecyclables.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🌐 All Requests ({recyclables.length})
                  </button>
                </div>
                {availableMatched > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl self-start sm:self-auto">
                    🔔 {availableMatched} request{availableMatched > 1 ? 's' : ''} matching your categories!
                  </span>
                )}
              </div>

              {displayRecyclables.length === 0 ? (
                <EmptyState
                  icon={<Recycle className="h-10 w-10 text-emerald-600" />}
                  title={categoryFilter === 'matched' ? "No requests matching your categories right now" : "No recyclable listings"}
                  message={
                    categoryFilter === 'matched'
                      ? "When citizens list waste in your registered categories, they will appear here. You can also switch to 'All Requests' above."
                      : "Citizen recyclable listings will appear here for pickup."
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayRecyclables.map((item) => {
                    const catId = extractListingCategory(item);
                    const catObj = NGO_CATEGORIES.find(c => c.id === catId) || {
                      id: catId,
                      label: catId.toUpperCase(),
                      icon: '♻️',
                      suggestedRate: 10,
                      description: '',
                    };
                    const isMatched = isListingMatched(item);
                    const cleanDesc = cleanListingDescription(item.description);
                    const awardedPts = extractListingPoints(item.description);

                    let statusBadgeLabel = item.status;
                    let statusBadgeClass = STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-700';
                    if (item.status === 'available') {
                      statusBadgeLabel = 'Available for Pickup';
                      statusBadgeClass = 'bg-teal-100 text-teal-800 border-teal-200';
                    } else if (item.status === 'accepted') {
                      statusBadgeLabel = item.accepted_by === profile.id ? 'Assigned to You' : 'Accepted';
                      statusBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                    } else if (item.status === 'collected') {
                      statusBadgeLabel = 'Collected & Points Awarded';
                      statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    }

                    return (
                      <div
                        key={item.id}
                        className={`card-hover rounded-2xl border p-5 shadow-xs transition-all bg-white ${
                          isMatched ? 'border-emerald-300 ring-1 ring-emerald-200/60' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{catObj.icon}</span>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{catObj.label}</p>
                              <p className="text-xs text-slate-400">
                                Seller: <strong>{item.citizen?.full_name ?? 'Citizen'}</strong> · {formatTimeAgo(item.created_at)}
                              </p>
                            </div>
                          </div>
                          <span className={`badge font-semibold ${statusBadgeClass}`}>{statusBadgeLabel}</span>
                        </div>

                        {/* Match indicator pill */}
                        {isMatched && (
                          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
                            <span>🎯 Matches your category: {catObj.label}</span>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="badge bg-slate-100 text-slate-900 font-bold py-1 px-2.5">
                            ⚖️ {item.quantity_kg > 0 ? `${item.quantity_kg} kg` : 'Quantity not specified'}
                          </span>
                          <span className="badge bg-amber-50 text-amber-900 border border-amber-200 font-semibold py-1 px-2.5">
                            💰 Standard Rate: ~{catObj.suggestedRate} pts/kg
                          </span>
                        </div>

                        {cleanDesc && (
                          <p className="mt-2.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl italic">
                            "{cleanDesc}"
                          </p>
                        )}

                        {item.address && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                        )}

                        {item.latitude && item.longitude && (
                          <div className="mt-1 text-[10px] text-slate-400 font-mono pl-5">
                            GPS Coordinates: {item.latitude.toFixed(5)}°, {item.longitude.toFixed(5)}°
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {item.status === 'available' && (
                            <button
                              type="button"
                              onClick={() => updateRecyclable(item.id, 'accepted')}
                              className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Accept & Schedule Pickup</span>
                            </button>
                          )}

                          {item.status === 'accepted' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAwardModalItem(item);
                                const defaultPts = Math.round((item.quantity_kg || 1) * catObj.suggestedRate);
                                setAwardPointsInput(defaultPts > 0 ? defaultPts.toString() : '50');
                              }}
                              className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xs cursor-pointer"
                            >
                              <Coins className="h-4 w-4" />
                              <span>Collect & Award Points to Citizen</span>
                            </button>
                          )}

                          {item.status === 'collected' && (
                            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 flex items-center justify-between text-xs font-semibold text-emerald-900">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Waste Collected & Verified
                              </span>
                              {awardedPts > 0 && (
                                <span className="font-mono font-black text-xs text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                                  +{awardedPts} Points Credited
                                </span>
                              )}
                            </div>
                          )}
                        </div>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {foodListings.map((food) => {
                    const cleanDesc = cleanFoodDescription(food.description);
                    const isAssignedToMe = food.accepted_by === profile.id;

                    let statusBadgeLabel = food.status;
                    let statusBadgeClass = STATUS_COLORS[food.status];
                    if (food.status === 'accepted') {
                      statusBadgeLabel = isAssignedToMe ? 'Assigned to You' : 'Assigned';
                      statusBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                    } else if (food.status === 'collected') {
                      statusBadgeLabel = 'Collected / Done';
                      statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    }

                    return (
                      <div key={food.id} className="card-hover rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{food.food_type}</p>
                              <p className="text-xs text-slate-400">by {food.citizen?.full_name ?? 'Citizen'} · {formatTimeAgo(food.created_at)}</p>
                            </div>
                          </div>
                          <span className={`badge border font-semibold ${statusBadgeClass}`}>
                            {statusBadgeLabel}
                          </span>
                        </div>

                        {food.quantity && <p className="mt-2 text-sm text-slate-600 font-medium">Quantity: {food.quantity}</p>}
                        {cleanDesc && <p className="mt-1 text-sm text-slate-500 italic">"{cleanDesc}"</p>}
                        {food.preparation_time && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" /> Prepared: {new Date(food.preparation_time).toLocaleString()}
                          </div>
                        )}
                        {food.address && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> {food.address}
                          </div>
                        )}
                        {food.latitude && food.longitude && (
                          <div className="mt-1 text-[11px] text-slate-400 font-mono pl-5">
                            GPS: {food.latitude.toFixed(5)}, {food.longitude.toFixed(5)}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {food.status === 'available' && (
                            <div className="flex gap-2">
                              <button onClick={() => updateFood(food.id, 'accepted')} className="btn-primary text-xs">
                                Accept & Assign to Me
                              </button>
                              <button onClick={() => updateFood(food.id, 'rejected')} className="btn-danger text-xs">
                                Reject
                              </button>
                            </div>
                          )}

                          {food.status === 'accepted' && (
                            <div>
                              <button
                                onClick={() => {
                                  setOtpModalFood(food);
                                  setEnteredOtp('');
                                  setOtpError(null);
                                }}
                                className="btn-primary text-xs py-2 px-3 w-full justify-center flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <KeyRound className="h-4 w-4" />
                                <span>Complete Pickup (Enter Citizen OTP)</span>
                              </button>
                              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                                Ask the citizen for the 4-digit code shown on their screen
                              </p>
                            </div>
                          )}

                          {food.status === 'collected' && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>Food successfully collected & verified via Citizen OTP</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Award Points to Citizen Modal */}
      {awardModalItem && (
        <Modal
          open={Boolean(awardModalItem)}
          onClose={() => setAwardModalItem(null)}
          title="Award Reward Points to Citizen for Waste Collection"
        >
          <form onSubmit={handleConfirmAwardPoints} className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-900">
                  {extractListingCategory(awardModalItem).toUpperCase()} Waste Collection
                </span>
                <span className="badge bg-emerald-200 text-emerald-900 font-bold">
                  {awardModalItem.quantity_kg > 0 ? `${awardModalItem.quantity_kg} kg` : 'Quantity Item'}
                </span>
              </div>
              <p>
                Selling Citizen: <strong>{awardModalItem.citizen?.full_name || 'Citizen'}</strong>
              </p>
              <p className="text-slate-600">
                📍 {awardModalItem.address}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed">
              🪙 <strong>Citizen Points Reward:</strong> As the purchasing scrap dealer / NGO partner, enter the reward points you are granting to the citizen in return for this collected waste material.
            </div>

            <div>
              <label className="label">Reward Points to Credit Citizen</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={awardPointsInput}
                  onChange={(e) => setAwardPointsInput(e.target.value)}
                  className="input font-mono text-xl font-bold pl-10"
                  placeholder="e.g. 100"
                />
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Points will be instantly credited to the citizen's balance and reflected on their leaderboard and rewards dashboard.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAwardModalItem(null)}
                className="btn-secondary flex-1 justify-center text-xs"
                disabled={awardSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={awardSubmitting || !awardPointsInput}
                className="btn-primary flex-1 justify-center text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Award className="h-4 w-4" />
                <span>{awardSubmitting ? 'Crediting...' : 'Confirm & Credit Points'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Specialization Categories Modal */}
      {showEditCategoriesModal && (
        <Modal
          open={showEditCategoriesModal}
          onClose={() => setShowEditCategoriesModal(false)}
          title="Manage NGO / Scrap Dealer Specializations"
        >
          <form onSubmit={handleSaveCategories} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Select Categories You Collect ({editCategories.length})</label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditCategories(NGO_CATEGORIES.map(c => c.id))}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setEditCategories([])}
                    className="text-slate-500 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {NGO_CATEGORIES.map((cat) => {
                  const isSelected = editCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setEditCategories(editCategories.filter(c => c !== cat.id));
                        } else {
                          setEditCategories([...editCategories, cat.id]);
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-xl border p-2 text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">Shop / Office Address</label>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="input"
                placeholder="e.g. Shop 42, Kabadi Market, Sector 12"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditCategoriesModal(false)}
                className="btn-secondary flex-1"
                disabled={savingCategories}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCategories || editCategories.length === 0}
                className="btn-primary flex-1"
              >
                {savingCategories ? 'Saving...' : 'Save Specializations'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Citizen OTP Verification Modal for Food Rescue */}
      {otpModalFood && (
        <Modal
          open={Boolean(otpModalFood)}
          onClose={() => { setOtpModalFood(null); setOtpError(null); }}
          title="Verify Citizen OTP & Complete Collection"
        >
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{otpModalFood.food_type}</span>
                <span className="badge bg-amber-100 text-amber-800 font-semibold">{otpModalFood.quantity || 'N/A'}</span>
              </div>
              <p>Donor: <strong className="text-slate-900">{otpModalFood.citizen?.full_name || 'Citizen'}</strong></p>
              <p className="text-emerald-800 font-medium">📍 {otpModalFood.address}</p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1 text-blue-950 mb-1">
                <Lock className="h-3.5 w-3.5 text-blue-700" />
                Citizen Verification Required
              </p>
              Please collect the physical food package and ask the citizen (<strong>{otpModalFood.citizen?.full_name || 'Donor'}</strong>) for the <strong>4-digit Pickup Verification OTP</strong> displayed on their Wastify dashboard.
            </div>

            {otpError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div>
              <label className="label text-center block mb-1">Enter 4-Digit Citizen OTP</label>
              <input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                required
                autoFocus
                className="input text-center font-mono text-2xl tracking-widest font-black py-2.5 max-w-[200px] mx-auto block"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpModalFood(null)}
                className="btn-secondary flex-1 justify-center text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={enteredOtp.length < 4 || verifying}
                className="btn-primary flex-1 justify-center text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{verifying ? 'Verifying...' : 'Verify OTP & Complete'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
