// app/siteConfig.ts

export const siteConfig = {
  company: "ORGANIC BRANDS LLC",
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
    iosApp: "https://apps.apple.com/",
    androidApp: "https://play.google.com/store/apps/",
  },

  meta: {
    year: 2026,
  },
} as const
