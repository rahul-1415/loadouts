import { describe, expect, it } from "vitest";
import { getCatalogCategoryByProductSlug } from "../lib/data/products";

describe("product catalog taxonomy", () => {
  it("maps known product slugs to product categories", () => {
    expect(getCatalogCategoryByProductSlug("sony-a7iv")).toEqual({
      slug: "cameras",
      label: "Cameras",
    });
    expect(getCatalogCategoryByProductSlug("mx-master-3s")).toEqual({
      slug: "mice",
      label: "Mice",
    });
    expect(getCatalogCategoryByProductSlug("unknown-product")).toBeNull();
  });
});
