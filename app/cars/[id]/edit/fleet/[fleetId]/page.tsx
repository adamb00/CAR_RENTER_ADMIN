import { redirect } from 'next/navigation';

export default async function FleetVehicleEditRootPage({
  params,
}: {
  params: Promise<{ id: string; fleetId: string }>;
}) {
  const { id, fleetId } = await params;
  redirect(`/cars/${id}/edit/fleet/${fleetId}/base`);
}
