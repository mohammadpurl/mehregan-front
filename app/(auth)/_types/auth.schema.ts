import { string, trim, length, startsWith, pipe, minLength, maxLength, object} from 'valibot';

const MobileSchema = pipe(
    string(),
    trim(),
    minLength(3, 'نام کاربری باید حداقل سه کاراکتر باشد'),
    // startsWith('09', 'شماره موبایل باید با 09 شروع شود')
);

const PasswordSchema = pipe(
  string(),
  trim(),
  minLength(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
  maxLength(32, 'رمز عبور نباید بیشتر از ۳۲ کاراکتر باشد')
);

export const SignInSchema = object({
    username: MobileSchema,
    password: PasswordSchema
})







