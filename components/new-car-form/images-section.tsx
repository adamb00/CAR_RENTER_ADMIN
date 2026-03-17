'use client';

import { Upload, X } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import type { NewCarFormModel } from '@/hooks/use-new-car-form';

import { FormSection, MAX_IMAGES } from './utils';

type ImagesSectionProps = {
  formModel: NewCarFormModel;
};

export function ImagesSection({ formModel }: ImagesSectionProps) {
  return (
    <FormSection title='Fotók' description='Legalább egy, legfeljebb három kép.'>
      <FormField
        control={formModel.form.control}
        name='images'
        render={({ field }) => {
          const selectedImages = field.value ?? [];
          const imagesLeft = MAX_IMAGES - selectedImages.length;

          const handleRemoveImage = (url: string) => {
            const nextImages = selectedImages.filter((image) => image !== url);
            field.onChange(nextImages);
          };

          return (
            <FormItem className='space-y-3'>
              <FormLabel>Autó fotók</FormLabel>
              <FormControl>
                <div className='space-y-3'>
                  <div
                    className={cn(
                      'flex flex-wrap gap-3 rounded-md border border-dashed p-4',
                      !selectedImages.length &&
                        'justify-center text-sm text-muted-foreground',
                    )}
                  >
                    {selectedImages.length === 0 && <p>Még nincs feltöltött kép.</p>}
                    {selectedImages.map((image) => (
                      <div
                        key={image}
                        className='group relative h-32 w-32 overflow-hidden rounded-md border'
                      >
                        <Image
                          src={image}
                          alt='Feltöltött autó kép'
                          className='h-full w-full object-cover'
                          fill
                          sizes='128px'
                        />
                        <button
                          type='button'
                          className='absolute right-1 top-1 rounded-full bg-background/80 p-1 text-slate-600 transition hover:text-destructive'
                          onClick={() => handleRemoveImage(image)}
                          aria-label='Kép törlése'
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={imagesLeft <= 0 || formModel.isUploadingImages}
                      onClick={() => formModel.fileInputRef.current?.click()}
                    >
                      <Upload className='mr-2 h-4 w-4' />
                      {formModel.isUploadingImages
                        ? 'Feltoltes...'
                        : 'Képek feltöltése'}
                    </Button>
                    <p className='text-xs text-muted-foreground'>
                      Minimum 1, maximum {MAX_IMAGES} kép. Egyszerre több fájlt is
                      kiválaszthatsz.
                    </p>
                  </div>
                  <input
                    ref={formModel.fileInputRef}
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    onChange={(event) =>
                      formModel.handleImageUpload(event.target.files)
                    }
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </FormSection>
  );
}
