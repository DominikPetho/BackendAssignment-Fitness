import i18next from 'i18next'
import path from 'path'
import fs from 'fs'

// Load translation files
const enTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/en.json'), 'utf8'))
const skTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/sk.json'), 'utf8'))

// Initialize i18next
i18next.init({
    lng: 'en', // default language
    fallbackLng: 'en',
    resources: {
        en: enTranslations,
        sk: skTranslations
    },
    interpolation: {
        escapeValue: false // React already escapes values
    }
})

export default i18next 