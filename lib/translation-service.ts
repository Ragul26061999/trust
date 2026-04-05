import { languages } from './languages';

/**
 * A service to handle both static and dynamic translations.
 * For dynamic content (user input), it uses a translation API.
 */
class TranslationService {
  private cache: Map<string, string> = new Map();
  private readonly CACHE_KEY = 'turest_translation_cache';

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(this.CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(key => this.cache.set(key, parsed[key]));
      }
    } catch (e) {
      console.warn('Failed to load translation cache', e);
    }
  }

  private saveCache() {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, string> = {};
      this.cache.forEach((val, key) => {
        // Limit cache size to prevent localStorage overflow
        if (Object.keys(obj).length < 500) {
          obj[key] = val;
        }
      });
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save translation cache', e);
    }
  }

  /**
   * Synchronous check for cached translation
   */
  getCached(text: string, targetLanguage: string): string | null {
    if (!text) return null;
    if (targetLanguage === 'en' && this.isEnglish(text)) return text;
    const cacheKey = `${targetLanguage}:${text}`;
    return this.cache.get(cacheKey) || null;
  }

  /**
   * Translates text to the target language using a translation API.
   * This is intended for dynamic content or strings not found in local locale files.
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    if (!text || text.trim() === '') return text;
    if (targetLanguage === 'en' && this.isEnglish(text)) return text;

    const cacheKey = `${targetLanguage}:${text}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // For a real production app, use Google Cloud Translation API, OpenAI, or Azure Translator.
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(
          text
        )}`
      );

      if (!response.ok) throw new Error('Translation API failed');

      const data = await response.json();
      const translatedText = data[0].map((item: any) => item[0]).join('');
      
      this.cache.set(cacheKey, translatedText);
      this.saveCache();
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  private isEnglish(text: string): boolean {
    // Simple check for English characters
    return /^[a-zA-Z0-9\s.,!?'"()\-]+$/.test(text);
  }
}

export const translationService = new TranslationService();
