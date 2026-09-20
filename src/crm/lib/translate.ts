/**
 * Free, no-API-key machine translation used to auto-fill the Tamil /
 * Malayalam vegetable name fields from the English name the admin typed.
 * This is a starting point, not the final word — vegetable/produce names
 * often have specific local market terms a generic translator won't know,
 * so the admin can always edit the result before saving.
 *
 * Tries Google's translation endpoint first (best quality), falls back to
 * MyMemory if that's unreachable. Either way, the result is checked against
 * the target language's actual script (Tamil / Malayalam Unicode block) —
 * if a source returns romanized text (e.g. "sorakkai" instead of "சொறக்காய்")
 * or just echoes the English back, it's rejected and the field is left
 * blank for the admin to fill in by hand, rather than showing something
 * wrong.
 *
 * Common vegetables are looked up in a curated dictionary FIRST (see
 * vegetableDictionary.ts) — free MT regularly mistranslates produce names
 * (e.g. "Bottle Gourd" → "bottled water" in Malayalam), so a known name
 * skips MT entirely and only unrecognized names fall through to it.
 */
import { lookupVegetableName } from './vegetableDictionary'

const SCRIPT_RANGES: Record<'ta' | 'ml', RegExp> = {
  ta: /[஀-௿]/,
  ml: /[ഀ-ൿ]/,
}

function isInScript(text: string, targetLang: 'ta' | 'ml'): boolean {
  return SCRIPT_RANGES[targetLang].test(text)
}

async function translateViaGoogle(
  text: string,
  targetLang: 'ta' | 'ml',
): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text,
    )}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const chunks = data?.[0]
    if (!Array.isArray(chunks)) return null
    const translated = chunks.map((chunk: unknown[]) => chunk[0]).join('').trim()
    return translated || null
  } catch {
    return null
  }
}

async function translateViaMyMemory(
  text: string,
  targetLang: 'ta' | 'ml',
): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text,
    )}&langpair=${encodeURIComponent(`en|${targetLang}`)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const translated: string | undefined = data?.responseData?.translatedText
    return translated?.trim() || null
  } catch {
    return null
  }
}

export async function translateText(
  text: string,
  targetLang: 'ta' | 'ml',
): Promise<string | null> {
  const trimmed = text.trim()
  if (!trimmed) return null

  const dictionaryHit = lookupVegetableName(trimmed)
  if (dictionaryHit) return dictionaryHit[targetLang]

  const isUsable = (result: string | null) =>
    !!result &&
    result.toLowerCase() !== trimmed.toLowerCase() &&
    isInScript(result, targetLang)

  const google = await translateViaGoogle(trimmed, targetLang)
  if (isUsable(google)) return google

  const myMemory = await translateViaMyMemory(trimmed, targetLang)
  if (isUsable(myMemory)) return myMemory

  return null
}

export async function translateToTamilAndMalayalam(
  text: string,
): Promise<{ ta: string | null; ml: string | null }> {
  const [ta, ml] = await Promise.all([translateText(text, 'ta'), translateText(text, 'ml')])
  return { ta, ml }
}
