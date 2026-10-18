/**
 * Currency utility functions for SelectBot
 * Configured for South African rand (ZAR / R)
 */

export const DEFAULT_CURRENCY = 'ZAR';
export const DEFAULT_CURRENCY_SYMBOL = 'R';
export const DEFAULT_LOCALE = 'en-ZA';

/**
 * Formats a given price string or number into South African rand format.
 * Examples:
 *   250 -> "R 250.00"
 *   "250" -> "R 250.00"
 *   "1250" -> "R 1,250.00"
 *   "R 250.00" -> "R 250.00"
 *   "$290" -> "R 290.00"
 *   "£395" -> "R 395.00"
 *   "R 95 per person" -> "R 95.00 per person"
 */
export function formatCurrency(
  input: string | number | null | undefined,
  currencySymbol = DEFAULT_CURRENCY_SYMBOL
): string {
  if (input === null || input === undefined || input === '') {
    return `${currencySymbol} 0.00`;
  }

  if (typeof input === 'number') {
    return `${currencySymbol} ${input.toLocaleString(DEFAULT_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const str = String(input).trim();

  // If already formatted with R and proper decimals, e.g. "R 250.00"
  if (/^R\s*\d+(?:,\d{3})*(?:\.\d{2})?(\s*.*)?$/i.test(str)) {
    // If it has extra suffix like "per person", handle cleanly
    const match = str.match(/^R\s*([\d,]+(?:\.\d+)?)(.*)$/i);
    if (match) {
      const numVal = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(numVal)) {
        const formattedNum = numVal.toLocaleString(DEFAULT_LOCALE, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${currencySymbol} ${formattedNum}${match[2]}`;
      }
    }
    return str;
  }

  // If contains a foreign symbol like $ or £ or €, replace with R
  const cleanStr = str.replace(/[$£€]/g, '').trim();

  // Match the leading number and any trailing phrase like "/mo" or "per person"
  const match = cleanStr.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
  if (match) {
    const numVal = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(numVal)) {
      const formattedNum = numVal.toLocaleString(DEFAULT_LOCALE, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${currencySymbol} ${formattedNum}${match[2]}`;
    }
  }

  // Fallback: prepend R if not present
  if (!cleanStr.startsWith(currencySymbol)) {
    return `${currencySymbol} ${cleanStr}`;
  }

  return cleanStr;
}
