import { z } from 'zod';

export const fleetVehicleSchema = z.object({
  carId: z.string().min(1),
  plate: z.string().min(1, 'Rendszám kötelező'),
  odometer: z.coerce.number().int().min(0).optional(),
  serviceIntervalKm: z.coerce.number().int().min(0).optional(),
  lastServiceMileage: z.coerce.number().int().min(0).optional(),
  lastServiceAt: z.string().optional(),
  status: z.enum(['available', 'rented', 'reserved', 'maintenance']),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  firstRegistration: z.string().optional(),
  location: z.string().optional(),
  vin: z.string().optional(),
  engineNumber: z.string().optional(),
  addedAt: z.string().optional(),
  inspectionExpiry: z.string().optional(),
  notes: z.string().optional(),
  damages: z.string().optional(),
  damagesImages: z.array(z.string()).optional(),
});
