import zhCN from './zh-CN'
import enUS from './en-US'
import type { CustomLocale } from '../types/editor'

export const locales = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export const defaultLocale = 'zh-CN'

// Helper function for type-safe custom locales
export function defineLocale(locale: Record<string, string>): CustomLocale {
  return locale
}

export { zhCN, enUS }
