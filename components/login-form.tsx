'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoginSchema } from '@/schemas/authSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { loginAction } from '@/actions/loginAction';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
   const [isPending, startTransition] = useTransition();
   const form = useForm<z.infer<typeof LoginSchema>>({
      resolver: zodResolver(LoginSchema),
      defaultValues: {
         email: '',
         password: '',
      },
   });

   const onSubmit = (values: z.infer<typeof LoginSchema>) => {
      startTransition(() => {
         loginAction(values);
      });
   };
   return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
         <Card>
            <CardContent>
               <Form {...form}>
                  <form className='flex flex-col gap-6' onSubmit={form.handleSubmit(onSubmit)}>
                     <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                           <FormItem className='grid gap-3'>
                              <FormControl>
                                 <Input {...field} id='email' type='email' label='E-mail cím' required />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name='password'
                        render={({ field }) => (
                           <FormItem className='grid gap-3'>
                              <FormControl>
                                 <Input {...field} id='password' label='Jelszó' type='password' required />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />

                     <div className='flex flex-col gap-3'>
                        <Button disabled={isPending} type='submit' size={'lg'} className='w-full'>
                           Bejelentkezés
                        </Button>
                     </div>
                  </form>
               </Form>
            </CardContent>
         </Card>
      </div>
   );
}
