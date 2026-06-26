import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

const E164_REGEX = /^\+[1-9][0-9]{1,14}$/;

export class PhoneParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhoneParseError";
  }
}

export function normalize(input: string, defaultCountry: CountryCode = "US"): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new PhoneParseError("Phone number is required");
  }
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    throw new PhoneParseError(`"${input}" is not a valid phone number`);
  }
  return parsed.number;
}

export function isE164(value: string): boolean {
  return E164_REGEX.test(value);
}

export function tryNormalize(input: string, defaultCountry: CountryCode = "US"): string | null {
  try {
    return normalize(input, defaultCountry);
  } catch {
    return null;
  }
}

export function validate(input: string, defaultCountry: CountryCode = "US"): boolean {
  return isValidPhoneNumber(input, defaultCountry);
}

export function format(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  return parsed?.formatNational() ?? e164;
}
