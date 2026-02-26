"use client";

import { FormEvent, useMemo, useState } from "react";

const DEFAULT_TO = "takumi.nakamura.by@gmail.com";

export function SupportContactForm() {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0 && message.trim().length > 0;
  }, [name, email, message]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const subject = "RowingAPI 協賛・問い合わせ";
    const body = [
      "RowingAPI運営者様",
      "",
      `お名前: ${name.trim()}`,
      `団体名: ${organization.trim() || "未入力"}`,
      `メール: ${email.trim()}`,
      "",
      "お問い合わせ内容:",
      message.trim()
    ].join("\n");

    const mailto = `mailto:${DEFAULT_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <form className="lp-contact-form" onSubmit={handleSubmit}>
      <div className="lp-contact-grid">
        <label>
          お名前
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          メールアドレス
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
      </div>
      <label>
        団体名（任意）
        <input value={organization} onChange={(event) => setOrganization(event.target.value)} />
      </label>
      <label>
        お問い合わせ内容
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} required />
      </label>
      <div className="lp-contact-actions">
        <button
          type="submit"
          className="lp-btn lp-btn-primary"
          disabled={!canSubmit}
          data-ga-event="sponsor_inquiry_click"
          data-ga-label="support_contact_form_submit"
          data-ga-location="/support"
        >
          メールで問い合わせる
        </button>
      </div>
    </form>
  );
}
