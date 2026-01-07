import { z } from "zod";

const appName = z.string().trim().min(1).max(40);
const topAppItem = z.object({
  name: appName,
  minutes: z.number().int().min(0).max(1440).optional()
});

export const submissionSchema = z.object({
  period: z.number().int().min(1).max(12),
  deviceType: z.enum(["iphone","android","other"]),
  timeframe: z.enum(["7dayavg","yesterday"]).default("7dayavg"),
  screenMinutes: z.number().int().min(0).max(1440),

  pickups: z.number().int().min(0).max(2000).nullable().optional(),
  notifications: z.number().int().min(0).max(20000).nullable().optional(),

  socialMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  entertainmentMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  gamesMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  productivityMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  communicationMinutes: z.number().int().min(0).max(1440).nullable().optional(),

  topApps: z.array(topAppItem).max(5).nullable().optional(),

  reflectionText: z.string().trim().max(240).nullable().optional()
});

// Guardrails against obvious spam/outliers beyond DB checks
export function normalizeSubmission(input) {
  const v = submissionSchema.parse(input);

  // If category totals exceed screen minutes by a lot, keep them but don't let any single category exceed screen minutes
  const clampCat = (x) => (x == null ? null : Math.min(Math.max(0, x), v.screenMinutes));
  return {
    ...v,
    pickups: v.pickups ?? null,
    notifications: v.notifications ?? null,
    socialMinutes: clampCat(v.socialMinutes ?? null),
    entertainmentMinutes: clampCat(v.entertainmentMinutes ?? null),
    gamesMinutes: clampCat(v.gamesMinutes ?? null),
    productivityMinutes: clampCat(v.productivityMinutes ?? null),
    communicationMinutes: clampCat(v.communicationMinutes ?? null),
    topApps: v.topApps ?? null,
    reflectionText: v.reflectionText ?? null
  };
}
