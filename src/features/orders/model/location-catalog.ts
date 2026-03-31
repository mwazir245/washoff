export type SaudiCityId =
  | "riyadh"
  | "jeddah"
  | "makkah"
  | "madinah"
  | "dammam"
  | "khobar"
  | "dhahran"
  | "taif"
  | "tabuk"
  | "abha"
  | "khamis_mushait"
  | "qassim"
  | "buraydah"
  | "hail"
  | "jazan"
  | "najran"
  | "al_ahsa"
  | "jubail";

export type SaudiDistrictId = `${SaudiCityId}:${string}`;

export interface SaudiCityMasterRecord {
  id: SaudiCityId;
  nameAr: string;
  active: boolean;
}

export interface SaudiDistrictMasterRecord {
  id: SaudiDistrictId;
  cityId: SaudiCityId;
  nameAr: string;
  active: boolean;
}

const buildDistrictId = (cityId: SaudiCityId, districtCode: string): SaudiDistrictId =>
  `${cityId}:${districtCode}`;

export const SAUDI_CITY_MASTER_DATA: SaudiCityMasterRecord[] = [
  { id: "riyadh", nameAr: "الرياض", active: true },
  { id: "jeddah", nameAr: "جدة", active: true },
  { id: "makkah", nameAr: "مكة المكرمة", active: true },
  { id: "madinah", nameAr: "المدينة المنورة", active: true },
  { id: "dammam", nameAr: "الدمام", active: true },
  { id: "khobar", nameAr: "الخبر", active: true },
  { id: "dhahran", nameAr: "الظهران", active: true },
  { id: "taif", nameAr: "الطائف", active: true },
  { id: "tabuk", nameAr: "تبوك", active: true },
  { id: "abha", nameAr: "أبها", active: true },
  { id: "khamis_mushait", nameAr: "خميس مشيط", active: true },
  { id: "qassim", nameAr: "القصيم", active: true },
  { id: "buraydah", nameAr: "بريدة", active: true },
  { id: "hail", nameAr: "حائل", active: true },
  { id: "jazan", nameAr: "جازان", active: true },
  { id: "najran", nameAr: "نجران", active: true },
  { id: "al_ahsa", nameAr: "الأحساء", active: true },
  { id: "jubail", nameAr: "الجبيل", active: true },
];

export const SAUDI_DISTRICT_MASTER_DATA: SaudiDistrictMasterRecord[] = [
  { id: buildDistrictId("riyadh", "olaya"), cityId: "riyadh", nameAr: "العليا", active: true },
  { id: buildDistrictId("riyadh", "sulimaniyah"), cityId: "riyadh", nameAr: "السليمانية", active: true },
  { id: buildDistrictId("riyadh", "malaz"), cityId: "riyadh", nameAr: "الملز", active: true },
  { id: buildDistrictId("riyadh", "yasmin"), cityId: "riyadh", nameAr: "الياسمين", active: true },
  { id: buildDistrictId("riyadh", "narjis"), cityId: "riyadh", nameAr: "النرجس", active: true },

  { id: buildDistrictId("jeddah", "rawdah"), cityId: "jeddah", nameAr: "الروضة", active: true },
  { id: buildDistrictId("jeddah", "salamah"), cityId: "jeddah", nameAr: "السلامة", active: true },
  { id: buildDistrictId("jeddah", "andalus"), cityId: "jeddah", nameAr: "الأندلس", active: true },
  { id: buildDistrictId("jeddah", "nahdah"), cityId: "jeddah", nameAr: "النهضة", active: true },

  { id: buildDistrictId("makkah", "aziziyah"), cityId: "makkah", nameAr: "العزيزية", active: true },
  { id: buildDistrictId("makkah", "awali"), cityId: "makkah", nameAr: "العوالي", active: true },
  { id: buildDistrictId("makkah", "jarwal"), cityId: "makkah", nameAr: "جرول", active: true },

  { id: buildDistrictId("madinah", "qiblatain"), cityId: "madinah", nameAr: "قباء", active: true },
  { id: buildDistrictId("madinah", "sultana"), cityId: "madinah", nameAr: "السلطانة", active: true },
  { id: buildDistrictId("madinah", "al_jumuah"), cityId: "madinah", nameAr: "الجمعة", active: true },

  { id: buildDistrictId("dammam", "faisaliyah"), cityId: "dammam", nameAr: "الفيصلية", active: true },
  { id: buildDistrictId("dammam", "shatea"), cityId: "dammam", nameAr: "الشاطئ", active: true },
  { id: buildDistrictId("dammam", "badiyah"), cityId: "dammam", nameAr: "البادية", active: true },

  { id: buildDistrictId("khobar", "olaya"), cityId: "khobar", nameAr: "العليا", active: true },
  { id: buildDistrictId("khobar", "corniche"), cityId: "khobar", nameAr: "الكورنيش", active: true },
  { id: buildDistrictId("khobar", "aqrabiyah"), cityId: "khobar", nameAr: "العقربية", active: true },

  { id: buildDistrictId("dhahran", "doha"), cityId: "dhahran", nameAr: "الدوحة", active: true },
  { id: buildDistrictId("dhahran", "university"), cityId: "dhahran", nameAr: "الجامعة", active: true },
  { id: buildDistrictId("dhahran", "rabwah"), cityId: "dhahran", nameAr: "الربوة", active: true },

  { id: buildDistrictId("taif", "sharafiyah"), cityId: "taif", nameAr: "الشرفية", active: true },
  { id: buildDistrictId("taif", "hawiyah"), cityId: "taif", nameAr: "الحوية", active: true },
  { id: buildDistrictId("taif", "salamah"), cityId: "taif", nameAr: "السلامة", active: true },

  { id: buildDistrictId("tabuk", "rayyan"), cityId: "tabuk", nameAr: "الريان", active: true },
  { id: buildDistrictId("tabuk", "muntazah"), cityId: "tabuk", nameAr: "المنتزه", active: true },
  { id: buildDistrictId("tabuk", "ulaya"), cityId: "tabuk", nameAr: "العليا", active: true },

  { id: buildDistrictId("abha", "mansak"), cityId: "abha", nameAr: "المنسك", active: true },
  { id: buildDistrictId("abha", "shamkhah"), cityId: "abha", nameAr: "شمخة", active: true },
  { id: buildDistrictId("abha", "sadd"), cityId: "abha", nameAr: "السد", active: true },

  { id: buildDistrictId("khamis_mushait", "shifa"), cityId: "khamis_mushait", nameAr: "الشفا", active: true },
  { id: buildDistrictId("khamis_mushait", "dhabab"), cityId: "khamis_mushait", nameAr: "الضباب", active: true },
  { id: buildDistrictId("khamis_mushait", "wadi_bin_hashbal"), cityId: "khamis_mushait", nameAr: "وادي بن هشبل", active: true },

  { id: buildDistrictId("qassim", "buraydah_center"), cityId: "qassim", nameAr: "مركز القصيم", active: true },
  { id: buildDistrictId("qassim", "onaizah"), cityId: "qassim", nameAr: "عنيزة", active: true },
  { id: buildDistrictId("qassim", "rass"), cityId: "qassim", nameAr: "الرس", active: true },

  { id: buildDistrictId("buraydah", "naqeeb"), cityId: "buraydah", nameAr: "النقيب", active: true },
  { id: buildDistrictId("buraydah", "rabwah"), cityId: "buraydah", nameAr: "الربوة", active: true },
  { id: buildDistrictId("buraydah", "rayyan"), cityId: "buraydah", nameAr: "الريان", active: true },

  { id: buildDistrictId("hail", "aziziyah"), cityId: "hail", nameAr: "العزيزية", active: true },
  { id: buildDistrictId("hail", "sama"), cityId: "hail", nameAr: "السماح", active: true },
  { id: buildDistrictId("hail", "nuqrah"), cityId: "hail", nameAr: "النقرة", active: true },

  { id: buildDistrictId("jazan", "suways"), cityId: "jazan", nameAr: "السويس", active: true },
  { id: buildDistrictId("jazan", "shati"), cityId: "jazan", nameAr: "الشاطئ", active: true },
  { id: buildDistrictId("jazan", "rawabi"), cityId: "jazan", nameAr: "الروابي", active: true },

  { id: buildDistrictId("najran", "faisaliyah"), cityId: "najran", nameAr: "الفيصلية", active: true },
  { id: buildDistrictId("najran", "ruwaikbah"), cityId: "najran", nameAr: "رويكبة", active: true },
  { id: buildDistrictId("najran", "sadd"), cityId: "najran", nameAr: "السد", active: true },

  { id: buildDistrictId("al_ahsa", "hofuf"), cityId: "al_ahsa", nameAr: "الهفوف", active: true },
  { id: buildDistrictId("al_ahsa", "mubarraz"), cityId: "al_ahsa", nameAr: "المبرز", active: true },
  { id: buildDistrictId("al_ahsa", "uyun"), cityId: "al_ahsa", nameAr: "العيون", active: true },

  { id: buildDistrictId("jubail", "fanateer"), cityId: "jubail", nameAr: "الفناتير", active: true },
  { id: buildDistrictId("jubail", "dana"), cityId: "jubail", nameAr: "الدانة", active: true },
  { id: buildDistrictId("jubail", "jalmudah"), cityId: "jubail", nameAr: "جلمودة", active: true },
];

const saudiCityById = new Map(SAUDI_CITY_MASTER_DATA.map((city) => [city.id, city]));
const saudiCityByLabel = new Map(
  SAUDI_CITY_MASTER_DATA.map((city) => [city.nameAr.trim().toLocaleLowerCase("ar-SA"), city]),
);
const saudiDistrictById = new Map(SAUDI_DISTRICT_MASTER_DATA.map((district) => [district.id, district]));

export const getSaudiCities = () => SAUDI_CITY_MASTER_DATA.slice();

export const getSaudiCityLabelsAr = () => SAUDI_CITY_MASTER_DATA.map((city) => city.nameAr);

export const getSaudiCityById = (cityId?: SaudiCityId | null) =>
  cityId ? saudiCityById.get(cityId) : undefined;

export const getSaudiCityLabelAr = (cityId?: SaudiCityId | null) =>
  getSaudiCityById(cityId)?.nameAr;

export const resolveSaudiCityId = (value?: string | null): SaudiCityId | undefined => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (saudiCityById.has(normalizedValue as SaudiCityId)) {
    return normalizedValue as SaudiCityId;
  }

  return saudiCityByLabel.get(normalizedValue.toLocaleLowerCase("ar-SA"))?.id;
};

export const getDistrictsForCityId = (cityId?: SaudiCityId | null) => {
  if (!cityId) {
    return [];
  }

  return SAUDI_DISTRICT_MASTER_DATA.filter((district) => district.cityId === cityId);
};

export const getSaudiDistrictById = (districtId?: SaudiDistrictId | null) =>
  districtId ? saudiDistrictById.get(districtId) : undefined;

export const getSaudiDistrictLabelAr = (districtId?: SaudiDistrictId | null) =>
  getSaudiDistrictById(districtId)?.nameAr;

export const resolveSaudiDistrictId = (
  cityId: SaudiCityId | undefined,
  value?: string | null,
): SaudiDistrictId | undefined => {
  const normalizedValue = value?.trim();

  if (!cityId || !normalizedValue) {
    return undefined;
  }

  if (saudiDistrictById.has(normalizedValue as SaudiDistrictId)) {
    const district = saudiDistrictById.get(normalizedValue as SaudiDistrictId);
    return district?.cityId === cityId ? district.id : undefined;
  }

  return getDistrictsForCityId(cityId).find(
    (district) => district.nameAr.trim().toLocaleLowerCase("ar-SA") === normalizedValue.toLocaleLowerCase("ar-SA"),
  )?.id;
};

export const isDistrictCoveredByCity = (
  cityId: SaudiCityId | undefined,
  districtId?: SaudiDistrictId | null,
) => {
  if (!cityId || !districtId) {
    return false;
  }

  return getSaudiDistrictById(districtId)?.cityId === cityId;
};
