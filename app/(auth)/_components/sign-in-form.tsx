'use client';

import { FC, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SignInModel } from "../_types/auth.types";
import { SignInSchema } from "../_types/auth.schema";
import { TextBox } from "@/app/components/textbox";
import { Button } from "@/app/components/button";
import Phone from "@/app/_assets/phone";
import Eye from "@/app/_assets/eye";
import { useFormState } from "react-dom";
import { signinAction } from "@/app/_actions/auth-actions";
import { useNotificationStore } from "@/app/_store/notification.store";




export const SignInForm: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInModel>({
    resolver: valibotResolver(SignInSchema),
  });

  const [formState, action] = useFormState(signinAction, null);
  const [isPending, startTransition] = useTransition();

  const showNotification = useNotificationStore(
    (state) => state.showNotification
);

  useEffect(() => {
    debugger
    if (formState && !formState.success && formState.error) {
        showNotification({
            message: formState.error,
            type: "error",
        });
    } else if (formState && formState.success) {
        // router.push(`/verify?mobile=${getValues("mobile")}`);
        showNotification({
            message: "کد تایید به شماره شما ارسال شد",
            type: "info",
        });
        console.log(formState);
    }
  }, [formState, showNotification]);
  const onSubmit = async (data: SignInModel) => {
    startTransition(async () => {
      const response = await signinAction(data);
      console.log("response isss" ,response);
     
    });
  };
  return (
    <div className=" w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col gap-6 mt-6'>
        <TextBox name={'username'} register={register} errors={errors}  placeholder="نام کاربری" label="نام کاربری" icon={<Phone />} />
        <TextBox name={'password'} register={register} errors={errors} type="password" placeholder="رمز عبور" label="رمز عبورت رو وارد کن" icon={<Eye />} />
        <Button type="submit" loading={isPending} className="w-full">ورود به پلتفرم</Button>
      </form>
    </div>
  );
};
