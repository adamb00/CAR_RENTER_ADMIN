'use client';

import Image from 'next/image';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ResidenceCardGalleryProps = {
  images: string[];
};

export function ResidenceCardGallery({
  images,
}: ResidenceCardGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [imageRotations, setImageRotations] = useState<Record<number, number>>(
    {}
  );

  function rotateSelectedImage(rotation: number) {
    if (selectedImageIndex === null) {
      return;
    }

    setImageRotations((previousRotations) => {
      const currentRotation = previousRotations[selectedImageIndex] ?? 0;

      return {
        ...previousRotations,
        [selectedImageIndex]: (currentRotation + rotation + 360) % 360,
      };
    });
  }

  if (images.length === 0) {
    return (
      <div className='flex flex-col rounded-lg border px-3 py-3'>
        <span className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Rezidens kártya
        </span>
        <span className='text-base font-medium text-foreground'>—</span>
      </div>
    );
  }

  return (
    <div className='rounded-lg border px-3 py-3'>
      <div className='mb-3'>
        <span className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Rezidens kártya
        </span>
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        {images.map((image, index) => (
          <Dialog
            key={`${image}-${index}`}
            open={selectedImageIndex === index}
            onOpenChange={(open) => setSelectedImageIndex(open ? index : null)}
          >
            <DialogTrigger asChild>
              <button
                type='button'
                className='group overflow-hidden rounded-lg border bg-muted/20 text-left transition hover:border-primary/60'
              >
                <div className='relative aspect-4/3 w-full'>
                  <Image
                    src={image}
                    alt={`Rezidens kártya ${index + 1}`}
                    fill
                    className='object-cover transition duration-200 group-hover:scale-[1.02]'
                    sizes='(max-width: 640px) 100vw, 50vw'
                  />
                </div>
                <div className='px-3 py-2 text-sm font-medium text-foreground'>
                  Kép {index + 1}
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] overflow-hidden p-4 sm:p-6'>
              <DialogHeader>
                <DialogTitle>Rezidens kártya</DialogTitle>
                <DialogDescription>
                  Kattints kívülre vagy nyomj ESC-et a bezáráshoz.
                </DialogDescription>
              </DialogHeader>
              <div className='mt-4 flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => rotateSelectedImage(-90)}
                >
                  Forgatás balra
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => rotateSelectedImage(90)}
                >
                  Forgatás jobbra
                </Button>
              </div>
              <div className='relative mt-4 aspect-4/3 w-full overflow-hidden rounded-lg bg-muted/30'>
                <Image
                  src={image}
                  alt={`Rezidens kártya nagyítva ${index + 1}`}
                  fill
                  className='object-contain transition-transform duration-200'
                  style={{
                    transform: `rotate(${imageRotations[index] ?? 0}deg)`,
                  }}
                  sizes='90vw'
                />
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
