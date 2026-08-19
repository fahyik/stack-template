import type { CountryCode, PhoneNumber } from "libphonenumber-js";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export interface CountryData {
  code: CountryCode;
  callingCode: string;
  name: string;
}

export const countries: Record<CountryCode, CountryData> = {
  US: { code: "US", callingCode: "+1", name: "United States" },
  AF: { code: "AF", callingCode: "+93", name: "Afghanistan" },
  AL: { code: "AL", callingCode: "+355", name: "Albania" },
  DZ: { code: "DZ", callingCode: "+213", name: "Algeria" },
  AS: { code: "AS", callingCode: "+1", name: "American Samoa" },
  AD: { code: "AD", callingCode: "+376", name: "Andorra" },
  AO: { code: "AO", callingCode: "+244", name: "Angola" },
  AI: { code: "AI", callingCode: "+1", name: "Anguilla" },
  AG: { code: "AG", callingCode: "+1-268", name: "Antigua and Barbuda" },
  AR: { code: "AR", callingCode: "+54", name: "Argentina" },
  AM: { code: "AM", callingCode: "+374", name: "Armenia" },
  AW: { code: "AW", callingCode: "+297", name: "Aruba" },
  AU: { code: "AU", callingCode: "+61", name: "Australia" },
  AT: { code: "AT", callingCode: "+43", name: "Austria" },
  AZ: { code: "AZ", callingCode: "+994", name: "Azerbaijan" },
  BH: { code: "BH", callingCode: "+973", name: "Bahrain" },
  BD: { code: "BD", callingCode: "+880", name: "Bangladesh" },
  BB: { code: "BB", callingCode: "+1-246", name: "Barbados" },
  BY: { code: "BY", callingCode: "+375", name: "Belarus" },
  BE: { code: "BE", callingCode: "+32", name: "Belgium" },
  BZ: { code: "BZ", callingCode: "+501", name: "Belize" },
  BJ: { code: "BJ", callingCode: "+229", name: "Benin" },
  BM: { code: "BM", callingCode: "+1", name: "Bermuda" },
  BT: { code: "BT", callingCode: "+975", name: "Bhutan" },
  BO: { code: "BO", callingCode: "+591", name: "Bolivia" },
  BA: { code: "BA", callingCode: "+387", name: "Bosnia and Herzegovina" },
  BW: { code: "BW", callingCode: "+267", name: "Botswana" },
  BR: { code: "BR", callingCode: "+55", name: "Brazil" },
  IO: {
    code: "IO",
    callingCode: "+246",
    name: "British Indian Ocean Territory",
  },
  BN: { code: "BN", callingCode: "+673", name: "Brunei" },
  BG: { code: "BG", callingCode: "+359", name: "Bulgaria" },
  BF: { code: "BF", callingCode: "+226", name: "Burkina Faso" },
  BI: { code: "BI", callingCode: "+257", name: "Burundi" },
  KH: { code: "KH", callingCode: "+855", name: "Cambodia" },
  CM: { code: "CM", callingCode: "+237", name: "Cameroon" },
  CA: { code: "CA", callingCode: "+1", name: "Canada" },
  CV: { code: "CV", callingCode: "+238", name: "Cape Verde" },
  KY: { code: "KY", callingCode: "+1", name: "Cayman Islands" },
  CF: { code: "CF", callingCode: "+236", name: "Central African Republic" },
  TD: { code: "TD", callingCode: "+235", name: "Chad" },
  CL: { code: "CL", callingCode: "+56", name: "Chile" },
  CN: { code: "CN", callingCode: "+86", name: "China" },
  CX: { code: "CX", callingCode: "+61", name: "Christmas Island" },
  CC: { code: "CC", callingCode: "+61", name: "Cocos (Keeling) Islands" },
  CO: { code: "CO", callingCode: "+57", name: "Colombia" },
  KM: { code: "KM", callingCode: "+269", name: "Comoros" },
  CG: {
    code: "CG",
    callingCode: "+242",
    name: "Congo, Republic of the (Congo - Brazzaville)",
  },
  CK: { code: "CK", callingCode: "+682", name: "Cook Islands" },
  CR: { code: "CR", callingCode: "+506", name: "Costa Rica" },
  CI: { code: "CI", callingCode: "+225", name: "Cote d'Ivoire (Ivory Coast)" },
  HR: { code: "HR", callingCode: "+385", name: "Croatia" },
  CU: { code: "CU", callingCode: "+53", name: "Cuba" },
  CY: { code: "CY", callingCode: "+357", name: "Cyprus" },
  CZ: { code: "CZ", callingCode: "+420", name: "Czech Republic" },
  DK: { code: "DK", callingCode: "+45", name: "Denmark" },
  DJ: { code: "DJ", callingCode: "+253", name: "Djibouti" },
  DM: { code: "DM", callingCode: "+1-767", name: "Dominica" },
  DO: { code: "DO", callingCode: "+1", name: "Dominican Republic" },
  EC: { code: "EC", callingCode: "+593", name: "Ecuador" },
  EG: { code: "EG", callingCode: "+20", name: "Egypt" },
  SV: { code: "SV", callingCode: "+503", name: "El Salvador" },
  GQ: { code: "GQ", callingCode: "+240", name: "Equatorial Guinea" },
  ER: { code: "ER", callingCode: "+291", name: "Eritrea" },
  EE: { code: "EE", callingCode: "+372", name: "Estonia" },
  ET: { code: "ET", callingCode: "+251", name: "Ethiopia" },
  FK: { code: "FK", callingCode: "+500", name: "Falkland Islands" },
  FO: { code: "FO", callingCode: "+298", name: "Faroe Islands" },
  FJ: { code: "FJ", callingCode: "+679", name: "Fiji" },
  FI: { code: "FI", callingCode: "+358", name: "Finland" },
  FR: { code: "FR", callingCode: "+33", name: "France" },
  GF: { code: "GF", callingCode: "+594", name: "French Guiana" },
  PF: { code: "PF", callingCode: "+689", name: "French Polynesia" },
  GA: { code: "GA", callingCode: "+241", name: "Gabon" },
  GE: { code: "GE", callingCode: "+995", name: "Georgia" },
  DE: { code: "DE", callingCode: "+49", name: "Germany" },
  GH: { code: "GH", callingCode: "+233", name: "Ghana" },
  GI: { code: "GI", callingCode: "+350", name: "Gibraltar" },
  GR: { code: "GR", callingCode: "+30", name: "Greece" },
  GL: { code: "GL", callingCode: "+299", name: "Greenland" },
  GD: { code: "GD", callingCode: "+1-473", name: "Grenada" },
  GP: { code: "GP", callingCode: "+590", name: "Guadeloupe" },
  GU: { code: "GU", callingCode: "+1", name: "Guam" },
  GT: { code: "GT", callingCode: "+502", name: "Guatemala" },
  GG: { code: "GG", callingCode: "+44", name: "Guernsey and Alderney" },
  GN: { code: "GN", callingCode: "+224", name: "Guinea" },
  GW: { code: "GW", callingCode: "+245", name: "Guinea-Bissau" },
  GY: { code: "GY", callingCode: "+592", name: "Guyana" },
  HT: { code: "HT", callingCode: "+509", name: "Haiti" },
  HN: { code: "HN", callingCode: "+504", name: "Honduras" },
  HK: { code: "HK", callingCode: "+852", name: "Hong Kong" },
  HU: { code: "HU", callingCode: "+36", name: "Hungary" },
  IS: { code: "IS", callingCode: "+354", name: "Iceland" },
  IN: { code: "IN", callingCode: "+91", name: "India" },
  ID: { code: "ID", callingCode: "+62", name: "Indonesia" },
  IR: { code: "IR", callingCode: "+98", name: "Iran" },
  IQ: { code: "IQ", callingCode: "+964", name: "Iraq" },
  IE: { code: "IE", callingCode: "+353", name: "Ireland" },
  IM: { code: "IM", callingCode: "+44", name: "Isle of Man" },
  IL: { code: "IL", callingCode: "+972", name: "Israel" },
  IT: { code: "IT", callingCode: "+39", name: "Italy" },
  JM: { code: "JM", callingCode: "+1-876", name: "Jamaica" },
  JP: { code: "JP", callingCode: "+81", name: "Japan" },
  JE: { code: "JE", callingCode: "+44", name: "Jersey" },
  JO: { code: "JO", callingCode: "+962", name: "Jordan" },
  KZ: { code: "KZ", callingCode: "+7", name: "Kazakhstan" },
  KE: { code: "KE", callingCode: "+254", name: "Kenya" },
  KI: { code: "KI", callingCode: "+686", name: "Kiribati" },
  KW: { code: "KW", callingCode: "+965", name: "Kuwait" },
  KG: { code: "KG", callingCode: "+996", name: "Kyrgyzstan" },
  AX: { code: "AX", callingCode: "+358", name: "Aland Islands" },
  LA: { code: "LA", callingCode: "+856", name: "Laos" },
  LV: { code: "LV", callingCode: "+371", name: "Latvia" },
  LB: { code: "LB", callingCode: "+961", name: "Lebanon" },
  LS: { code: "LS", callingCode: "+266", name: "Lesotho" },
  LR: { code: "LR", callingCode: "+231", name: "Liberia" },
  LY: { code: "LY", callingCode: "+218", name: "Libya" },
  LI: { code: "LI", callingCode: "+423", name: "Liechtenstein" },
  LT: { code: "LT", callingCode: "+370", name: "Lithuania" },
  LU: { code: "LU", callingCode: "+352", name: "Luxembourg" },
  MO: { code: "MO", callingCode: "+853", name: "Macao" },
  MK: { code: "MK", callingCode: "+389", name: "Macedonia" },
  MG: { code: "MG", callingCode: "+261", name: "Madagascar" },
  MW: { code: "MW", callingCode: "+265", name: "Malawi" },
  MY: { code: "MY", callingCode: "+60", name: "Malaysia" },
  MV: { code: "MV", callingCode: "+960", name: "Maldives" },
  ML: { code: "ML", callingCode: "+223", name: "Mali" },
  MT: { code: "MT", callingCode: "+356", name: "Malta" },
  MH: { code: "MH", callingCode: "+692", name: "Marshall Islands" },
  MQ: { code: "MQ", callingCode: "+596", name: "Martinique" },
  MR: { code: "MR", callingCode: "+222", name: "Mauritania" },
  MU: { code: "MU", callingCode: "+230", name: "Mauritius" },
  YT: { code: "YT", callingCode: "+269", name: "Mayotte" },
  MX: { code: "MX", callingCode: "+52", name: "Mexico" },
  FM: { code: "FM", callingCode: "+691", name: "Micronesia" },
  MD: { code: "MD", callingCode: "+373", name: "Moldova" },
  MC: { code: "MC", callingCode: "+377", name: "Monaco" },
  MN: { code: "MN", callingCode: "+976", name: "Mongolia" },
  ME: { code: "ME", callingCode: "+382", name: "Montenegro" },
  MS: { code: "MS", callingCode: "+1", name: "Montserrat" },
  MA: { code: "MA", callingCode: "+212", name: "Morocco" },
  MZ: { code: "MZ", callingCode: "+258", name: "Mozambique" },
  MM: { code: "MM", callingCode: "+95", name: "Myanmar (Burma)" },
  NA: { code: "NA", callingCode: "+264", name: "Namibia" },
  NR: { code: "NR", callingCode: "+674", name: "Nauru" },
  NP: { code: "NP", callingCode: "+977", name: "Nepal" },
  NL: { code: "NL", callingCode: "+31", name: "Netherlands" },
  NC: { code: "NC", callingCode: "+687", name: "New Caledonia" },
  NZ: { code: "NZ", callingCode: "+64", name: "New Zealand" },
  NI: { code: "NI", callingCode: "+505", name: "Nicaragua" },
  NE: { code: "NE", callingCode: "+227", name: "Niger" },
  NG: { code: "NG", callingCode: "+234", name: "Nigeria" },
  NU: { code: "NU", callingCode: "+683", name: "Niue" },
  NF: { code: "NF", callingCode: "+672", name: "Norfolk Island" },
  MP: { code: "MP", callingCode: "+1", name: "Northern Mariana Islands" },
  KP: {
    code: "KP",
    callingCode: "+850",
    name: "Korea, Democratic People's Republic of (North Korea)",
  },
  NO: { code: "NO", callingCode: "+47", name: "Norway" },
  OM: { code: "OM", callingCode: "+968", name: "Oman" },
  PK: { code: "PK", callingCode: "+92", name: "Pakistan" },
  PW: { code: "PW", callingCode: "+680", name: "Palau" },
  PS: { code: "PS", callingCode: "+970", name: "Palestine" },
  PA: { code: "PA", callingCode: "+507", name: "Panama" },
  PG: { code: "PG", callingCode: "+675", name: "Papua New Guinea" },
  PY: { code: "PY", callingCode: "+595", name: "Paraguay" },
  PE: { code: "PE", callingCode: "+51", name: "Peru" },
  PH: { code: "PH", callingCode: "+63", name: "Philippines" },
  PL: { code: "PL", callingCode: "+48", name: "Poland" },
  PT: { code: "PT", callingCode: "+351", name: "Portugal" },
  PR: { code: "PR", callingCode: "+1", name: "Puerto Rico" },
  QA: { code: "QA", callingCode: "+974", name: "Qatar" },
  RO: { code: "RO", callingCode: "+40", name: "Romania" },
  RE: { code: "RE", callingCode: "+262", name: "Reunion" },
  RU: { code: "RU", callingCode: "+7", name: "Russia" },
  RW: { code: "RW", callingCode: "+250", name: "Rwanda" },
  BL: { code: "BL", callingCode: "+590", name: "Saint Barthelemy" },
  SH: { code: "SH", callingCode: "+290", name: "Saint Helena" },
  KN: { code: "KN", callingCode: "+1-869", name: "Saint Kitts and Nevis" },
  LC: { code: "LC", callingCode: "+1-758", name: "Saint Lucia" },
  MF: { code: "MF", callingCode: "+590", name: "Saint Martin" },
  PM: { code: "PM", callingCode: "+508", name: "Saint Pierre and Miquelon" },
  VC: {
    code: "VC",
    callingCode: "+1-784",
    name: "Saint Vincent and the Grenadines",
  },
  WS: { code: "WS", callingCode: "+685", name: "Samoa" },
  SM: { code: "SM", callingCode: "+378", name: "San Marino" },
  ST: { code: "ST", callingCode: "+239", name: "Sao Tome and Principe" },
  SA: { code: "SA", callingCode: "+966", name: "Saudi Arabia" },
  SN: { code: "SN", callingCode: "+221", name: "Senegal" },
  RS: { code: "RS", callingCode: "+381", name: "Serbia" },
  SC: { code: "SC", callingCode: "+248", name: "Seychelles" },
  SL: { code: "SL", callingCode: "+232", name: "Sierra Leone" },
  SG: { code: "SG", callingCode: "+65", name: "Singapore" },
  SK: { code: "SK", callingCode: "+421", name: "Slovakia" },
  SI: { code: "SI", callingCode: "+386", name: "Slovenia" },
  SB: { code: "SB", callingCode: "+677", name: "Solomon Islands" },
  SO: { code: "SO", callingCode: "+252", name: "Somalia" },
  ZA: { code: "ZA", callingCode: "+27", name: "South Africa" },
  KR: {
    code: "KR",
    callingCode: "+82",
    name: "Korea, Republic of (South Korea)",
  },
  ES: { code: "ES", callingCode: "+34", name: "Spain" },
  LK: { code: "LK", callingCode: "+94", name: "Sri Lanka" },
  SD: { code: "SD", callingCode: "+249", name: "Sudan" },
  SR: { code: "SR", callingCode: "+597", name: "Suriname" },
  SJ: { code: "SJ", callingCode: "+47", name: "Svalbard and Jan Mayen" },
  SZ: { code: "SZ", callingCode: "+268", name: "Swaziland" },
  SE: { code: "SE", callingCode: "+46", name: "Sweden" },
  CH: { code: "CH", callingCode: "+41", name: "Switzerland" },
  SY: { code: "SY", callingCode: "+963", name: "Syria" },
  TW: { code: "TW", callingCode: "+886", name: "Taiwan (ROC)" },
  TJ: { code: "TJ", callingCode: "+992", name: "Tajikistan" },
  TZ: { code: "TZ", callingCode: "+255", name: "Tanzania" },
  TH: { code: "TH", callingCode: "+66", name: "Thailand" },
  BS: { code: "BS", callingCode: "+1-242", name: "Bahamas, The" },
  GM: { code: "GM", callingCode: "+220", name: "Gambia, The" },
  TL: { code: "TL", callingCode: "+670", name: "Timor-Leste (East Timor)" },
  TG: { code: "TG", callingCode: "+228", name: "Togo" },
  TK: { code: "TK", callingCode: "+690", name: "Tokelau" },
  TO: { code: "TO", callingCode: "+676", name: "Tonga" },
  TT: { code: "TT", callingCode: "+1-868", name: "Trinidad and Tobago" },
  TN: { code: "TN", callingCode: "+216", name: "Tunisia" },
  TR: { code: "TR", callingCode: "+90", name: "Turkey" },
  TM: { code: "TM", callingCode: "+993", name: "Turkmenistan" },
  TC: { code: "TC", callingCode: "+1", name: "Turks and Caicos Islands" },
  TV: { code: "TV", callingCode: "+688", name: "Tuvalu" },
  UG: { code: "UG", callingCode: "+256", name: "Uganda" },
  UA: { code: "UA", callingCode: "+380", name: "Ukraine" },
  AE: { code: "AE", callingCode: "+971", name: "United Arab Emirates" },
  GB: { code: "GB", callingCode: "+44", name: "United Kingdom" },
  UY: { code: "UY", callingCode: "+598", name: "Uruguay" },
  UZ: { code: "UZ", callingCode: "+998", name: "Uzbekistan" },
  VU: { code: "VU", callingCode: "+678", name: "Vanuatu" },
  VA: { code: "VA", callingCode: "+379", name: "Vatican City" },
  VE: { code: "VE", callingCode: "+58", name: "Venezuela" },
  VN: { code: "VN", callingCode: "+84", name: "Vietnam" },
  VG: { code: "VG", callingCode: "+1", name: "British Virgin Islands" },
  VI: {
    code: "VI",
    callingCode: "+1",
    name: "Virgin Islands of the United States",
  },
  WF: { code: "WF", callingCode: "+681", name: "Wallis and Futuna" },
  EH: { code: "EH", callingCode: "+212", name: "Western Sahara" },
  YE: { code: "YE", callingCode: "+967", name: "Yemen" },
  ZM: { code: "ZM", callingCode: "+260", name: "Zambia" },
  ZW: { code: "ZW", callingCode: "+263", name: "Zimbabwe" },
  AC: { code: "AC", callingCode: "+247", name: "Ascension Island" },
  BQ: {
    code: "BQ",
    callingCode: "+599",
    name: "Bonaire, Sint Eustatius and Saba",
  },
  CD: {
    code: "CD",
    callingCode: "+243",
    name: "Congo, Democratic Republic of the (DRC)",
  },
  CW: { code: "CW", callingCode: "+599", name: "Curaçao" },
  SS: { code: "SS", callingCode: "+211", name: "South Sudan" },
  SX: { code: "SX", callingCode: "+599", name: "Sint Maarten" },
  TA: { code: "TA", callingCode: "+290", name: "Tristan da Cunha" },
  XK: { code: "XK", callingCode: "+383", name: "Kosovo" },
};

export const DEFAULT_COUNTRY: CountryCode = "US";

// Resolve a country from a 2-letter region code or BCP-47 locale ("US", "en-US", "en").
export function getCountryByLanguage(language: string): CountryData {
  const upper = language.toUpperCase();
  if (upper in countries) {
    return countries[upper as CountryCode];
  }
  const region = upper.split("-")[1];
  if (region && region in countries) {
    return countries[region as CountryCode];
  }
  return countries[DEFAULT_COUNTRY];
}

export function getCountryByNumber(
  phoneNumber: PhoneNumber
): CountryData | undefined {
  if (!phoneNumber.country) {
    return undefined;
  }
  return countries[phoneNumber.country];
}

// 2-letter ISO country code → regional-indicator flag emoji (each letter
// offset to its 0x1F1E6+ codepoint).
export function flagEmoji(country: string): string {
  return country
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Parse a raw input string. If it starts with "+", try without a default country
// first (so the number's own country code wins); otherwise fall back to the
// caller-provided country. Pure — no React state side effects.
export function parsePhoneInput(args: {
  input: string;
  fallbackCountry: CountryCode;
}): PhoneNumber | undefined {
  const { input, fallbackCountry } = args;

  if (input.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(input);
    if (parsed?.isValid()) {
      return parsed;
    }
    return parsed?.country
      ? parsePhoneNumberFromString(input, { defaultCountry: fallbackCountry })
      : undefined;
  }
  return parsePhoneNumberFromString(input, { defaultCountry: fallbackCountry });
}
