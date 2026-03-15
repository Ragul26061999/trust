export default {
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en', // English
      'es', // Spanish
      'fr', // French
      'de', // German
      'it', // Italian
      'pt', // Portuguese
      'ru', // Russian
      'ja', // Japanese
      'ko', // Korean
      'zh', // Chinese (Simplified)
      'zh-TW', // Chinese (Traditional)
      'ar', // Arabic
      'hi', // Hindi
      'bn', // Bengali
      'pa', // Punjabi
      'ta', // Tamil
      'te', // Telugu
      'mr', // Marathi
      'gu', // Gujarati
      'kn', // Kannada
      'ml', // Malayalam
      'th', // Thai
      'vi', // Vietnamese
      'id', // Indonesian
      'ms', // Malay
      'tr', // Turkish
      'pl', // Polish
      'nl', // Dutch
      'sv', // Swedish
      'da', // Danish
      'no', // Norwegian
      'fi', // Finnish
      'he', // Hebrew
      'cs', // Czech
      'sk', // Slovak
      'hu', // Hungarian
      'ro', // Romanian
      'bg', // Bulgarian
      'hr', // Croatian
      'sr', // Serbian
      'sl', // Slovenian
      'et', // Estonian
      'lv', // Latvian
      'lt', // Lithuanian
      'uk', // Ukrainian
      'el', // Greek
      'mk', // Macedonian
      'sq', // Albanian
      'mt', // Maltese
      'is', // Icelandic
      'ga', // Irish
      'cy', // Welsh
      'eu', // Basque
      'ca', // Catalan
      'gl', // Galician
      'be', // Belarusian
      'uz', // Uzbek
      'kk', // Kazakh
      'ky', // Kyrgyz
      'tg', // Tajik
      'tk', // Turkmen
      'az', // Azerbaijani
      'hy', // Armenian
      'ka', // Georgian
      'am', // Amharic
      'sw', // Swahili
      'zu', // Zulu
      'af', // Afrikaans
      'xh', // Xhosa
      'st', // Sesotho
      'tn', // Tswana
      'sn', // Shona
      'yo', // Yoruba
      'ig', // Igbo
      'ha', // Hausa
      'ne', // Nepali
      'si', // Sinhala
      'my', // Burmese
      'km', // Khmer
      'lo', // Lao
      'mn', // Mongolian
      'dz', // Dzongkha
      'bo', // Tibetan
      'fa', // Persian
      'ps', // Pashto
      'sd', // Sindhi
      'ur', // Urdu
    ],
  },
  fallbackLng: {
    default: ['en'],
  },
  debug: process.env.NODE_ENV === 'development',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  localePath: './public/locales',
  localeDetection: true,
};
