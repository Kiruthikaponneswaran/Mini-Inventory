import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { parseValidationErrors } from "../lib/errors";
import { ProductFormValues, productFormSchema } from "../lib/validation";
import type { Category, Product, ProductPayload } from "../types";

interface Props {
  categories: Category[];
  product?: Product;
  /** Should reject with the axios error so server-side field errors can be shown inline. */
  onSubmit: (payload: ProductPayload) => Promise<unknown>;
  onCancel: () => void;
}

const FORM_FIELDS = ["name", "price", "stock", "category", "is_active"] as const;

export function ProductForm({ categories, product, onSubmit, onCancel }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      price: product?.price ?? "",
      stock: product ? String(product.stock) : "",
      category: product ? String(product.category) : "",
      is_active: product?.is_active ?? true,
    },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        price: Number(values.price).toFixed(2),
        stock: Number(values.stock),
        category: Number(values.category),
        is_active: values.is_active,
      });
    } catch (err) {
      // Server is the source of truth: surface its field errors next to the inputs.
      const { fields, general } = parseValidationErrors(err);
      let unplaced = general;
      for (const [field, message] of Object.entries(fields)) {
        if ((FORM_FIELDS as readonly string[]).includes(field)) {
          setError(field as (typeof FORM_FIELDS)[number], { type: "server", message });
        } else {
          unplaced = [unplaced, `${field}: ${message}`].filter(Boolean).join(" ");
        }
      }
      setFormError(unplaced);
    }
  });

  const fieldError = (name: keyof ProductFormValues) =>
    errors[name]?.message ? (
      <span className="field-error" id={`${name}-error`} role="alert">
        {errors[name]?.message}
      </span>
    ) : null;

  const aria = (name: keyof ProductFormValues) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && (
        <div className="alert alert-error" role="alert">
          {formError}
        </div>
      )}

      <div className="field">
        <label htmlFor="pf-name">Name</label>
        <input id="pf-name" maxLength={200} {...register("name")} {...aria("name")} />
        {fieldError("name")}
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="pf-price">Price (USD)</label>
          <input id="pf-price" inputMode="decimal" placeholder="0.00" {...register("price")} {...aria("price")} />
          {fieldError("price")}
        </div>
        <div className="field">
          <label htmlFor="pf-stock">Stock</label>
          <input id="pf-stock" inputMode="numeric" placeholder="0" {...register("stock")} {...aria("stock")} />
          {fieldError("stock")}
        </div>
      </div>

      <div className="field">
        <label htmlFor="pf-category">Category</label>
        <select id="pf-category" {...register("category")} {...aria("category")}>
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldError("category")}
      </div>

      <label className="check">
        <input type="checkbox" {...register("is_active")} /> Active (available for sale)
      </label>

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
