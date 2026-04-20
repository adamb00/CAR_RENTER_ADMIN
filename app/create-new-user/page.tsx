'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { createUserAction } from '@/actions/createNewUserAction';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import SignaturePad, {
  SignaturePadHandle,
} from '@/components/ui/signature-pad';
import { NewUserSchema, NewUserSchemaType } from '@/schemas/userSchema';
import { useRef, useTransition } from 'react';

export default function Page() {
  const params = useSearchParams();
  const name = params?.get('name');
  const email = params?.get('email');
  const slackUserId = params?.get('slackUserId');
  const signatureRef = useRef<SignaturePadHandle>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<NewUserSchemaType>({
    resolver: zodResolver(NewUserSchema),
    defaultValues: {
      name: name ?? '',
      email: email ?? '',
      slackUserId: slackUserId ?? '',
      password: '',
      signatureData: '',
    },
  });

  const handleOnSubmit = (values: NewUserSchemaType) => {
    startTransition(async () => {
      await createUserAction(values);
    });
  };

  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleOnSubmit)}
          className='flex flex-col gap-6 w-1/2 '
        >
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label='E-mail cím' {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label='Teljes név' {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='slackUserId'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label='Slack user ID' {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem className='grid gap-3'>
                <FormControl>
                  <Input
                    {...field}
                    id='password'
                    label='Jelszó'
                    type='password'
                    required
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='signatureData'
            render={({ field }) => (
              <FormItem className='flex-1'>
                <FormControl>
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>Aláírás</span>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          signatureRef.current?.clear();
                          field.onChange('');
                        }}
                      >
                        Törlés
                      </Button>
                    </div>
                    <SignaturePad
                      ref={signatureRef}
                      onChange={(dataUrl) => field.onChange(dataUrl)}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            disabled={isPending}
            type='submit'
            variant={'default'}
            className='self-end'
          >
            Regisztráció befejezése
          </Button>
        </form>
      </Form>
    </div>
  );
}
