import { toISODateString } from "@/lib/format";

/**
 * Validates e-mail format. Lightweight "user@domain.tld" shape check, no
 * external dependency — the same pattern every form in the app used to
 * duplicate inline; centralized here so it can't drift between forms.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates a Brazilian phone/WhatsApp number: 10 digits (DDD + 8, landline)
 * or 11 digits (DDD + 9, mobile).
 */
export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

/**
 * Validates Brazilian CPF (11 digits) with check digit verification.
 */
export function validateCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  let remainder = 0;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;

  return true;
}

/**
 * Validates Brazilian CNPJ (14 digits) with check digit verification.
 */
export function validateCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Validates either CPF (11 digits) or CNPJ (14 digits).
 */
export function validateCpfOrCnpj(value: string): boolean {
  const clean = value.replace(/\D/g, "");
  if (clean.length === 11) return validateCpf(clean);
  if (clean.length === 14) return validateCnpj(clean);
  return false;
}

/**
 * Formats strictly as CPF (000.000.000-00), max 11 digits.
 */
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formats strictly as CNPJ (00.000.000/0000-00), max 14 digits.
 */
export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Formats a string dynamically as CPF (000.000.000-00) or CNPJ (00.000.000/0000-00).
 */
export function formatCpfOrCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return formatCpf(digits);
  } else {
    return formatCnpj(digits);
  }
}

/**
 * Formats CEP as 00000-000 and limits to 8 numeric digits max (9 characters formatted).
 */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Formats Phone as (00) 00000-0000 or (00) 0000-0000.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Formats YYYY-MM-DD or ISO string to Brazilian format DD/MM/YYYY.
 *
 * Passa por `toISODateString` para também dar conta de datas legadas em inglês
 * ainda guardadas no localStorage de quem já estava logado — antes elas caíam
 * no retorno bruto e apareciam como "Fri Apr 23 2004 00:00:00 GM" na tela.
 */
export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return "";

  const iso = toISODateString(dateStr);
  if (iso === "") return "";

  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export type CardBrand = "visa" | "master" | "amex" | "elo" | "hipercard";

// Official Elo BIN ranges. Elo shares prefixes with Visa (4xxxxx) and Mastercard (5xxxxx),
// so these must be checked BEFORE the generic Visa/Master prefix checks below.
const ELO_BIN_RANGES: [number, number][] = [
  [401178, 401178],
  [401179, 401179],
  [431274, 431274],
  [438935, 438935],
  [451416, 451416],
  [457393, 457393],
  [457631, 457632],
  [504175, 504175],
  [506699, 506778],
  [509000, 509999],
  [627780, 627780],
  [636297, 636297],
  [636368, 636368],
  [650031, 650033],
  [650035, 650051],
  [650405, 650439],
  [650485, 650538],
  [650541, 650598],
  [650700, 650718],
  [650720, 650727],
  [650901, 650920],
  [651652, 651679],
  [655000, 655019],
  [655021, 655058],
];

const HIPERCARD_BIN_PREFIXES = ["606282", "384100", "384140", "384160"];

/**
 * Detects card brand from BIN (first digits), or null when there aren't
 * enough recognizable digits yet — used to drive the brand icon in the
 * checkout UI, where showing nothing is better than guessing wrong.
 */
export function detectCardBrandOrNull(cardNumber: string): CardBrand | null {
  const clean = cardNumber.replace(/\D/g, "");
  if (!clean) return null;

  const bin6 = parseInt(clean.slice(0, 6), 10);

  if (ELO_BIN_RANGES.some(([start, end]) => bin6 >= start && bin6 <= end)) return "elo";
  if (HIPERCARD_BIN_PREFIXES.some((p) => clean.startsWith(p))) return "hipercard";
  if (/^4/.test(clean)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(clean)) return "master";
  if (/^3[47]/.test(clean)) return "amex";
  return null;
}

/** Detects card brand from BIN, defaulting to "visa" when unrecognized (used for tokenization/payment logic, where a concrete brand is always required). */
export function detectCardBrand(cardNumber: string): CardBrand {
  return detectCardBrandOrNull(cardNumber) ?? "visa";
}

/** Amex uses 15 digits; every other brand supported here uses 16. */
export function cardNumberLengthForBrand(brand: CardBrand): number {
  return brand === "amex" ? 15 : 16;
}

/**
 * Formats a card number with brand-aware grouping: 4-6-5 for Amex,
 * 4-4-4-4 for every other supported brand, capped at the brand's length.
 */
export function formatCardNumber(value: string): string {
  const rawDigits = value.replace(/\D/g, "");
  const brand = detectCardBrand(rawDigits);
  const digits = rawDigits.slice(0, cardNumberLengthForBrand(brand));

  if (brand === "amex") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }

  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Luhn (mod 10) checksum, the standard check-digit algorithm for card numbers. */
export function isValidCardNumberLuhn(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/** Validates a card number: correct length for its detected brand + Luhn checksum. */
export function validateCardNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const brand = detectCardBrand(digits);
  if (digits.length !== cardNumberLengthForBrand(brand)) return false;
  return isValidCardNumberLuhn(digits);
}

/**
 * Validates card expiry in MM/YY format: month must be 1-12, and the card
 * must not already be expired (valid through the last day of that month).
 */
export function validateCardExpiry(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  if (month < 1 || month > 12) return false;

  const fullYear = 2000 + parseInt(match[2], 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (fullYear < currentYear) return false;
  if (fullYear === currentYear && month < currentMonth) return false;

  return true;
}
