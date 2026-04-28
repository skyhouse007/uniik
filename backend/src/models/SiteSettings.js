import mongoose from 'mongoose'

const SiteSettingsSchema = new mongoose.Schema(
  {
    announcementText: { type: String, default: '' },
    /** Multiple rotating bar lines; falls back to announcementText when empty. */
    announcementMessages: { type: [String], default: [] },
    contactEmail: { type: String, default: 'support@cozyfoam.in' },
  },
  { timestamps: true },
)

export const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema)
