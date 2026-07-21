/**
 * راهنمای کوتاه هر نوع اقدام مرحله — برای کارتابل و برچسب دکمه‌ها.
 */

export type WorkflowStepActionGuide = {
  /** برچسب کوتاه نوع اقدام (چیپ هدر) */
  actionLabel: string;
  /** یک جمله: وظیفه شما چیست */
  taskTitle: string;
  /** گام‌های کوتاه قبل از زدن دکمه اصلی */
  steps: string[];
  /** برچسب دکمه تأیید/ثبت */
  primaryButtonLabel: string;
  /** آیا فیلدهای «اقدام شما» معمولاً بالاتر از جزئیات بیاید */
  prioritizeAction: boolean;
};

const DEFAULT_GUIDE: WorkflowStepActionGuide = {
  actionLabel: 'بررسی و تأیید',
  taskTitle: 'این درخواست را بررسی کنید؛ سپس تأیید یا رد کنید.',
  steps: [
    'جزئیات درخواست را بخوانید.',
    'در صورت نیاز یادداشت بنویسید.',
    'دکمه تأیید را بزنید، یا با دلیل رد کنید.',
  ],
  primaryButtonLabel: 'تأیید',
  prioritizeAction: false,
};

const BY_ACTION: Record<string, WorkflowStepActionGuide> = {
  approval: DEFAULT_GUIDE,
  fill_stock: {
    actionLabel: 'تکمیل موجودی',
    taskTitle: 'موجودی انبار هر قلم را وارد کنید و سپس تأیید کنید.',
    steps: [
      'در بخش جزئیات، ستون موجودی را برای هر قلم پر کنید.',
      'دکمه تأیید را بزنید.',
    ],
    primaryButtonLabel: 'تأیید موجودی انبار',
    prioritizeAction: false,
  },
  upload_proforma: {
    actionLabel: 'ثبت پیش‌فاکتور',
    taskTitle: 'پیش‌فاکتور را ثبت کنید و برای تأیید بعدی بفرستید.',
    steps: [
      'در بخش جزئیات، مبلغ کل و فایل پیش‌فاکتور را وارد کنید.',
      'دکمه «ثبت و ارسال برای تأیید» را بزنید.',
    ],
    primaryButtonLabel: 'ثبت و ارسال برای تأیید',
    prioritizeAction: false,
  },
  approve_proforma: {
    actionLabel: 'تأیید پیش‌فاکتور',
    taskTitle: 'شرایط پرداخت را مشخص کنید و پیش‌فاکتور را تأیید کنید.',
    steps: [
      'محل پرداخت (بانک یا تنخواه) را انتخاب کنید.',
      'روش پرداخت (نقدی یا چک) را مشخص کنید؛ در صورت چک، برنامه چک‌ها را کامل کنید.',
      'توضیح روش پرداخت را بنویسید و تأیید کنید.',
    ],
    primaryButtonLabel: 'تأیید پیش‌فاکتور و شرایط پرداخت',
    prioritizeAction: true,
  },
  upload_invoice: {
    actionLabel: 'آپلود فاکتور',
    taskTitle: 'فایل فاکتور را بارگذاری و ارسال کنید.',
    steps: [
      'در بخش جزئیات، فایل فاکتور را انتخاب کنید.',
      'دکمه «ثبت و ارسال فاکتور» را بزنید.',
    ],
    primaryButtonLabel: 'ثبت و ارسال فاکتور',
    prioritizeAction: false,
  },
  mark_payment: {
    actionLabel: 'ثبت در سپیدار',
    taskTitle: 'کار را در سپیدار ثبت کنید؛ سپس در همین سامانه اعلام کنید.',
    steps: [
      'سند را در نرم‌افزار سپیدار (جدا از این سامانه) ثبت کنید.',
      'در صورت نیاز فیش/چک را در همین فرم آپلود کنید.',
      'تیک «ثبت شد» را بزنید و دکمه پایین را فشار دهید.',
    ],
    primaryButtonLabel: 'در نرم‌افزار سپیدار ثبت شد',
    prioritizeAction: true,
  },
  upload_bol: {
    actionLabel: 'آپلود بارنامه',
    taskTitle: 'فایل بارنامه را پیوست کنید و تأیید کنید.',
    steps: [
      'فایل بارنامه را در بخش «اقدام شما» آپلود کنید.',
      'دکمه تأیید را بزنید.',
    ],
    primaryButtonLabel: 'تأیید با بارنامه',
    prioritizeAction: true,
  },
  confirm_receipt: {
    actionLabel: 'تأیید دریافت',
    taskTitle: 'پس از اطمینان از دریافت کالا، تأیید کنید.',
    steps: ['جزئیات را بررسی کنید.', 'دکمه «تأیید دریافت کالا» را بزنید.'],
    primaryButtonLabel: 'تأیید دریافت کالا',
    prioritizeAction: true,
  },
  confirm_warehouse_sepidar: {
    actionLabel: 'ورود انبار',
    taskTitle: 'ثبت سپیدار را تأیید کنید؛ کالا وارد همان انبار ثبت‌شده در درخواست می‌شود.',
    steps: [
      'انبار مقصد از مرحله ثبت درخواست مشخص است (نیازی به انتخاب دوباره نیست).',
      'تیک «در نرم‌افزار سپیدار ثبت شده است» را بزنید و تأیید کنید.',
    ],
    primaryButtonLabel: 'تأیید ورود انبار',
    prioritizeAction: true,
  },
  confirm_sepidar: {
    actionLabel: 'تأیید سپیدار',
    taskTitle: 'ثبت در سپیدار را بررسی و تأیید کنید.',
    steps: [
      'ثبت را در نرم‌افزار سپیدار بررسی کنید.',
      'تیک مربوطه را بزنید و تأیید کنید.',
    ],
    primaryButtonLabel: 'تأیید ثبت سپیدار',
    prioritizeAction: true,
  },
  final_payment_approval: {
    actionLabel: 'تأیید سپیدار',
    taskTitle: 'ثبت در سپیدار را بررسی و تأیید کنید.',
    steps: [
      'ثبت را در نرم‌افزار سپیدار بررسی کنید.',
      'تیک مربوطه را بزنید و تأیید کنید.',
    ],
    primaryButtonLabel: 'تأیید ثبت سپیدار',
    prioritizeAction: true,
  },
};

export function getWorkflowStepActionGuide(
  stepAction: string | null | undefined,
): WorkflowStepActionGuide {
  const key = (stepAction || 'approval').trim() || 'approval';
  return BY_ACTION[key] ?? DEFAULT_GUIDE;
}
