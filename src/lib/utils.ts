import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-NG").format(amount);
}

export function amountInWords(amount: number): string {
  if (!amount || amount === 0) return "Zero Naira Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertHundreds(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred";
      n %= 100;
      if (n > 0) str += " and ";
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) str += "-" + ones[n];
    } else if (n > 0) {
      str += ones[n];
    }
    return str;
  }

  const integerPart = Math.floor(Math.abs(amount));
  const kobo = Math.round((Math.abs(amount) - integerPart) * 100);

  const parts: string[] = [];

  const billions = Math.floor(integerPart / 1_000_000_000);
  let remainder = integerPart % 1_000_000_000;

  const millions = Math.floor(remainder / 1_000_000);
  remainder %= 1_000_000;

  const thousands = Math.floor(remainder / 1_000);
  remainder %= 1_000;

  if (billions > 0) {
    parts.push(convertHundreds(billions) + " Billion");
  }
  if (millions > 0) {
    parts.push(convertHundreds(millions) + " Million");
  }
  if (thousands > 0) {
    parts.push(convertHundreds(thousands) + " Thousand");
  }
  if (remainder > 0) {
    parts.push(convertHundreds(remainder));
  }

  let words = parts.join(", ") + " Naira";
  if (kobo > 0) {
    words += " and " + convertHundreds(kobo) + " Kobo";
  }
  return words + " Only";
}
