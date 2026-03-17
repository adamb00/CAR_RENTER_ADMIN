'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createCarAction } from '@/actions/createCarAction';
import { updateCarAction } from '@/actions/updateCarAction';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import {
  buildDefaultValues,
  FORM_STORAGE_KEY,
  MAX_IMAGES,
} from '@/components/new-car-form/utils';
import type { NewCarFormProps } from '@/components/new-car-form/types';
import {
  CreateCarFormSchema,
  transformCarFormValues,
  type CreateCarFormInput,
  type CreateCarFormValues,
} from '@/schemas/carSchema';

export function useNewCarForm({
  mode = 'create',
  initialValues,
  carId,
}: NewCarFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasHydratedRef = useRef(false);
  const isEditMode = mode === 'edit';

  const mergedDefaultValues = useMemo<CreateCarFormInput>(
    () => buildDefaultValues(initialValues),
    [initialValues],
  );

  const form = useForm<CreateCarFormInput, any, CreateCarFormValues>({
    resolver: zodResolver<CreateCarFormInput, any, CreateCarFormValues>(
      CreateCarFormSchema,
    ),
    defaultValues: mergedDefaultValues,
  });

  useEffect(() => {
    if (isEditMode) {
      form.reset(mergedDefaultValues);
      return;
    }
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    try {
      const stored = localStorage.getItem(FORM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CreateCarFormInput>;
        form.reset(buildDefaultValues(parsed));
      }
    } catch (error) {
      console.warn('Nem sikerült betölteni a mentett űrlapot.', error);
    }
  }, [form, isEditMode, mergedDefaultValues]);

  useEffect(() => {
    if (isEditMode) return;
    const subscription = form.watch((value) => {
      try {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(value));
      } catch (error) {
        console.warn('Nem sikerült menteni az űrlapot.', error);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditMode]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    const currentImages = form.getValues('images') ?? [];
    const remainingSlots = MAX_IMAGES - currentImages.length;

    if (remainingSlots <= 0) {
      form.setError('images', {
        message: `Legfeljebb ${MAX_IMAGES} képet tölthetsz fel.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const uploadFormData = new FormData();
    filesToUpload.forEach((file) => uploadFormData.append('files', file));
    uploadFormData.append('folder', 'cars');

    setIsUploadingImages(true);
    form.clearErrors('images');

    try {
      const response = await fetch('/api/uploads/cars', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? 'Nem sikerult feltolteni a kepeket.');
      }

      type UploadedUrlItem = { url?: string };
      type UploadResponse = { urls?: UploadedUrlItem[]; error?: string };

      const uploadedUrls: string[] = ((data as UploadResponse)?.urls ?? [])
        .map((item: UploadedUrlItem) => item?.url)
        .filter((url): url is string => Boolean(url));

      if (!uploadedUrls.length) {
        throw new Error('A feltöltés nem adott vissza kép URL-t.');
      }

      const nextImages = [...currentImages, ...uploadedUrls].slice(0, MAX_IMAGES);
      form.setValue('images', nextImages, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nem sikerült feltölteni a képeket.';
      form.setError('images', { message });
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (values: CreateCarFormValues) => {
    setStatus(null);
    const payload = transformCarFormValues(values);

    if (isEditMode && !carId) {
      setStatus({
        type: 'error',
        message: 'Hiányzik a szerkesztett autó azonosítója.',
      });
      return;
    }

    const request = isEditMode
      ? updateCarAction({
          id: carId as string,
          values: payload,
        })
      : createCarAction(payload);

    startTransition(async () => {
      const result = await request;

      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result?.success ?? 'Az autó mentése sikerült.',
      });
      if (isEditMode) {
        form.reset(values);
      } else {
        form.reset(buildDefaultValues());
        localStorage.removeItem(FORM_STORAGE_KEY);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      router.push('/cars');
    });
  };

  return {
    form,
    status,
    isPending,
    isUploadingImages,
    fileInputRef,
    isEditMode,
    handleImageUpload,
    handleSubmit,
  };
}

export type NewCarFormModel = ReturnType<typeof useNewCarForm>;
