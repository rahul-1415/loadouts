export const FIXED_CATEGORY_MIN_SLUG = "cat-001";
export const FIXED_CATEGORY_MAX_SLUG = "cat-100";

const FIXED_CATEGORY_SLUG_REGEX = /^cat-(00[1-9]|0[1-9][0-9]|100)$/i;

export function normalizeCategorySlug(slug: string) {
  return slug.trim().toLowerCase();
}

export function isFixedCategorySlug(slug: string) {
  return FIXED_CATEGORY_SLUG_REGEX.test(normalizeCategorySlug(slug));
}
