/**
 * Food Donation OTP and Description Helper Utilities
 */

export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function extractFoodOtp(description: string | null | undefined, foodId: string): string {
  if (description) {
    const match = description.match(/\[OTP:\s*([0-9]{4,6})\]/i);
    if (match) return match[1];
  }
  // Deterministic 4-digit code based on ID as fallback for legacy records
  let hash = 0;
  const str = foodId || 'wastify';
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 9000;
  }
  return String(1000 + Math.abs(hash));
}

export function cleanFoodDescription(description: string | null | undefined): string {
  if (!description) return '';
  return description.replace(/\[OTP:\s*[0-9]{4,6}\]\s*/gi, '').trim();
}
