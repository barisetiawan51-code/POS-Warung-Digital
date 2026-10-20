// ==============================================================================
// WARUNGKU - LOCALE AND FORMATTING UTILITIES (INDONESIAN LOCALE)
// ==============================================================================

/**
 * Format number into Indonesian Rupiah format: Rp 1.064.500
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "Rp 0";
  }

  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat("id-ID").format(rounded);
  return `Rp ${formatted}`;
}

/**
 * Format quantity with decimal units if needed: 1 kg, 3 pcs, 2.5 kg
 */
export function formatQuantity(qty: number, unit: string = "pcs"): string {
  const formatted = Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
  return `${formatted} ${unit}`;
}

/**
 * Format date string into Indonesian format: 17 Oktober 2026
 */
export function formatDateIndonesian(
  dateInput: string | Date | number,
): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Format date and time: 17 Okt 2026, 14:30
 */
export function formatDateTimeIndonesian(
  dateInput: string | Date | number,
): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";

  const datePart = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${datePart}, ${timePart} WIB`;
}

/**
 * Short date: 17/10
 */
export function formatShortDate(dateInput: string | Date | number): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
}

/**
 * Generate unique Invoice Number: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}${day}-${randomSuffix}`;
}
