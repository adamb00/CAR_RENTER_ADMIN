import z from 'zod';

export const InsuranceFormSchema = z.object({
  underAgeLimit: z.number().min(0),
  overAgeLimit: z.number().min(0),
  underAgeMultiplier: z.number().min(0),
  overAgeMultiplier: z.number().min(0),
  dailyInsurancePrices: z.record(z.string(), z.number().min(0)),
});

export type InsuranceFormSchemaType = z.infer<typeof InsuranceFormSchema>;
