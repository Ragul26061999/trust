import { languages } from './languages';

/**
 * A service to handle both static and dynamic translations.
 * For dynamic content (user input), it uses a translation API.
 */
class TranslationService {
  private cache: Map<string, string> = new Map();

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
      // Here we use a reliable public endpoint for demonstration purposes.
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(
          text
        )}`
      );

      if (!response.ok) throw new Error('Translation API failed');

      const data = await response.json();
      const translatedText = data[0].map((item: any) => item[0]).join('');
      
      this.cache.set(cacheKey, translatedText);
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text on error
    }
  }

  private isEnglish(text: string): boolean {
    // Simple check for English characters
    return /^[a-zA-Z0-9\s.,!?'"()\-]+$/.test(text);
  }
}

export const translationService = new TranslationService();
