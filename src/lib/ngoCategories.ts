export interface NgoCategory {
  id: string;
  label: string;
  icon: string;
  suggestedRate: number; // Suggested points per kg
  description: string;
}

export const NGO_CATEGORIES: NgoCategory[] = [
  { id: 'food', label: 'Food', icon: '🍲', suggestedRate: 15, description: 'Surplus food rescue & community donations' },
  { id: 'plastic', label: 'Plastic', icon: '🧴', suggestedRate: 10, description: 'PET bottles, containers, polythene & hard plastics' },
  { id: 'paper', label: 'Paper', icon: '📄', suggestedRate: 8, description: 'Newspapers, office paper, books & documents' },
  { id: 'cardboard', label: 'Cardboard', icon: '📦', suggestedRate: 7, description: 'Cartons, corrugated boxes & packaging sheets' },
  { id: 'e-waste', label: 'E-Waste', icon: '🔌', suggestedRate: 30, description: 'Old electronics, circuit boards, wires & appliances' },
  { id: 'cloth and textile', label: 'Cloth and Textile', icon: '👕', suggestedRate: 12, description: 'Old clothes, fabrics, garments & curtains' },
  { id: 'metal', label: 'Metal', icon: '🥫', suggestedRate: 25, description: 'Iron, steel, aluminum cans, copper & brass' },
  { id: 'scrap shop and dealer', label: 'Scrap Shop and Dealer', icon: '🏪', suggestedRate: 15, description: 'All mixed scrap materials & kabadi items' },
  { id: 'glass', label: 'Glass', icon: '🍾', suggestedRate: 6, description: 'Glass bottles, jars & broken cullet' },
  { id: 'hazardous', label: 'Hazardous', icon: '⚠️', suggestedRate: 20, description: 'Paints, chemicals & sensitive hazardous waste' },
  { id: 'hair', label: 'Hair', icon: '💇', suggestedRate: 20, description: 'Salon human hair & organic protein waste' },
  { id: 'garden & agri-waste', label: 'Garden & Agri-Waste', icon: '🍂', suggestedRate: 5, description: 'Dry leaves, twigs, grass clippings & agro-waste' },
  { id: 'rubber & footwear', label: 'Rubber & Footwear', icon: '👟', suggestedRate: 10, description: 'Tires, rubber products, old shoes & chappals' },
  { id: 'wood', label: 'Wood', icon: '🪵', suggestedRate: 6, description: 'Furniture scrap, wood chips & timber pieces' },
  { id: 'battery', label: 'Battery', icon: '🔋', suggestedRate: 35, description: 'Lead-acid, inverter, lithium & dry-cell batteries' },
  { id: 'other', label: 'Other', icon: '♻️', suggestedRate: 10, description: 'General recyclables and mixed recyclables' },
];

/**
 * Extracts selected NGO categories from an address or metadata string
 */
export function extractNgoCategories(addressOrText: string | null | undefined): string[] {
  if (!addressOrText) return NGO_CATEGORIES.map(c => c.id);
  const match = addressOrText.match(/\[Categories:\s*([^\]]+)\]/i);
  if (!match) return NGO_CATEGORIES.map(c => c.id);
  return match[1]
    .split(',')
    .map(c => c.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Formats an NGO address string by embedding categories
 */
export function formatNgoAddress(categories: string[], address: string = ''): string {
  const catTag = `[Categories: ${categories.join(', ')}]`;
  const clean = cleanNgoAddress(address);
  return clean ? `${catTag} ${clean}` : catTag;
}

/**
 * Removes category metadata tag from address
 */
export function cleanNgoAddress(addressOrText: string | null | undefined): string {
  if (!addressOrText) return '';
  return addressOrText.replace(/\[Categories:\s*[^\]]+\]/gi, '').trim();
}

/**
 * Maps any of the 16 categories into the existing Supabase CHECK constraint
 */
export function mapCategoryToWasteType(category: string): 'plastic' | 'paper' | 'cardboard' | 'cloth' | 'metal' | 'e_waste' | 'organic' | 'other' {
  switch (category.toLowerCase()) {
    case 'food':
    case 'garden & agri-waste':
      return 'organic';
    case 'plastic':
      return 'plastic';
    case 'paper':
      return 'paper';
    case 'cardboard':
      return 'cardboard';
    case 'e-waste':
    case 'battery':
      return 'e_waste';
    case 'cloth and textile':
      return 'cloth';
    case 'metal':
      return 'metal';
    default:
      return 'other';
  }
}

/**
 * Extracts category from a recyclable listing description or falls back to waste_type
 */
export function extractListingCategory(listing: { waste_type?: string; description?: string }): string {
  if (listing.description) {
    const match = listing.description.match(/\[Category:\s*([^\]]+)\]/i);
    if (match) return match[1].trim().toLowerCase();
  }
  if (listing.waste_type) {
    if (listing.waste_type === 'cloth') return 'cloth and textile';
    if (listing.waste_type === 'e_waste') return 'e-waste';
    if (listing.waste_type === 'organic') return 'garden & agri-waste';
    return listing.waste_type.toLowerCase();
  }
  return 'other';
}

/**
 * Formats recyclable listing description with category and optional points
 */
export function formatListingDescription(category: string, description: string = '', points?: number): string {
  const clean = cleanListingDescription(description);
  let res = `[Category: ${category}]`;
  if (points && points > 0) {
    res += ` [Points: ${points}]`;
  }
  return clean ? `${res} ${clean}` : res;
}

/**
 * Cleans metadata tags from recyclable listing description
 */
export function cleanListingDescription(description: string | null | undefined): string {
  if (!description) return '';
  return description
    .replace(/\[Category:\s*[^\]]+\]/gi, '')
    .replace(/\[Points:\s*\d+\]/gi, '')
    .trim();
}

/**
 * Extracts points awarded from listing description
 */
export function extractListingPoints(description: string | null | undefined): number {
  if (!description) return 0;
  const match = description.match(/\[Points:\s*(\d+)\]/i);
  return match ? parseInt(match[1], 10) : 0;
}
