'use client';
import { createNewUserAction } from '@/actions/createNewUserAction';
import { UserSchemaType } from '@/schemas/userSchema';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem } from '../ui/form';
import { Input } from '../ui/input';

export default function AddUserForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<{ error: string | null }>({ error: null });

  const form = useForm<UserSchemaType>({
    defaultValues: { email: '', name: '', slackUserId: '' },
  });

  const handleOnSubmit = (values: UserSchemaType) => {
    startTransition(async () => {
      const res = await createNewUserAction(values);

      if (res?.error) {
        setError({ error: res.error });
      }
    });
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleOnSubmit)}
        className='flex flex-col gap-4'
      >
        <div className='flex w-full gap-4 mt-10'>
          <div className='flex flex-col flex-1 gap-4 justify-center'>
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
                    <Input label='Slack user ID (pl. U0123ABC)' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className='flex justify-between'>
          {error && <div className='text-sm text-red-500'>{error.error}</div>}
          <Button
            disabled={isPending}
            type='submit'
            variant={'default'}
            className='self-end'
          >
            Új felhasználó létrehozása
          </Button>
        </div>
      </form>
    </Form>
  );
}
