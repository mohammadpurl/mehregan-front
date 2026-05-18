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
  instance,
  transform
} from 'valibot';
import { ProductType } from './product-request.types';

const ReasonSchema = pipe(
  string(),
  trim(),
  minLength(5, 'دلیل درخواست باید حداقل 5 کاراکتر باشد'),
  maxLength(500, 'دلیل درخواست نباید بیشتر از 500 کاراکتر باشد')
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

export const ProductRequestItemSchema = object({
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

export const ProductRequestFormSchema = object({
  productType: enum_(ProductType, 'نوع کالا را انتخاب کنید'),
  reason: ReasonSchema,
  description: optional(DescriptionSchema),
  preInvoice: optional(instance(File)),
  documents: optional(array(instance(File))),
  items: optional(array(ProductRequestItemSchema)),
});
