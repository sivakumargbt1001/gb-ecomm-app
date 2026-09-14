import type { Category } from "@geekbase-labs/shared-types";

import { splitSpecs } from "../../components/catalog/product-specs";

function category(overrides: Partial<Category>): Category {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Bags",
    slug: "bags",
    parentId: null,
    sortOrder: 0,
    description: null,
    seoTitle: null,
    seoDescription: null,
    imageUrl: null,
    specFields: [],
    variantOptions: null,
    ownerUserId: null,
    approvalStatus: "approved",
    rejectionReason: null,
    pendingChanges: null,
    deletionRequestedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const bags = category({
  specFields: [
    { key: "colour", label: "Colour", inputType: "select", choices: ["Pink"], required: true, highlight: true },
    { key: "closure", label: "Closure", inputType: "text", choices: [], required: false, highlight: false },
  ],
});
const kidsBags = category({
  id: "22222222-2222-4222-8222-222222222222",
  name: "Kids bags",
  slug: "kids-bags",
  parentId: bags.id,
  specFields: [
    { key: "material", label: "Material", inputType: "text", choices: [], required: false, highlight: true },
  ],
});

describe("splitSpecs", () => {
  it("puts highlighted answers first, in the category tree's order, and keeps orphans", () => {
    const { highlights, details } = splitSpecs(
      {
        categoryId: kidsBags.id,
        specs: { material: "Plush", colour: "Pink", closure: "Zip", old_key: "kept" },
      },
      [bags, kidsBags],
    );
    expect(highlights.map((row) => row.label)).toEqual(["Colour", "Material"]);
    expect(details.map((row) => row.label)).toEqual(["Closure", "Old key"]);
  });

  it("leaves out blank answers", () => {
    const { highlights, details } = splitSpecs(
      { categoryId: bags.id, specs: { colour: "" } },
      [bags],
    );
    expect(highlights).toEqual([]);
    expect(details).toEqual([]);
  });
});
