import { z } from 'zod';
import { AVAILABILITY, FEEDBACK_TAGS, USER_ROLE } from './status';

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

/** Accepts true/false or the strings "true"/"false" (z.coerce.boolean would turn "false" into true). */
const boolSchema = z.union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')]);

export const latSchema = z.coerce.number().min(-90).max(90);
export const lngSchema = z.coerce.number().min(-180).max(180);

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const sendOtpSchema = z.object({ phone: phoneSchema });

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().trim().regex(/^\d{4,6}$/, 'Enter the code you received'),
  role: z.enum([USER_ROLE.WORKER, USER_ROLE.BUSINESS]).default(USER_ROLE.WORKER),
  name: z.string().trim().min(1).max(80).optional(),
  locality: z.string().trim().max(120).optional(),
  latitude: latSchema.optional(),
  longitude: lngSchema.optional(),
});

export const switchRoleSchema = z.object({
  role: z.enum([USER_ROLE.WORKER, USER_ROLE.BUSINESS]),
  locality: z.string().trim().max(120).optional(),
  latitude: latSchema.optional(),
  longitude: lngSchema.optional(),
});

export const createJobSchema = z
  .object({
    skill_id: z.string().min(1, 'Choose a type of work'),
    title: z.string().trim().min(2, 'Title is required').max(100),
    description: z.string().trim().max(1000).optional().nullable(),
    workers_required: z.coerce.number().int().min(1).max(20).default(1),
    wage: z.coerce.number().int().min(300, 'Minimum wage is ₹300').max(5000, 'Maximum wage is ₹5000'),
    food_provided: boolSchema.default(false),
    job_date: dateSchema,
    start_time: timeSchema,
    end_time: timeSchema,
    locality: z.string().trim().min(1).max(120),
    latitude: latSchema,
    longitude: lngSchema,
    invited_worker_id: z.string().min(1).optional().nullable(),
  })
  .refine((j) => j.end_time > j.start_time, {
    message: 'End time must be after start time',
    path: ['end_time'],
  });

export const updateWorkerProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  locality: z.string().trim().max(120).optional(),
  latitude: latSchema.optional(),
  longitude: lngSchema.optional(),
  experience_years: z.coerce.number().min(0).max(60).optional(),
  expected_wage: z.coerce.number().int().min(100).max(10000).optional(),
  availability: z.enum(AVAILABILITY).optional(),
  skill_ids: z.array(z.string().min(1)).max(10).optional(),
});

export const availabilitySchema = z.object({ availability: z.enum(AVAILABILITY) });

export const startWorkSchema = z.object({
  otp: z.string().trim().regex(/^\d{4}$/, 'Enter the 4-digit code from the customer'),
});

export const reviewSchema = z.object({
  application_id: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  feedback_tag: z.enum(FEEDBACK_TAGS).optional().nullable(),
  comment: z.string().trim().max(500).optional().nullable(),
});

export const nearbyQuerySchema = z.object({
  lat: latSchema,
  lng: lngSchema,
  max_distance: z.coerce.number().min(0.5).max(50).default(10),
  skill_id: z.string().min(1).optional(),
});

/** Parses URLSearchParams into a plain object (drops empty values). */
export function queryToObject(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    if (v !== '') out[k] = v;
  });
  return out;
}
