import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProductCatalog = vi.fn();

vi.mock("../lib/data/products", () => ({
  getProductCatalog: mockGetProductCatalog,
}));

describe("/api/products", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetProductCatalog.mockReset();
  });

  it("forwards query, brand, category, and limit filters", async () => {
    mockGetProductCatalog.mockResolvedValue({
      items: [{ id: "prod-1", name: "MX Master 3S" }],
      totalCount: 1,
      filters: {
        brands: ["Logitech"],
        categories: [{ slug: "mice", label: "Mice", count: 1 }],
      },
    });

    const { GET } = await import("../app/api/products/route");
    const response = await GET(
      new Request(
        "http://localhost/api/products?q=mx&brand=Logitech&category=mice&limit=24"
      )
    );

    expect(mockGetProductCatalog).toHaveBeenCalledWith({
      query: "mx",
      brand: "Logitech",
      category: "mice",
      limit: 24,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "prod-1", name: "MX Master 3S" }],
      meta: {
        totalCount: 1,
        brands: ["Logitech"],
        categories: [{ slug: "mice", label: "Mice", count: 1 }],
      },
    });
  });
});
