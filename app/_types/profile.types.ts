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
  national_id: string;
  father_name: string;
  card_number?: string;
  sheba_number?: string;
}
