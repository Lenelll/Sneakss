/**
 * Official Sneaker Vault GH customer-support details, approved by the client
 * on 26 September 2026. Every page that shows contact information should read
 * from here so a change to a number or email happens in one place.
 */

/** Local Ghanaian format, as customers would dial it. */
export const SUPPORT_PHONE_DISPLAY = "055 616 6330";

/** International format for tel: links. */
export const SUPPORT_PHONE_E164 = "+233556166330";

/** The WhatsApp number is the same line as the phone number. */
export const SUPPORT_WHATSAPP_URL = "https://wa.me/233556166330";

export const SUPPORT_EMAIL = "sneakervaultghana@gmail.com";

export const TIKTOK_HANDLE = "@sneakervaultghana";

export const TIKTOK_URL = "https://www.tiktok.com/@sneakervaultghana?_r=1";

export const SUPPORT_HOURS = {
  days: "Monday – Saturday",
  time: "9am – 6pm",
} as const;

export const SUPPORT_HOURS_LABEL = `${SUPPORT_HOURS.days}, ${SUPPORT_HOURS.time}`;
