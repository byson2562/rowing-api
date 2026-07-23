"use client";

import { FormEvent, useMemo, useState } from "react";

import Button from "./ui/Button";
import {
  lpContactActions,
  lpContactForm,
  lpContactGrid,
  lpContactInput,
  lpContactLabel,
  lpContactTextarea
} from "./lp/lp-classes";

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

    const subject = "レガッタナビ 協賛・問い合わせ";
    const body = [
      "レガッタナビ運営者様",
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
    <form className={lpContactForm} onSubmit={handleSubmit}>
      <div className={lpContactGrid}>
        <label className={lpContactLabel}>
          お名前
          <input className={lpContactInput} value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className={lpContactLabel}>
          メールアドレス
          <input className={lpContactInput} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
      </div>
      <label className={lpContactLabel}>
        団体名（任意）
        <input className={lpContactInput} value={organization} onChange={(event) => setOrganization(event.target.value)} />
      </label>
      <label className={lpContactLabel}>
        お問い合わせ内容
        <textarea className={lpContactTextarea} value={message} onChange={(event) => setMessage(event.target.value)} rows={6} required />
      </label>
      <div className={lpContactActions}>
        <Button
          type="submit"
          disabled={!canSubmit}
          data-ga-event="sponsor_inquiry_click"
          data-ga-label="support_contact_form_submit"
          data-ga-location="/sponsor"
        >
          メールで問い合わせる
        </Button>
      </div>
    </form>
  );
}
