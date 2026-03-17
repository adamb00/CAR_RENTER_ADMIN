export type CarListEntry = {
  id: string;
  manufacturer: string;
  model: string;
  seats: number;
  smallLuggage: number;
  largeLuggage: number;
  bodyType: string;
  fuel: string;
  transmission: string;
  monthlyPrices: number[];
  colors: string[];
};

export type CarWithComputed = CarListEntry;

export type FleetStatus = 'available' | 'rented' | 'reserved' | 'maintenance';

export type FleetRow = {
  id: string;
  plate: string;
  odometer: number;
  status: FleetStatus;
  year: string;
  firstRegistration: string;
  location: string;
  locationColor?: string;
  vin: string;
  engineNumber: string;
  addedAt: string;
  inspectionExpiry: string;
  notes: string;
  damages: string;
};

export type CarFleetSectionProps = {
  carLabel: string;
  carId: string;
  initialRows: FleetRow[];
};

export type DamageUploadStatus = 'pending' | 'uploading' | 'uploaded' | 'error';
export type DamageUploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: DamageUploadStatus;
  uploadedUrl?: string;
  error?: string;
};

export type CarDamagesProps = {
  carId: string;
  vehicleId?: string;
  title?: string;
  folderPrefix?: string;
  initialImages?: string[];
  onImagesChange?: (images: string[]) => void;
  persistImages?: (
    images: string[],
  ) =>
    | Promise<{ error?: string } | string | void>
    | { error?: string }
    | string
    | void;
};

import { DEFAULT_FLEET_PLACE, type FleetPlaceLabel } from '@/lib/fleet-places';

export type FleetStatusLabel =
  | 'Elérhető'
  | 'Kikölcsönözve'
  | 'Szerviz'
  | 'Foglalt';

export type FleetStatusValue =
  | 'available'
  | 'rented'
  | 'reserved'
  | 'maintenance';

export type FleetPlacesOptions = FleetPlaceLabel;

export type FleetEditSection = 'base' | 'service' | 'costs';

export type ServiceCostDraft = {
  id: string;
  serviceDate: string;
  serviceFee: string;
  note: string;
};

export type ServiceCostStored = {
  serviceDate: string;
  serviceFee: number;
  note?: string;
};

export const emptyFleetForm = {
  plate: '',
  odometer: '',
  serviceIntervalKm: '',
  lastServiceMileage: '',
  lastServiceAt: '',
  status: 'Elérhető' as FleetStatusLabel,
  year: '',
  firstRegistration: '',
  location: DEFAULT_FLEET_PLACE as FleetPlacesOptions,
  vin: '',
  engineNumber: '',
  addedAt: '',
  inspectionExpiry: '',
  nextServiceFrom: '',
  nextServiceTo: '',
  notes: '',
  serviceCosts: [] as ServiceCostDraft[],
  damages: '',
  damagesImages: [] as string[],
};

export type FleetFormValues = typeof emptyFleetForm;

export type FleetAddFormProps = {
  carId: string;
  vehicleId?: string;
  mode?: 'create' | 'edit';
  section?: FleetEditSection;
  initialValues?: Partial<Omit<FleetFormValues, 'status' | 'location'>> & {
    status?: FleetFormValues['status'] | FleetStatusValue;
    location?: FleetFormValues['location'] | FleetPlacesOptions | string;
  };
};
