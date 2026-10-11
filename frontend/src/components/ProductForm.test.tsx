import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

import type { Category, Product } from "../types";
import { ProductForm } from "./ProductForm";

const categories: Category[] = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Books" },
];

function badRequest(data: unknown) {
  return new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 400,
    statusText: "Bad Request",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

function setup(props: Partial<React.ComponentProps<typeof ProductForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<ProductForm categories={categories} onSubmit={onSubmit} onCancel={onCancel} {...props} />);
  return { onSubmit, onCancel, user: userEvent.setup() };
}

describe("ProductForm", () => {
  it("shows a message for every invalid field and does not submit", async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole("button", { name: "Add product" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Price is required.")).toBeInTheDocument();
    expect(screen.getByText("Stock is required.")).toBeInTheDocument();
    expect(screen.getByText("Choose a category.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects price <= 0 and negative stock with specific messages", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("Name"), "Thing");
    await user.type(screen.getByLabelText(/Price/), "0");
    await user.type(screen.getByLabelText("Stock"), "-2");
    await user.selectOptions(screen.getByLabelText("Category"), "1");
    await user.click(screen.getByRole("button", { name: "Add product" }));

    expect(await screen.findByText("Price must be greater than 0.")).toBeInTheDocument();
    expect(screen.getByText("Stock cannot be negative.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/)).toHaveAttribute("aria-invalid", "true");
  });

  it("submits a correctly typed payload", async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText("Name"), "  Wireless Mouse ");
    await user.type(screen.getByLabelText(/Price/), "24.9");
    await user.type(screen.getByLabelText("Stock"), "12");
    await user.selectOptions(screen.getByLabelText("Category"), "2");
    await user.click(screen.getByRole("button", { name: "Add product" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Wireless Mouse",
        price: "24.90",
        stock: 12,
        category: 2,
        is_active: true,
      }),
    );
  });

  it("pre-fills when editing", () => {
    const product: Product = {
      id: 7, name: "Kettle", price: "34.99", stock: 60, category: 1,
      category_name: "Electronics", is_active: false, created_at: "2025-01-01T00:00:00Z",
    };
    setup({ product });
    expect(screen.getByLabelText("Name")).toHaveValue("Kettle");
    expect(screen.getByLabelText(/Price/)).toHaveValue("34.99");
    expect(screen.getByLabelText("Category")).toHaveValue("1");
    expect(screen.getByLabelText(/Active/)).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("shows server-side field errors next to the field", async () => {
    const onSubmit = vi.fn().mockRejectedValue(badRequest({ price: ["Price must be greater than 0."] }));
    const { user } = setup({ onSubmit });
    await user.type(screen.getByLabelText("Name"), "Thing");
    await user.type(screen.getByLabelText(/Price/), "5");
    await user.type(screen.getByLabelText("Stock"), "1");
    await user.selectOptions(screen.getByLabelText("Category"), "1");
    await user.click(screen.getByRole("button", { name: "Add product" }));

    expect(await screen.findByText("Price must be greater than 0.")).toBeInTheDocument();
  });

  it("shows a general error when the network fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));
    const { user } = setup({ onSubmit });
    await user.type(screen.getByLabelText("Name"), "Thing");
    await user.type(screen.getByLabelText(/Price/), "5");
    await user.type(screen.getByLabelText("Stock"), "1");
    await user.selectOptions(screen.getByLabelText("Category"), "1");
    await user.click(screen.getByRole("button", { name: "Add product" }));

    expect(await screen.findByText(/Can't reach the server/)).toBeInTheDocument();
  });

  it("calls onCancel", async () => {
    const { onCancel, user } = setup();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
