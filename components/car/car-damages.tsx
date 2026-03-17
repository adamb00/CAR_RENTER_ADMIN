'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { MAX_DAMAGE_UPLOADS_PER_REQUEST } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CarDamagesProps, DamageUploadItem, DamageUploadStatus } from './types';
import { areImagesEqual, normalizeImages } from './utils';

export default function CarDamages({
  vehicleId,
  title = 'Sérülés fotók',
  folderPrefix = 'cars/damages',
  initialImages = [],
  onImagesChange,
  persistImages,
}: CarDamagesProps) {
  const normalizedInitialImages = useMemo(
    () => normalizeImages(initialImages),
    [initialImages],
  );
  const [damagesImages, setDamagesImages] = useState<string[]>(
    () => normalizedInitialImages,
  );
  const [damageUploads, setDamageUploads] = useState<DamageUploadItem[]>([]);
  const [damageUploadMessage, setDamageUploadMessage] = useState<string | null>(
    null,
  );
  const [isUploadingDamages, setIsUploadingDamages] = useState(false);
  const [isLoadingDamages, setIsLoadingDamages] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const damageInputRef = useRef<HTMLInputElement | null>(null);
  const canUploadDamages = Boolean(vehicleId);
  const damageFolder = useMemo(
    () => (vehicleId ? `${folderPrefix}/${vehicleId}` : ''),
    [vehicleId, folderPrefix],
  );

  const applyImages = useCallback(
    (nextImages: string[], notify = true) => {
      setDamagesImages(nextImages);
      if (notify) {
        onImagesChange?.(nextImages);
      }
    },
    [onImagesChange],
  );

  const persistImagesSafe = useCallback(
    async (nextImages: string[]) => {
      if (!persistImages) return;
      try {
        const result = await persistImages(nextImages);
        if (!result) return;
        if (typeof result === 'string') {
          setDamageUploadMessage(result);
          return;
        }
        if (result?.error) {
          setDamageUploadMessage(result.error);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Nem sikerült elmenteni a képeket.';
        setDamageUploadMessage(message);
      }
    },
    [persistImages],
  );

  useEffect(() => {
    setDamagesImages((prev) =>
      areImagesEqual(prev, normalizedInitialImages)
        ? prev
        : normalizedInitialImages,
    );
  }, [vehicleId, normalizedInitialImages]);

  useEffect(() => {
    if (!canUploadDamages || !damageFolder) return;
    let isActive = true;
    const loadDamageImages = async () => {
      setIsLoadingDamages(true);
      setDamageUploadMessage(null);
      try {
        const response = await fetch(
          `/api/uploads/cars/list?folder=${encodeURIComponent(damageFolder)}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? 'Nem sikerült lekérni a képeket.');
        }

        const urls = Array.isArray(data?.urls) ? (data.urls as string[]) : [];
        if (!isActive) return;
        const nextImages = normalizeImages(urls);
        applyImages(nextImages);
      } catch (error) {
        if (!isActive) return;
        const message =
          error instanceof Error
            ? error.message
            : 'Nem sikerült lekérni a képeket.';
        setDamageUploadMessage(message);
      } finally {
        if (isActive) setIsLoadingDamages(false);
      }
    };

    void loadDamageImages();

    return () => {
      isActive = false;
    };
  }, [canUploadDamages, damageFolder]);

  const createUploadId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const handleDamageFiles = (files: FileList | null) => {
    if (!canUploadDamages) {
      setDamageUploadMessage(
        'Előbb mentsd el a járművet, utána tölthetsz fel képeket.',
      );
      return;
    }
    if (!files?.length) return;

    const incoming = Array.from(files);
    const images = incoming.filter((file) => file.type.startsWith('image/'));

    if (!images.length) {
      setDamageUploadMessage('Csak képfájlok tölthetők fel.');
      return;
    }

    const nextItems = images.map((file) => ({
      id: createUploadId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending' as DamageUploadStatus,
    }));

    setDamageUploads((prev) => [...prev, ...nextItems]);
    setDamageUploadMessage(null);
  };

  const removeDamageUpload = (id: string) => {
    setDamageUploads((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const removeDamageImage = async (url: string) => {
    const nextImages = damagesImages.filter((item) => item !== url);
    applyImages(nextImages);
    setDamageUploads((prev) => prev.filter((item) => item.uploadedUrl !== url));
    try {
      const response = await fetch('/api/uploads/cars/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [url] }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? 'Nem sikerült törölni a képet.');
      }
      await persistImagesSafe(nextImages);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nem sikerült törölni a képet.';
      setDamageUploadMessage(message);
      setDamagesImages((prev) => {
        const rollback = Array.from(new Set([...(prev ?? []), url]));
        onImagesChange?.(rollback);
        return rollback;
      });
    }
  };

  const uploadDamageImages = async () => {
    if (!canUploadDamages) {
      setDamageUploadMessage(
        'Előbb mentsd el a járművet, utána tölthetsz fel képeket.',
      );
      return;
    }
    const pending = damageUploads.filter(
      (item) => item.status === 'pending' || item.status === 'error',
    );

    if (!pending.length) return;

    setIsUploadingDamages(true);
    setDamageUploadMessage(null);

    for (
      let batchStart = 0;
      batchStart < pending.length;
      batchStart += MAX_DAMAGE_UPLOADS_PER_REQUEST
    ) {
      const batch = pending.slice(
        batchStart,
        batchStart + MAX_DAMAGE_UPLOADS_PER_REQUEST,
      );
      const batchIds = new Set(batch.map((item) => item.id));
      const indexById = new Map(batch.map((item, index) => [item.id, index]));

      setDamageUploads((prev) =>
        prev.map((item) =>
          batchIds.has(item.id)
            ? { ...item, status: 'uploading', error: undefined }
            : item,
        ),
      );

      const uploadFormData = new FormData();
      batch.forEach((item) => uploadFormData.append('files', item.file));
      uploadFormData.append('folder', damageFolder);

      try {
        const response = await fetch('/api/uploads/cars', {
          method: 'POST',
          body: uploadFormData,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? 'Nem sikerült feltölteni a képeket.');
        }

        type UploadedItem = { url?: string };
        const uploadedItems = (data?.urls ?? []) as UploadedItem[];
        const uploadedUrls = uploadedItems
          .map((item) => item?.url)
          .filter((url): url is string => Boolean(url));

        setDamageUploads((prev) =>
          prev.map((item) => {
            if (!batchIds.has(item.id)) return item;
            const index = indexById.get(item.id) ?? -1;
            const url = uploadedItems[index]?.url;
            if (!url) {
              return {
                ...item,
                status: 'error',
                error: 'A feltöltés nem adott vissza URL-t.',
              };
            }
            return {
              ...item,
              status: 'uploaded',
              uploadedUrl: url,
              error: undefined,
            };
          }),
        );

        if (uploadedUrls.length > 0) {
          setDamagesImages((prev) => {
            const next = Array.from(
              new Set([...(prev ?? []), ...uploadedUrls]),
            );
            onImagesChange?.(next);
            void persistImagesSafe(next);
            return next;
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Nem sikerült feltölteni a képeket.';
        setDamageUploads((prev) =>
          prev.map((item) =>
            batchIds.has(item.id)
              ? { ...item, status: 'error', error: message }
              : item,
          ),
        );
        setDamageUploadMessage(message);
        break;
      }
    }

    setIsUploadingDamages(false);
  };

  const pendingDamageUploads = damageUploads.filter(
    (item) => item.status === 'pending' || item.status === 'error',
  );

  const openDamagePicker = () => {
    if (!canUploadDamages) {
      setDamageUploadMessage(
        'Előbb mentsd el a járművet, utána tölthetsz fel képeket.',
      );
      return;
    }
    damageInputRef.current?.click();
  };

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <p className='text-sm font-medium'>{title}</p>
        {isLoadingDamages && (
          <p className='text-xs text-muted-foreground'>
            Sérülés fotók betöltése...
          </p>
        )}
        {damagesImages.length > 0 && (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {damagesImages.map((image) => (
              <div
                key={image}
                className='flex items-center gap-3 rounded-lg border bg-background/80 p-3'
              >
                <img
                  src={image}
                  alt='Sérülés fotó'
                  className='h-16 w-16 rounded-md object-cover'
                />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>Feltöltött kép</p>
                  <p className='text-xs text-muted-foreground'>Mentett fotó</p>
                </div>
                <button
                  type='button'
                  className='text-xs text-muted-foreground transition hover:text-foreground'
                  onClick={() => {
                    void removeDamageImage(image);
                  }}
                >
                  Törlés
                </button>
              </div>
            ))}
          </div>
        )}
        <div
          className={cn(
            'flex min-h-30 cursor-pointer items-center justify-center rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground transition',
            isDragActive
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-muted-foreground/30',
            !canUploadDamages && 'cursor-not-allowed opacity-60',
          )}
          role='button'
          tabIndex={0}
          onClick={openDamagePicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openDamagePicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!canUploadDamages) return;
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            handleDamageFiles(event.dataTransfer.files);
          }}
        >
          {canUploadDamages
            ? 'Húzd ide a képeket, vagy kattints a kiválasztáshoz.'
            : 'Mentés után tölthetsz fel sérülés fotókat.'}
        </div>
        <input
          ref={damageInputRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={(event) => {
            handleDamageFiles(event.target.files);
            if (damageInputRef.current) {
              damageInputRef.current.value = '';
            }
          }}
        />
      </div>
      {damageUploads.length > 0 && (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {damageUploads.map((item) => (
            <div
              key={item.id}
              className='flex items-center gap-3 rounded-lg border bg-background/80 p-3'
            >
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className='h-16 w-16 rounded-md object-cover'
              />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{item.file.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {item.status === 'pending' && 'Várakozik feltöltésre'}
                  {item.status === 'uploading' && 'Feltöltés...'}
                  {item.status === 'uploaded' && 'Feltöltve'}
                  {item.status === 'error' &&
                    (item.error ?? 'Hiba a feltöltésnél')}
                </p>
              </div>
              <button
                type='button'
                className='text-xs text-muted-foreground transition hover:text-foreground'
                onClick={() => removeDamageUpload(item.id)}
              >
                Törlés
              </button>
            </div>
          ))}
        </div>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={openDamagePicker}
          disabled={!canUploadDamages || isUploadingDamages}
        >
          Képek kiválasztása
        </Button>
        <Button
          type='button'
          onClick={uploadDamageImages}
          disabled={
            !canUploadDamages ||
            isUploadingDamages ||
            pendingDamageUploads.length === 0
          }
        >
          {isUploadingDamages ? 'Feltöltés...' : 'Feltöltés'}
        </Button>
        <p className='text-xs text-muted-foreground'>
          {canUploadDamages
            ? `Feltöltési mappa: ${damageFolder}`
            : 'Feltöltési mappa: (mentés után)'}
        </p>
      </div>
      {damageUploadMessage && (
        <p className='text-xs text-muted-foreground'>{damageUploadMessage}</p>
      )}
    </div>
  );
}
