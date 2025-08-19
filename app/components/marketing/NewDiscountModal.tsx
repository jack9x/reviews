import { useState, useCallback } from "react";
import { AppProvider, Box, Checkbox, Link, Select, Text, InlineGrid, BlockStack, TextField, Button } from "@shopify/polaris";
import { Modal as AppBridgeModal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";

const DISCOUNT_AMOUNT_OPTIONS = [
  { label: "10%", value: "10" },
  { label: "25%", value: "25" },
  { label: "50%", value: "50" },
  { label: "100%", value: "100" },
  { label: "Enter your value", value: "enter_value" },
];

const DISCOUNT_UNIT_OPTIONS = [
  { label: "%", value: "percentage" },
  { label: "Fixed", value: "fixed" },
];

export default function NewDiscountModal({ onDiscountCreated }: { onDiscountCreated: (discountId: string, discountCode: string) => void }) {
  const app = useAppBridge();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "10",
    value: "10",
    unit: "percentage",
    oneUsePerCustomer: false,
  });

  const toggleModal = useCallback(() => setOpen((prev) => !prev), []);

  const updateForm = useCallback((field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      amount: "10",
      value: "10",
      unit: "percentage",
      oneUsePerCustomer: false,
    });
  }, []);

  const handleCreate = async () => {
    const discountValue = form.amount === "enter_value" ? form.value : form.amount;

    if (!discountValue) {
      app.toast.show("Please enter a discount value", { isError: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountValue,
          unit: form.unit,
          oneUsePerCustomer: form.oneUsePerCustomer,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onDiscountCreated(data.id, data.code);
        resetForm();
        setOpen(false);
      } else {
        console.error("Failed to create discount:", data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => (
    <BlockStack gap="300">
      <Box width="50%">
        <Select label="Discount amount" options={DISCOUNT_AMOUNT_OPTIONS} value={form.amount} onChange={(val) => updateForm("amount", val)} />
      </Box>

      {form.amount === "enter_value" && (
        <Box width="50%">
          <InlineGrid gap="400" columns={["twoThirds", "oneThird"]}>
            <TextField
              label=""
              type="number"
              value={form.value}
              onChange={(val) => updateForm("value", val)}
              prefix="$"
              suffix={form.unit}
              autoComplete="off"
              error={!form.value}
            />
            <Select label="" options={DISCOUNT_UNIT_OPTIONS} value={form.unit} onChange={(val) => updateForm("unit", val)} />
          </InlineGrid>
        </Box>
      )}

      <Box width="50%">
        <Checkbox label="One use per customer" checked={form.oneUsePerCustomer} onChange={(val) => updateForm("oneUsePerCustomer", val)} />
      </Box>
    </BlockStack>
  );

  return (
    <AppProvider i18n={{ locale: "en" }}>
      <Box paddingBlockStart="200">
        <Link monochrome onClick={toggleModal}>
          <Text as="span" tone="subdued">
            Create new discount
          </Text>
        </Link>
      </Box>

      <AppBridgeModal open={open} onHide={() => setOpen(false)}>
        <TitleBar title="New Discount" />
        <Box paddingBlockStart="100">
          <Box padding="400">{renderFormFields()}</Box>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "1rem",
              borderTop: "1px solid #E3E3E3",
            }}
          >
            <Box padding="600">
              <Button variant="primary" onClick={handleCreate} loading={loading} disabled={loading}>
                Create
              </Button>
            </Box>
          </div>
        </Box>
      </AppBridgeModal>
    </AppProvider>
  );
}
