// app/siteConfig.ts

export const siteConfig = {
  company: "Organic Brands LLC",
  appName: "NJDrive50",
  contactEmail: "support@njdrive50.com",

  routes: {
    home: "/",
    privacy: "/privacy",
    terms: "/terms",
    settings: "/settings",
    deleteAccount: "/delete-account",
    deleteData: "/delete-data",
    reviewerAccess: "/reviewer-access",
    pricing: "/pricing",
    practiceTest: "/practice-test",
  },

  external: {
    // NJDrive50 is Android-only. Delete this line if nothing references it.
    iosApp: "https://apps.apple.com/",
    androidApp: "https://play.google.com/store/apps/details?id=com.njdrive50.app",
  },

  meta: {
    year: 2026,
  },
} as const