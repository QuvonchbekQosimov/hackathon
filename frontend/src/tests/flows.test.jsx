import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import * as api from "../api";

vi.mock("../api", () =>
  Object.fromEntries(
    [
      "getMe",
      "loginUser",
      "registerUser",
      "logoutUser",
      "getCatalog",
      "getProducts",
      "getOrders",
      "getTrips",
      "getSummary",
      "createProduct",
      "createOrder",
      "editProduct",
      "archiveProduct",
      "restoreProduct",
      "acceptOrder",
      "cancelOrder",
      "completeOrder",
      "createTrip",
      "createBid",
      "getBids",
      "acceptBid",
      "startTrip",
      "deliverTrip",
      "saveProfile",
      "changePassword",
      "sendAiChat",
      "getProductDetail",
      "getAnalysis",
    ].map((name) => [name, vi.fn()]),
  ),
);

const buyer = {
  id: "buyer",
  role: "BUYER",
  phone_number: "+998901234567",
  company_name: "Buyer Company",
};
const product = {
  id: "product-1",
  name: "Sinov mahsuloti",
  category: "Qurilish",
  price: 100.25,
  stock_quantity: 5,
  factory_name: "Sinov Zavod",
};
const denied = () =>
  Object.assign(new Error("Tizimga kiring."), { response: { status: 401 } });
const open = (path) => {
  window.history.replaceState({}, "", path);
  render(<App />);
};

beforeEach(() => {
  vi.resetAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  api.getMe.mockRejectedValue(denied());
  api.getProducts.mockResolvedValue({ data: [] });
  api.getOrders.mockResolvedValue({ data: [] });
  api.getTrips.mockResolvedValue({ data: [] });
  api.getSummary.mockResolvedValue({ data: { total: 0 } });
  api.getCatalog.mockResolvedValue({
    data: {
      items: [product],
      total: 1,
      categories: ["Qurilish"],
      page: 1,
      page_size: 12,
    },
  });
  api.getProductDetail.mockResolvedValue({
    data: { product, top_regions: [], yearly_trend: [], data_mode: "demo" },
  });
});

describe("Account and trade flows", () => {
  it("keeps recent context in the assistant conversation", async () => {
    const user = userEvent.setup();
    api.getMe.mockResolvedValue({ data: buyer });
    api.sendAiChat.mockResolvedValue({
      data: { reply: "Katalog tayyor.", mode: "gemini" },
    });
    open("/dashboard?tab=assistant");
    await screen.findByRole("heading", { name: "Yordamchi", level: 1 });
    await user.type(
      await screen.findByRole("textbox", { name: "Savolingiz" }),
      "Salom",
    );
    await user.click(screen.getByRole("button", { name: "Xabar yuborish" }));
    await screen.findByText("Katalog tayyor.");
    await user.type(
      await screen.findByRole("textbox", { name: "Savolingiz" }),
      "Davom eting",
    );
    await user.click(screen.getByRole("button", { name: "Xabar yuborish" }));
    await waitFor(() => expect(api.sendAiChat).toHaveBeenCalledTimes(2));
    expect(api.sendAiChat.mock.calls[1][1]).toEqual([
      { role: "user", content: "Salom" },
      { role: "assistant", content: "Katalog tayyor." },
    ]);
  });

  it("protects the cabinet even if localStorage contains a forged role", async () => {
    localStorage.setItem("userRole", "FACTORY");
    localStorage.setItem("userId", "forged");
    open("/dashboard");
    expect(
      await screen.findByRole("heading", { name: "Xush kelibsiz" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
    localStorage.clear();
  });

  it("shows login failure and allows the user to retry successfully", async () => {
    const user = userEvent.setup();
    api.loginUser
      .mockRejectedValueOnce(new Error("Telefon raqam yoki parol xato."))
      .mockResolvedValueOnce({ data: buyer });
    open("/login");
    await screen.findByRole("heading", { name: "Xush kelibsiz" });
    await user.type(screen.getByLabelText("Telefon raqam"), "+998901234567");
    await user.type(screen.getByLabelText("Parol"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Kirish" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Telefon raqam yoki parol xato.",
    );
    await user.click(screen.getByRole("button", { name: "Kirish" }));
    expect(
      await screen.findByRole("heading", { name: "Umumiy holat", level: 1 }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dashboard");
  });

  it("registers a driver without a company and opens the driver cabinet", async () => {
    const user = userEvent.setup();
    api.registerUser.mockResolvedValue({
      data: { ...buyer, role: "DRIVER", company_name: "" },
    });
    open("/register");
    await screen.findByRole("heading", { name: "Hisobingizni yarating" });
    await user.selectOptions(screen.getByRole("combobox"), "DRIVER");
    expect(screen.queryByLabelText("Kompaniya nomi")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Telefon raqam"), "+998901234567");
    await user.type(screen.getByLabelText("Parol"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Ro'yxatdan o'tish" }));
    expect(
      await screen.findByRole("heading", { name: "Umumiy holat", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Logistika" }),
    ).toBeInTheDocument();
    expect(api.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: "DRIVER", company_name: "" }),
    );
  });

  it("submits a catalog search and displays an honest empty result", async () => {
    const user = userEvent.setup();
    open("/marketplace");
    await screen.findByRole("heading", { name: "Sinov mahsuloti" });
    api.getCatalog.mockResolvedValue({
      data: {
        items: [],
        total: 0,
        categories: ["Qurilish"],
        page: 1,
        page_size: 12,
      },
    });
    await user.type(screen.getByRole("textbox"), "mavjud emas");
    await user.click(screen.getByRole("button", { name: "Qidirish" }));
    expect(
      await screen.findByRole("heading", { name: "Mahsulot topilmadi" }),
    ).toBeInTheDocument();
    expect(window.location.search).toContain("search=mavjud+emas");
  });

  it("keeps the idempotency key when retrying an uncertain order", async () => {
    const user = userEvent.setup();
    api.getMe.mockResolvedValue({ data: buyer });
    api.createOrder
      .mockRejectedValueOnce(new Error("Server javobi kechikdi."))
      .mockResolvedValueOnce({ data: { id: "order-1" } });
    open("/product/product-1");
    await screen.findByRole("button", { name: "Buyurtma berish" });
    await user.click(screen.getByRole("button", { name: "Buyurtma berish" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server javobi kechikdi.",
    );
    await user.click(screen.getByRole("button", { name: "Buyurtma berish" }));
    expect(await screen.findByText(/Buyurtma yaratildi/)).toBeInTheDocument();
    expect(api.createOrder.mock.calls[0][1]).toBe(
      api.createOrder.mock.calls[1][1],
    );
    expect(api.createOrder.mock.calls[0][0]).toEqual({
      product_id: "product-1",
      quantity: 1,
    });
  });

  it("saves a factory product through the modal with validated numeric stock", async () => {
    const user = userEvent.setup();
    api.getMe.mockResolvedValue({ data: { ...buyer, role: "FACTORY" } });
    api.createProduct.mockResolvedValue({ data: product });
    open("/dashboard?tab=products");
    await screen.findByRole("heading", { name: "Mahsulotlar", level: 1 });
    await user.click(
      screen.getAllByRole("button", { name: /Mahsulot qo'shish/ })[0],
    );
    await user.type(screen.getByLabelText("Mahsulot nomi"), "Yangi mahsulot");
    await user.type(screen.getByLabelText("Kategoriya"), "Qurilish");
    await user.type(screen.getByLabelText("Birlik narxi (UZS)"), "100.25");
    await user.clear(screen.getByLabelText("Ombor qoldig‘i"));
    await user.type(screen.getByLabelText("Ombor qoldig‘i"), "5");
    await user.click(screen.getByRole("button", { name: "Saqlash" }));
    await waitFor(() =>
      expect(api.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Yangi mahsulot",
          price: "100.25",
          stock_quantity: 5,
        }),
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Mahsulot saqlandi.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
