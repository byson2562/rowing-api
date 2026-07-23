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

// Formspree のフォームID。未設定のあいだは mailto にフォールバックする。
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? "";
const FALLBACK_TO = "takumi.nakamura.by@gmail.com";

type SubmitState = "idle" | "sending" | "sent" | "error";

export function SupportContactForm() {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0 && message.trim().length > 0;
  }, [name, email, message]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || state === "sending") return;

    if (!FORMSPREE_ID) {
      // フォールバック: 訪問者のメールアプリで送ってもらう
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
      window.location.href = `mailto:${FALLBACK_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    setState("sending");
    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          organization: organization.trim(),
          email: email.trim(),
          message: message.trim()
        })
      });
      if (!response.ok) throw new Error(`formspree ${response.status}`);
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <p className="mt-3 mb-0 rounded-rn-card border border-rn-border bg-white p-4 text-[14px] leading-[1.7] text-rn-text" role="status">
        お問い合わせを送信しました。内容を確認のうえ、メールでご連絡します。ありがとうございます。
      </p>
    );
  }

  return (
    <form className={lpContactForm} onSubmit={handleSubmit}>
      <div className={lpContactGrid}>
        <label className={lpContactLabel}>
          お名前
          <input className={lpContactInput} name="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className={lpContactLabel}>
          メールアドレス
          <input className={lpContactInput} type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
      </div>
      <label className={lpContactLabel}>
        団体名（任意）
        <input className={lpContactInput} name="organization" value={organization} onChange={(event) => setOrganization(event.target.value)} />
      </label>
      <label className={lpContactLabel}>
        お問い合わせ内容
        <textarea className={lpContactTextarea} name="message" value={message} onChange={(event) => setMessage(event.target.value)} rows={6} required />
      </label>
      {state === "error" && (
        <p className="mt-2 mb-0 text-[13px] leading-[1.7] text-[#b42318]" role="alert">
          送信に失敗しました。時間をおいて再度お試しいただくか、メール(takumi.nakamura.by@gmail.com)でご連絡ください。
        </p>
      )}
      <div className={lpContactActions}>
        <Button
          type="submit"
          disabled={!canSubmit || state === "sending"}
          data-ga-event="sponsor_inquiry_click"
          data-ga-label="support_contact_form_submit"
          data-ga-location="/sponsor"
        >
          {state === "sending" ? "送信中..." : "問い合わせを送信"}
        </Button>
      </div>
    </form>
  );
}
