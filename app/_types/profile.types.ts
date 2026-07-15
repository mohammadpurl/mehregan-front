export interface ProfileDto {
  id: number;
  username: string;
  email: string;
  mobile: string;
  first_name: string;
  last_name: string;
  national_id: string;
  father_name: string;
  pic: string;
  full_name: string;
  /** شماره حساب بانکی (اختیاری) */
  account_number?: string;
  /** شماره کارت بانکی (اختیاری) */
  card_number?: string;
  /** شماره شبا (اختیاری) — نام فیلد در API */
  sheba_number?: string;
  /** @deprecated سازگاری پاسخ قدیمی */
  bank_account_number?: string;
}

export interface UpdateProfileModel {
  email: string;
  mobile: string;
  first_name: string;
  last_name: string;
  national_id?: string;
  father_name?: string;
  account_number?: string | null;
  card_number?: string | null;
  sheba_number?: string | null;
}
