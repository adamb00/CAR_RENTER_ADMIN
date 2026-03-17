'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useNewCarForm } from '@/hooks/use-new-car-form';

import { BaseSection } from './base-section';
import { ColorsSection } from './colors-section';
import { ImagesSection } from './images-section';
import { MonthlyPricesSection } from './monthly-prices-section';
import type { NewCarFormProps } from './types';

export function NewCarForm({ className, ...props }: NewCarFormProps) {
  const formModel = useNewCarForm(props);

  return (
    <Card className={cn('max-w-6xl', className)}>
      <CardHeader>
        <CardTitle>
          {formModel.isEditMode
            ? 'Autó adatainak szerkesztése'
            : 'Új autó felvétele'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...formModel.form}>
          <form
            className='space-y-10'
            onSubmit={formModel.form.handleSubmit(formModel.handleSubmit)}
          >
            <BaseSection formModel={formModel} />
            <MonthlyPricesSection formModel={formModel} />
            <ColorsSection formModel={formModel} />
            <ImagesSection formModel={formModel} />

            {formModel.status && (
              <div
                className={cn(
                  'rounded-md border px-4 py-3 text-sm',
                  formModel.status.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-destructive/40 bg-destructive/10 text-destructive-foreground',
                )}
              >
                {formModel.status.message}
              </div>
            )}

            <Button
              type='submit'
              size='lg'
              disabled={formModel.isPending}
              className='w-full md:w-auto'
            >
              {formModel.isPending
                ? 'Mentés...'
                : formModel.isEditMode
                  ? 'Autó módosítása'
                  : 'Autó felvitele'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
