'use client';

import { createFleetVehicleAction } from '@/actions/createFleetVehicleAction';
import { updateFleetVehicleAction } from '@/actions/updateFleetVehicleAction';
import { updateFleetVehicleDamagesImagesAction } from '@/actions/updateFleetVehicleDamagesImagesAction';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState, useTransition } from 'react';

import type {
  FleetAddFormProps,
  FleetFormValues,
  ServiceCostDraft,
} from '@/components/car/types';
import { emptyFleetForm } from '@/components/car/types';
import {
  buildFleetFormSubmission,
  createServiceCostDraft,
  getFleetFormSubmitLabel,
  getFleetFormTitle,
  normalizeFleetFormInitialValues,
  placesOptions,
  statusOptions,
} from '@/components/car/utils';

export function useCarFleetAddForm({
  carId,
  vehicleId,
  mode = 'create',
  section,
  initialValues,
}: FleetAddFormProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit';
  const normalizedInitialValues = useMemo(
    () => normalizeFleetFormInitialValues(initialValues),
    [initialValues],
  );
  const [form, setForm] = useState<FleetFormValues>(normalizedInitialValues);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(normalizedInitialValues);
    setStatusMessage(null);
  }, [normalizedInitialValues]);

  const redirectToEditPage = () => {
    router.push(`/cars/${carId}/edit`);
  };

  const updateField = <K extends keyof FleetFormValues>(
    key: K,
    value: FleetFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setStatus = (nextStatus: string) => {
    const selected = statusOptions.find((opt) => opt.value === nextStatus);
    updateField('status', selected?.label ?? 'Elérhető');
  };

  const setLocation = (location: FleetFormValues['location']) => {
    updateField('location', location);
  };

  const addServiceCost = () => {
    setForm((prev) => ({
      ...prev,
      serviceCosts: [...prev.serviceCosts, createServiceCostDraft()],
    }));
  };

  const updateServiceCost = (
    serviceCostId: string,
    key: keyof Omit<ServiceCostDraft, 'id'>,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      serviceCosts: prev.serviceCosts.map((item) =>
        item.id === serviceCostId ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const removeServiceCost = (serviceCostId: string) => {
    setForm((prev) => ({
      ...prev,
      serviceCosts: prev.serviceCosts.filter((item) => item.id !== serviceCostId),
    }));
  };

  const persistDamageImages = async (images: string[]) => {
    if (!vehicleId) return;
    return updateFleetVehicleDamagesImagesAction({
      id: vehicleId,
      carId,
      damagesImages: images,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEditMode && !vehicleId) {
      setStatusMessage('Hiányzik a flottajármű azonosítója.');
      return;
    }

    const submission = buildFleetFormSubmission(form, carId);
    if ('error' in submission) {
      setStatusMessage(submission.error);
      return;
    }

    startTransition(async () => {
      const result = isEditMode
        ? await updateFleetVehicleAction({
            id: vehicleId as string,
            ...submission.payload,
          })
        : await createFleetVehicleAction(submission.payload);

      if (result?.error) {
        setStatusMessage(result.error);
        return;
      }

      setStatusMessage(
        result?.success ??
          (isEditMode
            ? 'Az autó adatai frissítve.'
            : 'Autó hozzáadva a flottához.'),
      );

      if (isEditMode) {
        redirectToEditPage();
        return;
      }
      if (result?.id) {
        router.push(`/cars/${carId}/edit/fleet/${result.id}`);
        return;
      }

      setForm(emptyFleetForm);
      redirectToEditPage();
    });
  };

  const title = getFleetFormTitle(isEditMode, section);
  const submitLabel = getFleetFormSubmitLabel(isPending, isEditMode, section);
  const showBasicSection = !section || section === 'base';
  const showServiceSection = !section || section === 'service';
  const showCostsSection = !section || section === 'costs';
  const selectedPlace = placesOptions.find((place) => place.label === form.location);
  const selectedStatusValue =
    statusOptions.find((opt) => opt.label === form.status)?.value ?? 'available';

  return {
    carId,
    vehicleId,
    form,
    isPending,
    statusMessage,
    title,
    submitLabel,
    isEditMode,
    showBasicSection,
    showServiceSection,
    showCostsSection,
    placesOptions,
    statusOptions,
    selectedPlace,
    selectedStatusValue,
    updateField,
    setStatus,
    setLocation,
    addServiceCost,
    updateServiceCost,
    removeServiceCost,
    persistDamageImages,
    redirectToEditPage,
    handleSubmit,
  };
}

export type CarFleetAddFormModel = ReturnType<typeof useCarFleetAddForm>;
