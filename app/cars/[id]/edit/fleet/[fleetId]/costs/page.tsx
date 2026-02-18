import { FleetEditContent } from '../fleet-edit-content';

export default async function FleetVehicleEditCostsPage({
  params,
}: {
  params: Promise<{ id: string; fleetId: string }>;
}) {
  const { id, fleetId } = await params;
  return <FleetEditContent carId={id} fleetId={fleetId} section='costs' />;
}
