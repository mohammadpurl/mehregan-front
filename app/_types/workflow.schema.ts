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
  minValue,
  transform,
} from 'valibot';
import { WorkflowType } from './workflow.types';

const TitleSchema = pipe(
  string(),
  trim(),
  minLength(3, 'عنوان باید حداقل 3 کاراکتر باشد'),
  maxLength(200, 'عنوان نباید بیشتر از 200 کاراکتر باشد')
);

const DescriptionSchema = pipe(
  string(),
  trim(),
  minLength(10, 'توضیحات باید حداقل 10 کاراکتر باشد'),
  maxLength(2000, 'توضیحات نباید بیشتر از 2000 کاراکتر باشد')
);

const ReceiverIdSchema = pipe(
  string(),
  transform((v) => Number(v)),
  minValue(1, 'گیرنده مرحله اول را انتخاب کنید'),
);

export const WorkflowFormSchema = object({
  type: optional(enum_(WorkflowType, 'نوع گردش کار را انتخاب کنید')),
  title: TitleSchema,
  description: DescriptionSchema,
  receiver_id: ReceiverIdSchema,
  attachments: optional(array(instance(File))),
});
