/**
 * Curated English → Tamil / Malayalam names for vegetables commonly traded
 * in Tamil Nadu / Kerala markets. Machine translation regularly gets these
 * wrong (e.g. "Bottle Gourd" → "bottled water" in Malayalam), so known
 * items are looked up here first; only names not in this list fall back to
 * machine translation. Keys are matched case-insensitively after trimming.
 *
 * Admin can still edit any name before saving — this is a head start, not
 * a lock.
 */
export const VEGETABLE_DICTIONARY: Record<string, { ta: string; ml: string }> = {
  'bottle gourd': { ta: 'சுரைக்காய்', ml: 'ചുരയ്ക്ക' },
  'snake gourd': { ta: 'புடலங்காய்', ml: 'പടവലങ്ങ' },
  'ridge gourd': { ta: 'பீர்க்கங்காய்', ml: 'പീച്ചിങ്ങ' },
  'ash gourd': { ta: 'பூசணிக்காய்', ml: 'കുമ്പളങ്ങ' },
  'white pumpkin': { ta: 'பூசணிக்காய்', ml: 'കുമ്പളങ്ങ' },
  'bitter gourd': { ta: 'பாகற்காய்', ml: 'പാവയ്ക്ക' },
  'ladies finger': { ta: 'வெண்டைக்காய்', ml: 'വെണ്ടയ്ക്ക' },
  okra: { ta: 'வெண்டைக்காய்', ml: 'വെണ്ടയ്ക്ക' },
  brinjal: { ta: 'கத்தரிக்காய்', ml: 'വഴുതനങ്ങ' },
  eggplant: { ta: 'கத்தரிக்காய்', ml: 'വഴുതനങ്ങ' },
  tomato: { ta: 'தக்காளி', ml: 'തക്കാളി' },
  'green tomato': { ta: 'பச்சை தக்காளி', ml: 'പച്ച തക്കാളി' },
  onion: { ta: 'வெங்காயம்', ml: 'ഉള്ളി' },
  'small onion': { ta: 'சின்ன வெங்காயம்', ml: 'ചെറിയ ഉള്ളി' },
  shallots: { ta: 'சின்ன வெங்காயம்', ml: 'ചെറിയ ഉള്ളി' },
  'spring onion': { ta: 'வெங்காயத் தண்டு', ml: 'സ്പ്രിംഗ് ഉള്ളി' },
  potato: { ta: 'உருளைக்கிழங்கு', ml: 'ഉരുളക്കിഴങ്ങ്' },
  carrot: { ta: 'கேரட்', ml: 'കാരറ്റ്' },
  beetroot: { ta: 'பீட்ரூட்', ml: 'ബീറ്റ്റൂട്ട്' },
  cabbage: { ta: 'முட்டைக்கோஸ்', ml: 'കാബേജ്' },
  cauliflower: { ta: 'காலிஃபிளவர்', ml: 'കോളിഫ്ലവർ' },
  'green chilli': { ta: 'பச்சை மிளகாய்', ml: 'പച്ചമുളക്' },
  'green chili': { ta: 'பச்சை மிளகாய்', ml: 'പച്ചമുളക്' },
  'red chilli': { ta: 'சிவப்பு மிளகாய்', ml: 'ചുവന്ന മുളക്' },
  ginger: { ta: 'இஞ்சி', ml: 'ഇഞ്ചി' },
  garlic: { ta: 'பூண்டு', ml: 'വെളുത്തുള്ളി' },
  drumstick: { ta: 'முருங்கைக்காய்', ml: 'മുരിങ്ങയ്ക്ക' },
  cucumber: { ta: 'வெள்ளரிக்காய்', ml: 'വെള്ളരിക്ക' },
  pumpkin: { ta: 'பரங்கிக்காய்', ml: 'മത്തങ്ങ' },
  beans: { ta: 'பீன்ஸ்', ml: 'ബീൻസ്' },
  'french beans': { ta: 'பீன்ஸ்', ml: 'ബീൻസ്' },
  'cluster beans': { ta: 'கொத்தவரங்காய்', ml: 'കൊത്തവര' },
  'broad beans': { ta: 'அவரைக்காய்', ml: 'അവര' },
  yam: { ta: 'சேனைக்கிழங்கு', ml: 'ചേന' },
  'elephant yam': { ta: 'சேனைக்கிழங்கு', ml: 'ചേന' },
  colocasia: { ta: 'சேப்பங்கிழங்கு', ml: 'ചേമ്പ്' },
  tapioca: { ta: 'மரவள்ளிக்கிழங்கு', ml: 'കപ്പ' },
  'sweet potato': { ta: 'சர்க்கரைவள்ளிக்கிழங்கு', ml: 'മധുരക്കിഴങ്ങ്' },
  spinach: { ta: 'பசலைக் கீரை', ml: 'ചീര' },
  capsicum: { ta: 'குடமிளகாய்', ml: 'കാപ്സിക്കം' },
  radish: { ta: 'முள்ளங்கி', ml: 'മുള്ളങ്കി' },
  'curry leaves': { ta: 'கறிவேப்பிலை', ml: 'കറിവേപ്പില' },
  'coriander leaves': { ta: 'கொத்தமல்லி', ml: 'മല്ലിയില' },
  coriander: { ta: 'கொத்தமல்லி', ml: 'മല്ലിയില' },
  mint: { ta: 'புதினா', ml: 'പുതിന' },
  lemon: { ta: 'எலுமிச்சை', ml: 'നാരങ്ങ' },
  'raw banana': { ta: 'வாழைக்காய்', ml: 'വാഴക്ക' },
  plantain: { ta: 'வாழைக்காய்', ml: 'വാഴക്ക' },
  banana: { ta: 'வாழைப்பழம்', ml: 'വാഴപ്പഴം' },
  turnip: { ta: 'டர்னிப்', ml: 'ടർണിപ്പ്' },
  peas: { ta: 'பட்டாணி', ml: 'പട്ടാണി' },
  'green peas': { ta: 'பச்சை பட்டாணி', ml: 'പച്ച പട്ടാണി' },
  jackfruit: { ta: 'பலாக்காய்', ml: 'ചക്ക' },
  'raw jackfruit': { ta: 'பலாக்காய்', ml: 'ഇളംചക്ക' },
  mango: { ta: 'மாம்பழம்', ml: 'മാമ്പഴം' },
  'raw mango': { ta: 'மாங்காய்', ml: 'മാങ്ങ' },
  coconut: { ta: 'தேங்காய்', ml: 'തേങ്ങ' },
  'sweet corn': { ta: 'சோளம்', ml: 'ചോളം' },
  corn: { ta: 'சோளம்', ml: 'ചോളം' },
  papaya: { ta: 'பப்பாளி', ml: 'പപ്പായ' },
  'raw papaya': { ta: 'பச்சை பப்பாளி', ml: 'പച്ച പപ്പായ' },
  pineapple: { ta: 'அன்னாசி', ml: 'കൈതച്ചക്ക' },
  'ivy gourd': { ta: 'கோவைக்காய்', ml: 'കോവയ്ക്ക' },
  'pointed gourd': { ta: 'கோவைக்காய்', ml: 'കോവയ്ക്ക' },
  'chow chow': { ta: 'சௌ சௌ', ml: 'ചൗ ചൗ' },
  chayote: { ta: 'சௌ சௌ', ml: 'ചൗ ചൗ' },
  'ginger old': { ta: 'பழைய இஞ்சி', ml: 'പഴയ ഇഞ്ചി' },
  'green chilli bullet': { ta: 'புல்லட் பச்சை மிளகாய்', ml: 'ബുള്ളറ്റ് പച്ചമുളക്' },
  'green chili bullet': { ta: 'புல்லட் பச்சை மிளகாய்', ml: 'ബുള്ളറ്റ് പച്ചമുളക്' },
  'ooty carrot': { ta: 'ஊட்டி கேரட்', ml: 'ഊട്ടി കാരറ്റ്' },
  amla: { ta: 'நெல்லிக்காய்', ml: 'നെല്ലിക്ക' },
  'indian gooseberry': { ta: 'நெல்லிக்காய்', ml: 'നെല്ലിക്ക' },
}

export function lookupVegetableName(nameEn: string): { ta: string; ml: string } | null {
  const key = nameEn.trim().toLowerCase()
  return VEGETABLE_DICTIONARY[key] ?? null
}
