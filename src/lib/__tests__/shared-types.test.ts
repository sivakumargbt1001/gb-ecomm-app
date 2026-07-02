import { UserSchema } from "@gb-ecomm/shared-types";

describe("@gb-ecomm/shared-types smoke test", () => {
  it("parses a valid user with the shared UserSchema", () => {
    const result = UserSchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      email: "shopper@example.com",
      name: "Jane Shopper",
      role: "customer",
      createdAt: "2026-07-02T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });
});
