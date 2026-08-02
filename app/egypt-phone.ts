const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";

function toEnglishDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndicIndex = arabicIndicDigits.indexOf(digit);
    if (arabicIndicIndex >= 0) return String(arabicIndicIndex);
    return String(easternArabicDigits.indexOf(digit));
  });
}

export function normalizeEgyptianMobile(value: string) {
  const digits = toEnglishDigits(value).replace(/\D/g, "");
  let localNumber = digits;

  if (digits.startsWith("0020")) {
    localNumber = `0${digits.slice(4)}`;
  } else if (digits.startsWith("20")) {
    localNumber = `0${digits.slice(2)}`;
  }

  if (/^1\d{9}$/.test(localNumber)) {
    localNumber = `0${localNumber}`;
  }

  return /^01\d{9}$/.test(localNumber) ? localNumber : null;
}
