"use client"

import * as React from "react"
import { UiDialog, UiDialogTrigger } from "./Dialog"
import { Button } from "./Button"
import { UiModal, UiModalOverlay } from "./ui/Modal"

export type CookiePreferences = {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export type ConsentData = {
  preferences: CookiePreferences
  timestamp: string
  version: string
}

const CONSENT_KEY = "cookie_consent"
const CONSENT_VERSION = "1.0"

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
}

export const useCookieConsent = () => {
  const [consent, setConsent] = React.useState<ConsentData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasConsent, setHasConsent] = React.useState(false)

  const readConsent = React.useCallback(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (stored) {
        const parsed: ConsentData = JSON.parse(stored)
        setConsent(parsed)
        setHasConsent(true)
      } else {
        setHasConsent(false)
      }
    } catch (error) {
      console.error("Error reading cookie consent:", error)
      setHasConsent(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveConsent = React.useCallback((preferences: CookiePreferences) => {
    const consentData: ConsentData = {
      preferences,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    }

    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData))
      setConsent(consentData)
      setHasConsent(true)

      // Log enabled cookies for debugging
      if (preferences.analytics) {
        // console.log("✓ Analytics cookies enabled")
      }
      if (preferences.marketing) {
        // console.log("✓ Marketing cookies enabled")
      }
      if (preferences.functional) {
        // console.log("✓ Functional cookies enabled")
      }

      return true
    } catch (error) {
      console.error("Error saving cookie consent:", error)
      return false
    }
  }, [])

  const acceptAll = React.useCallback(() => {
    return saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    })
  }, [saveConsent])

  const rejectAll = React.useCallback(() => {
    return saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    })
  }, [saveConsent])

  const updatePreferences = React.useCallback(
    (preferences: Partial<CookiePreferences>) => {
      const currentPrefs = consent?.preferences || DEFAULT_PREFERENCES
      return saveConsent({
        ...currentPrefs,
        ...preferences,
        essential: true, // Always true
      })
    },
    [consent, saveConsent]
  )

  const clearConsent = React.useCallback(() => {
    try {
      localStorage.removeItem(CONSENT_KEY)
      setConsent(null)
      setHasConsent(false)
      // console.log("✓ Cookie consent cleared")
      return true
    } catch (error) {
      console.error("Error clearing cookie consent:", error)
      return false
    }
  }, [])

  const getPreference = React.useCallback(
    (key: keyof CookiePreferences): boolean => {
      return consent?.preferences[key] ?? DEFAULT_PREFERENCES[key]
    },
    [consent]
  )

  return {
    // State
    consent,
    hasConsent,
    isLoading,
    preferences: consent?.preferences || DEFAULT_PREFERENCES,

    // Actions
    saveConsent,
    acceptAll,
    rejectAll,
    updatePreferences,
    clearConsent,
    readConsent,

    // Utilities
    getPreference,
    isAnalyticsEnabled: getPreference("analytics"),
    isMarketingEnabled: getPreference("marketing"),
    isFunctionalEnabled: getPreference("functional"),
  }
}

// Context Provider (optional, for sharing consent across components)
type CookieConsentContextType = ReturnType<typeof useCookieConsent>

const CookieConsentContext = React.createContext<
  CookieConsentContextType | undefined
>(undefined)

export const CookieConsentProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const cookieConsent = useCookieConsent()

  return (
    <CookieConsentContext.Provider value={cookieConsent}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export const useCookieConsentContext = () => {
  const context = React.useContext(CookieConsentContext)
  if (!context) {
    throw new Error(
      "useCookieConsentContext must be used within CookieConsentProvider"
    )
  }
  return context
}

export const CookieConsentDialog: React.FC = () => {
  const { isLoading, readConsent, hasConsent, acceptAll, rejectAll } =
    useCookieConsent()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    readConsent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Prevent SSR hydration mismatch by only rendering after mount
  if (!mounted) {
    return null
  }

  return (
    <UiDialogTrigger isOpen={!isLoading && !hasConsent}>
      <UiModalOverlay
        isDismissable={false}
        className="bg-transparent items-end"
      >
        <UiModal className="relative">
          <UiDialog>
            <p className="text-md mb-2">Cookies</p>
            <p className="mb-6">
              By using the website, you agree to our use of cookies.
            </p>
            <div className="flex flex-row gap-4 w-full">
              <Button variant="outline" isFullWidth onPress={rejectAll}>
                Deny all
              </Button>
              <Button isFullWidth onPress={acceptAll}>
                Approve all
              </Button>
            </div>
          </UiDialog>
        </UiModal>
      </UiModalOverlay>
    </UiDialogTrigger>
  )
}
