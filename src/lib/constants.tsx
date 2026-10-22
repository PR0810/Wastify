import { Truck, Shield, Recycle, GraduationCap } from 'lucide-react';
import type { Profile } from '@/lib/supabase';

export const ROLES = [
  {
    id: 'driver' as const,
    label: 'Driver',
    icon: Truck,
    color: 'amber',
    description: 'Collect waste in your assigned area with GPS-tracked vehicles.',
  },
  {
    id: 'admin' as const,
    label: 'Administrator',
    icon: Shield,
    color: 'blue',
    description: 'Monitor the entire system, assign drivers, manage complaints.',
  },
  {
    id: 'ngo' as const,
    label: 'NGO / Recycler',
    icon: Recycle,
    color: 'green',
    description: 'Collect recyclable waste and surplus food from citizens.',
  },
  {
    id: 'citizen' as const,
    label: 'Citizen / Student',
    icon: GraduationCap,
    color: 'teal',
    description: 'Report waste, list recyclables, donate food, and learn.',
  },
] as const;

export const WASTE_TYPES = [
  { id: 'plastic', label: 'Plastic', icon: '🧴', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'paper', label: 'Paper', icon: '📄', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'cardboard', label: 'Cardboard', icon: '📦', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'cloth', label: 'Cloth', icon: '👕', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'metal', label: 'Metal', icon: '🔩', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'e_waste', label: 'E-Waste', icon: '🔌', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'organic', label: 'Organic / Wet', icon: '🍂', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'other', label: 'Other', icon: '♻️', color: 'bg-teal-100 text-teal-700 border-teal-200' },
] as const;

export const REPORT_TYPES = [
  { id: 'road_waste', label: 'Road Waste', icon: '🗑️' },
  { id: 'overflowing_bin', label: 'Overflowing Bin', icon: '🗑️' },
  { id: 'illegal_dumping', label: 'Illegal Dumping', icon: '⚠️' },
  { id: 'other', label: 'Other', icon: '📋' },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  available: 'bg-teal-100 text-teal-700 border-teal-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  collected: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function getRoleInfo(role: Profile['role']) {
  return ROLES.find((r) => r.id === role) ?? ROLES[3];
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}
