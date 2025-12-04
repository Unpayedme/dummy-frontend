// Hardcoded list of barangays in Cordova, Cebu
export const BARANGAYS = [
  'Alegria',
  'Bangbang',
  'Buagsong',
  'Catarman',
  'Cogon',
  'Dapitan',
  'Day-as',
  'Gabi',
  'Gilutongan',
  'Ibabao',
  'Pilipog',
  'Poblacion',
  'San Miguel'
] as const;

export type Barangay = typeof BARANGAYS[number];

