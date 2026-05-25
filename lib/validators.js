import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const positiveMoney = z.coerce.number().positive('Amount must be greater than 0');
const nonNegativeMoney = z.coerce.number().nonnegative('Amount cannot be negative');

export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(1, 'Phone is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  ratePerDollar: positiveMoney.default(120),
  serviceType: z.enum(['campaign', 'wallet']).default('campaign'),
  rates: z.object({
    Facebook: positiveMoney,
    Google: positiveMoney,
    TikTok: positiveMoney,
  }),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, 'Campaign name is required'),
  client: objectId,
  platform: z.enum(['Facebook', 'Google', 'TikTok']),
  type: z.enum(['daily', 'lifetime']).default('daily'),
  dailyBudget: nonNegativeMoney.optional(),
  totalBudget: nonNegativeMoney.optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(['running', 'paused']).default('running'),
  manualSpendOverride: z.coerce.number().nonnegative('Spend override must be non-negative').nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.endDate <= value.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be after start date' });
  }
  if (value.type === 'daily' && (!value.dailyBudget || value.dailyBudget <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dailyBudget'], message: 'Daily budget must be greater than 0' });
  }
  if (value.type === 'lifetime' && (!value.totalBudget || value.totalBudget <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['totalBudget'], message: 'Total budget must be greater than 0' });
  }
});

export const transactionSchema = z.object({
  client: objectId,
  platform: z.enum(['Facebook', 'Google', 'TikTok', 'General']).default('General'),
  bdtAmount: positiveMoney,
  date: z.coerce.date().default(() => new Date()),
  note: z.string().trim().max(500).optional(),
});

export const loadSchema = z.object({
  client: objectId,
  usdAmount: positiveMoney,
  date: z.coerce.date().default(() => new Date()),
  note: z.string().trim().max(500).optional(),
});

export const userSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  name: z.string().trim().min(1, 'Name is required').default('Team Member'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['owner', 'admin', 'accountant']).default('accountant'),
});

export function formatZodError(error) {
  return error.issues?.map((issue) => issue.message).join(', ') || 'Invalid input';
}
