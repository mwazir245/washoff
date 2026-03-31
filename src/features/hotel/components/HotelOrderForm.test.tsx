import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HotelOrderForm from "@/features/hotel/components/HotelOrderForm";
import {
  PlatformServiceTypeCode,
  ServiceBillingUnit,
  ServiceCategory,
  ServicePricingUnit,
  type ServiceCatalogItem,
} from "@/features/orders/model/service";

const buildCatalogService = (
  overrides: Partial<ServiceCatalogItem> & Pick<ServiceCatalogItem, "id" | "code" | "name">,
): ServiceCatalogItem => ({
  id: overrides.id,
  code: overrides.code,
  name: overrides.name,
  description: overrides.description ?? { ar: "خدمة قياسية من كتالوج WashOff" },
  category: overrides.category ?? ServiceCategory.Laundry,
  billingUnit: overrides.billingUnit ?? ServiceBillingUnit.Piece,
  defaultUnitPriceSar: overrides.defaultUnitPriceSar ?? 12.65,
  defaultTurnaroundHours: overrides.defaultTurnaroundHours ?? 24,
  supportsRush: overrides.supportsRush ?? true,
  active: overrides.active ?? true,
  productId: overrides.productId,
  productName: overrides.productName,
  serviceType: overrides.serviceType,
  serviceTypeName: overrides.serviceTypeName,
  pricingUnit: overrides.pricingUnit ?? ServicePricingUnit.Piece,
  suggestedPriceSar: overrides.suggestedPriceSar,
  isAvailable: overrides.isAvailable ?? true,
  operationalProviderCount: overrides.operationalProviderCount ?? 1,
  lowestApprovedPriceSar: overrides.lowestApprovedPriceSar ?? overrides.defaultUnitPriceSar ?? 12.65,
});

describe("HotelOrderForm", () => {
  it("renders the hotel matrix from the canonical operational catalog and submits canonical references only", async () => {
    const onSubmit = vi.fn(async () => undefined);

    render(
      <HotelOrderForm
        services={[
          buildCatalogService({
            id: "svc-thobe-dry_clean",
            code: "svc_thobe_dry_clean",
            name: { ar: "ثوب - غسيل جاف" },
            productId: "product-thobe",
            productName: { ar: "ثوب" },
            serviceType: PlatformServiceTypeCode.DryClean,
            serviceTypeName: { ar: "غسيل جاف" },
            defaultUnitPriceSar: 12.65,
            operationalProviderCount: 2,
          }),
          buildCatalogService({
            id: "svc-thobe-wash_and_iron",
            code: "svc_thobe_wash_and_iron",
            name: { ar: "ثوب - غسيل وكوي" },
            productId: "product-thobe",
            productName: { ar: "ثوب" },
            serviceType: PlatformServiceTypeCode.WashAndIron,
            serviceTypeName: { ar: "غسيل وكوي" },
            defaultUnitPriceSar: 5.75,
            operationalProviderCount: 1,
          }),
          buildCatalogService({
            id: "svc-shirt-iron",
            code: "svc_shirt_iron",
            name: { ar: "قميص - كوي" },
            productId: "product-shirt",
            productName: { ar: "قميص" },
            serviceType: PlatformServiceTypeCode.Iron,
            serviceTypeName: { ar: "كوي" },
            defaultUnitPriceSar: 3.45,
            operationalProviderCount: 3,
          }),
          buildCatalogService({
            id: "svc-shirt-dry_clean",
            code: "svc_shirt_dry_clean",
            name: { ar: "قميص - غسيل جاف" },
            productId: "product-shirt",
            productName: { ar: "قميص" },
            serviceType: PlatformServiceTypeCode.DryClean,
            serviceTypeName: { ar: "غسيل جاف" },
            operationalProviderCount: 0,
          }),
          buildCatalogService({
            id: "wash_fold",
            code: "wash_fold",
            name: { ar: "خدمة قديمة" },
            category: ServiceCategory.Laundry,
            billingUnit: ServiceBillingUnit.Kilogram,
            defaultUnitPriceSar: 9,
            productId: undefined,
            productName: undefined,
            serviceType: undefined,
            serviceTypeName: undefined,
            operationalProviderCount: 4,
          }),
        ]}
        onCancel={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByText("خدمة قديمة")).not.toBeInTheDocument();
    expect(screen.queryByText("اسم النزيل")).not.toBeInTheDocument();

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent?.trim());
    expect(headers).toEqual(["المنتج", "كوي", "غسيل وكوي", "غسيل جاف"]);

    fireEvent.change(screen.getByPlaceholderText("مثال: 1208"), {
      target: { value: "1208" },
    });
    fireEvent.change(screen.getByTestId("hotel-order-quantity-svc-thobe-dry_clean"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByTestId("hotel-order-quantity-svc-shirt-iron"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        roomNumber: "1208",
        items: [
          { serviceId: "svc-thobe-dry_clean", quantity: 2 },
          { serviceId: "svc-shirt-iron", quantity: 1 },
        ],
        pickupAt: expect.any(String),
        notes: "",
      });
    });
  });

  it("requires the room number before submitting the hotel order", async () => {
    render(
      <HotelOrderForm
        services={[
          buildCatalogService({
            id: "svc-thobe-dry_clean",
            code: "svc_thobe_dry_clean",
            name: { ar: "ثوب - غسيل جاف" },
            productId: "product-thobe",
            productName: { ar: "ثوب" },
            serviceType: PlatformServiceTypeCode.DryClean,
            serviceTypeName: { ar: "غسيل جاف" },
          }),
        ]}
        onCancel={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    fireEvent.change(screen.getByTestId("hotel-order-quantity-svc-thobe-dry_clean"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب" }));

    expect(
      await screen.findByText("يرجى إدخال رقم الغرفة قبل إرسال الطلب."),
    ).toBeInTheDocument();
  });

  it("requires at least one quantity in the matrix before submission", async () => {
    render(
      <HotelOrderForm
        services={[
          buildCatalogService({
            id: "svc-thobe-dry_clean",
            code: "svc_thobe_dry_clean",
            name: { ar: "ثوب - غسيل جاف" },
            productId: "product-thobe",
            productName: { ar: "ثوب" },
            serviceType: PlatformServiceTypeCode.DryClean,
            serviceTypeName: { ar: "غسيل جاف" },
          }),
        ]}
        onCancel={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("مثال: 1208"), {
      target: { value: "818" },
    });
    fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب" }));

    expect(
      await screen.findByText("أدخل كمية لخدمة واحدة على الأقل قبل إرسال الطلب."),
    ).toBeInTheDocument();
  });
});
