'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { createMissionRequestAction } from '@/app/_actions/mission-request-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import { CommentWithVoice } from '@/app/dashboard/ad-hoc-tasks/_components/comment-with-voice';
import {
  MissionRequestCreateSchema,
  type MissionRequestCreateValues,
} from '../_types/mission-request.schema';

type Props = {
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

export function MissionRequestNewForm({
  formId = 'mission-request-new-form',
  onSuccess,
  onBusyChange,
}: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();

  const form = useForm<MissionRequestCreateValues>({
    resolver: zodResolver(MissionRequestCreateSchema),
    defaultValues: { destination: '', reason: '', vehicle: '' },
  });

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  const onSubmit = (values: MissionRequestCreateValues) => {
    startTransition(async () => {
      const result = await createMissionRequestAction(values);
      if (result.success) {
        notifySuccess('درخواست ماموریت ثبت شد و برای تأیید ارسال شد');
        form.reset();
        onSuccess?.();
      } else {
        notifyError(result.error || 'ثبت ناموفق بود');
      }
    });
  };

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>محل ماموریت *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="مثلاً تهران — اداره مالیات" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehicle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وسیله نقلیه *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="مثلاً خودرو سازمانی / اتوبوس" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <CommentWithVoice
                  label="دلیل ماموریت *"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="هدف و توضیح ماموریت را بنویسید یا با میکروفون بگویید..."
                  disabled={isPending}
                  rows={6}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
