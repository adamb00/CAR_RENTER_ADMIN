import { z } from 'zod';

export const vehicleHandoverSchema = z.object({
  bookingId: z.string().min(1),
  fleetVehicleId: z.string().min(1),
  direction: z.enum(['out', 'in']).optional(),
  handoverAt: z.string().optional(),
  handoverBy: z.string().optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  rangeKm: z.coerce.number().int().min(0).optional(),
  tip: z.coerce.number().min(0).optional(),
  fuelCost: z.coerce.number().min(0).optional(),
  ferryCost: z.coerce.number().min(0).optional(),
  cleaningCost: z.coerce.number().min(0).optional(),
  commission: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  damages: z.string().optional(),
  damagesImages: z.array(z.string()).optional(),
  location: z.string().optional(),
});
