import { describe, expect, it } from "vitest";

import { productFormSchema, validatePrice, validateStock } from "./validation";

describe("validatePrice", () => {
  it.each([
    ["", "required"],
    ["abc", "number"],
    ["0", "greater than 0"],
    ["-3", "greater than 0"],
    ["1.999", "2 decimal"],
    ["100000000", "too large"],
  ])("rejects %j", (input, fragment) => {
    expect(validatePrice(input)).toContain(fragment);
  });

  it.each(["0.01", "19.9", "24.99", "1000", " 5 "])("accepts %j", (input) => {
    expect(validatePrice(input)).toBeNull();
  });
});

describe("validateStock", () => {
  it.each([
    ["", "required"],
    ["1.5", "whole number"],
    ["-1", "negative"],
    ["abc", "whole number"],
  ])("rejects %j", (input, fragment) => {
    expect(validateStock(input)).toContain(fragment);
  });

  it.each(["0", "7", "1000"])("accepts %j", (input) => {
    expect(validateStock(input)).toBeNull();
  });
});

describe("productFormSchema", () => {
  const valid = { name: "Mouse", price: "9.99", stock: "3", category: "1", is_active: true };

  it("accepts a valid product", () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
  });

  it("trims names and rejects blank ones", () => {
    expect(productFormSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });

  it("requires a category", () => {
    expect(productFormSchema.safeParse({ ...valid, category: "" }).success).toBe(false);
  });
});
