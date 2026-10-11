import { z } from "zod";

/** Each validator returns an error message, or null when the value is fine. */
export function validatePrice(raw: string): string | null {
  const v = raw.trim();
  if (v === "") return "Price is required.";
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(v)) return "Price must be a number.";
  const n = Number(v);
  if (n <= 0) return "Price must be greater than 0.";
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return "Price can have at most 2 decimal places.";
  if (n > 99_999_999.99) return "Price is too large.";
  return null;
}

export function validateStock(raw: string): string | null {
  const v = raw.trim();
  if (v === "") return "Stock is required.";
  if (!/^-?\d+$/.test(v)) return "Stock must be a whole number.";
  const n = Number(v);
  if (n < 0) return "Stock cannot be negative.";
  if (n > 2_147_483_647) return "Stock is too large.";
  return null;
}

// The form keeps price/stock as strings (so we control the messages, unlike <input type="number">)
// and converts to numbers only when building the API payload.
export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be 200 characters or fewer."),
  price: z.string().superRefine((v, ctx) => {
    const message = validatePrice(v);
    if (message) ctx.addIssue({ code: "custom", message });
  }),
  stock: z.string().superRefine((v, ctx) => {
    const message = validateStock(v);
    if (message) ctx.addIssue({ code: "custom", message });
  }),
  category: z.string().min(1, "Choose a category."),
  is_active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
