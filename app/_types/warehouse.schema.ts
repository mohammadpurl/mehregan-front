import { 
  object, 
  string, 
  enum_, 
  minLength, 
  maxLength, 
  pipe, 
  trim,
  optional,
  array,
  transform
} from 'valibot';
import { WarehouseFormType } from './warehouse.types';

const LocationNameSchema = pipe(
  string(),
  trim(),
  minLength(2, 'نام مکان باید حداقل 2 کاراکتر باشد'),
  maxLength(100, 'نام مکان نباید بیشتر از 100 کاراکتر باشد')
);

const ReceiverNameSchema = pipe(
  string(),
  trim(),
  minLength(2, 'نام دریافت کننده باید حداقل 2 کاراکتر باشد'),
  maxLength(100, 'نام دریافت کننده نباید بیشتر از 100 کاراکتر باشد')
);

const DescriptionSchema = pipe(
  string(),
  trim(),
  maxLength(2000, 'توضیحات نباید بیشتر از 2000 کاراکتر باشد')
);

const ItemNameSchema = pipe(
  string(),
  trim(),
  minLength(2, 'نام کالا باید حداقل 2 کاراکتر باشد'),
  maxLength(100, 'نام کالا نباید بیشتر از 100 کاراکتر باشد')
);

const UnitSchema = pipe(
  string(),
  trim(),
  minLength(1, 'واحد اندازه‌گیری را وارد کنید'),
  maxLength(20, 'واحد اندازه‌گیری نباید بیشتر از 20 کاراکتر باشد')
);

export const WarehouseLocationSchema = object({
  id: string('شناسه مکان را وارد کنید'),
  name: LocationNameSchema,
  address: optional(pipe(string(), trim(), maxLength(200))),
});

export const WarehouseItemSchema = object({
  name: ItemNameSchema,
  quantity: pipe(
    string(),
    transform((input) => {
      const num = Number(input);
      if (isNaN(num) || num <= 0) {
        throw new Error('تعداد باید عددی مثبت باشد');
      }
      return input; // Return string as is for form handling
    })
  ),
  unit: UnitSchema,
  description: optional(pipe(string(), trim(), maxLength(500))),
});

export const WarehouseFormSchema = object({
  type: enum_(WarehouseFormType, 'نوع فرم انبار را انتخاب کنید'),
  source: WarehouseLocationSchema,
  destination: WarehouseLocationSchema,
  date: string('تاریخ را وارد کنید'),
  receiverName: ReceiverNameSchema,
  description: optional(DescriptionSchema),
  items: optional(array(WarehouseItemSchema)),
});
