import type { ItemCreateFormValues, ItemFormValues, ItemUpdateFormValues } from '../_types/item.schema';
import type { CreateItemModel, Item, UpdateItemModel } from '@/app/_types/item.types';

export function categoryIdFromForm(val: string | undefined): number {
  if (val === undefined || val === null) return NaN;
  const s = String(val).trim();
  if (s === '') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function parseFiniteId(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function formToModel(data: ItemCreateFormValues): CreateItemModel {
  const categoryId = categoryIdFromForm(data.category_id);
  return {
    name: data.name,
    sku: data.sku || undefined,
    category_id: Number.isFinite(categoryId) ? categoryId : undefined,
    unit: data.unit || undefined,
    is_active: data.is_active === 'true',
    description: data.description || undefined,
  };
}

export function createFormToModel(data: ItemCreateFormValues): CreateItemModel {
  return formToModel(data);
}

export function updateFormToModel(data: ItemUpdateFormValues): UpdateItemModel {
  return formToModel(data);
}

export function itemToFormDefaults(
  item?: Pick<Item, 'name' | 'sku' | 'unit' | 'is_active' | 'description' | 'category_id'>,
): ItemFormValues {
  return {
    name: item?.name ?? '',
    sku: item?.sku ?? '',
    category_id: item?.category_id != null ? String(item.category_id) : '',
    unit: item?.unit ?? '',
    is_active: item?.is_active === false ? 'false' : 'true',
    description: item?.description ?? '',
  };
}
