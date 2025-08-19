import React, { useState, useCallback, useRef } from "react";
import { Box, BlockStack, Button, Text } from "@shopify/polaris";
import { Modal as AppBridgeModal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";

interface SendTestEmailModalProps {
  open: boolean;
  onClose: () => void;
  subject: string;
  htmlContent: string;
  defaultEmails?: string[];
}

export function SendTestEmailModal({ open, onClose, subject, htmlContent, defaultEmails = [] }: SendTestEmailModalProps) {
  const app = useAppBridge();
  const [emails, setEmails] = useState<string[]>(defaultEmails);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (s: string) => /\S+@\S+\.\S+/.test(s);

  const addEmailsFromString = useCallback(
    (input = emailInput) => {
      if (!input) return;
      const parts = input
        .split(/[,;\s]+/)
        .map((p) => p.trim())
        .filter(Boolean);

      const validNew = parts.filter((p) => isValidEmail(p) && !emails.includes(p));
      if (emails.length + validNew.length > 5) {
        app.toast?.show("You can send up to 5 emails at once", { isError: true });
        return;
      }
      if (validNew.length) {
        setEmails((prev) => [...prev, ...validNew].slice(0, 5));
      }
      setEmailInput("");
    },
    [emailInput, emails, app],
  );

  const removeEmail = (e: string) => {
    setEmails((prev) => prev.filter((x) => x !== e));
  };

  const handleKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Enter" || evt.key === ",") {
      evt.preventDefault();
      addEmailsFromString();
    }
    if (evt.key === "Backspace" && !emailInput && emails.length) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      app.toast?.show("Please add at least one recipient", { isError: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject,
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        app.toast?.show(data.message || "Test email sent successfully");
        setEmails([]);
        setEmailInput("");
        onClose();
      } else {
        app.toast?.show(data.message || "Failed to send test email", { isError: true });
      }
    } catch (err) {
      console.error("send-test-email error:", err);
      app.toast?.show("Error sending test email", { isError: true });
    } finally {
      setLoading(false);
    }
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "16px",
    background: "#f3f4f6",
    margin: "4px",
    fontSize: "13px",
  };
  const closeBtnStyle: React.CSSProperties = {
    marginLeft: 6,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: 1,
  };

  return (
    <AppBridgeModal open={open} onHide={onClose}>
      <TitleBar title="Send test email" />
      <Box padding="400">
        <BlockStack gap="200">
          <Text as="p">Email addresses</Text>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "6px",
              display: "flex",
              flexWrap: "wrap",
              minHeight: "42px",
              cursor: "text",
            }}
            onClick={() => inputRef.current?.focus()}
          >
            {emails.map((e) => (
              <div key={e} style={chipStyle}>
                <span>{e}</span>
                <button aria-label={`Remove ${e}`} style={closeBtnStyle} onClick={() => removeEmail(e)}>
                  ×
                </button>
              </div>
            ))}
            <input
              ref={inputRef}
              type="text"
              style={{ flex: 1, border: "none", outline: "none", minWidth: "150px" }}
              placeholder="Type email and press Enter"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => addEmailsFromString()}
            />
          </div>
          <Text as="p" tone="subdued">
            Send up to 5 emails at once
          </Text>
        </BlockStack>
      </Box>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "1rem",
          borderTop: "1px solid #E3E3E3",
          padding: "12px 16px",
        }}
      >
        <Button onClick={onClose} variant="tertiary">
          Cancel
        </Button>
        <div style={{ width: 8 }} />
        <Button variant="primary" onClick={handleSend} loading={loading} disabled={loading || emails.length === 0}>
          Send
        </Button>
      </div>
    </AppBridgeModal>
  );
}
