import { describe, expect, it } from "vitest";
import { categories, allProducts, topSaver } from "@/data/home";
import { productDetails } from "@/data/product-details";
import { findSeedProblems, SeedDataError } from "../../seed";

const good = {
  categories: [{ slug: "pet-foods", name: "Pet Foods" }],
  products: [{ id: "p1", name: "Bone Biscuits", category: "Pet Foods", price: 8.9, oldPrice: 9.9 }],
  detailIds: ["p1"],
  dealIds: ["p1"],
};

describe("findSeedProblems", () => {
  it("passes the real seed data in src/data", () => {
    expect(
      findSeedProblems({ categories, products: allProducts, detailIds: Object.keys(productDetails), dealIds: topSaver.map((p) => p.id) }),
    ).toEqual([]);
  });

  it("passes consistent data", () => {
    expect(findSeedProblems(good)).toEqual([]);
  });

  it("explains an empty category list and the products it orphans", () => {
    expect(findSeedProblems({ ...good, categories: [] })).toEqual([
      "There are no categories (`categoryList` in src/data/home.ts is empty).",
      'Product p1 ("Bone Biscuits") is in category "Pet Foods", which isn\'t in `categoryList` in src/data/home.ts.',
    ]);
  });

  it("explains missing products", () => {
    expect(findSeedProblems({ ...good, products: [], detailIds: [], dealIds: [] })).toEqual([
      "There are no products (topSaver, bestSellers and justLanding in src/data/home.ts are empty).",
    ]);
  });

  it("catches duplicate ids, bad prices and dangling details or deals", () => {
    const problems = findSeedProblems({
      ...good,
      products: [
        ...good.products,
        { id: "p1", name: "Copy", category: "Pet Foods", price: 0 },
        { id: "p2", name: "Odd sale", category: "Pet Foods", price: 5, oldPrice: 5 },
      ],
      detailIds: ["p1", "ghost"],
      dealIds: ["nope"],
    });
    expect(problems).toEqual([
      'Product id "p1" is used twice in src/data/home.ts.',
      "Product p1 has price 0; it must be above 0.",
      "Product p2 has oldPrice 5, which must be above its price 5 (or leave it out).",
      'src/data/product-details.ts has details for "ghost", which isn\'t a product.',
      'Top Saver deal "nope" isn\'t a product.',
    ]);
  });
});

describe("SeedDataError", () => {
  it("lists every problem in its message", () => {
    const e = new SeedDataError(["one", "two"]);
    expect(e.name).toBe("SeedDataError");
    expect(e.message).toBe("The seed data in src/data has 2 problems:\n  - one\n  - two");
    expect(new SeedDataError(["only"]).message).toMatch(/^The seed data in src\/data has 1 problem:/);
  });
});
