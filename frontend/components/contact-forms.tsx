"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";

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

async function postToFormspree(payload: Record<string, string>): Promise<void> {
  const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`formspree ${response.status}`);
}

function openMailFallback(subject: string, lines: string[]): void {
  const body = ["レガッタナビ運営者様", "", ...lines].join("\n");
  window.location.href = `mailto:${FALLBACK_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function SentMessage({ children }: { children: ReactNode }) {
  return (
    <p
      className="mt-3 mb-0 rounded-rn-card border border-rn-border bg-white p-4 text-[14px] leading-[1.7] text-rn-text"
      role="status"
    >
      {children}
    </p>
  );
}

function ErrorMessage() {
  return (
    <p className="mt-2 mb-0 text-[13px] leading-[1.7] text-[#b42318]" role="alert">
      送信に失敗しました。時間をおいて再度お試しいただくか、メール(takumi.nakamura.by@gmail.com)でご連絡ください。
    </p>
  );
}

/** スポンサー申し込み専用フォーム(口数・名前掲載の希望つき) */
export function SponsorApplyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [units, setUnits] = useState("1");
  const [listing, setListing] = useState("希望する");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0;
  }, [name, email]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || state === "sending") return;

    const subject = "レガッタナビ スポンサー申し込み";
    if (!FORMSPREE_ID) {
      openMailFallback(subject, [
        `お名前: ${name.trim()}`,
        `メール: ${email.trim()}`,
        `口数: ${units}口(年${Number(units) * 5000}円)`,
        `お名前の掲載: ${listing}`,
        "",
        "メッセージ:",
        message.trim() || "なし"
      ]);
      return;
    }

    setState("sending");
    try {
      await postToFormspree({
        _subject: subject,
        type: "sponsor_apply",
        name: name.trim(),
        email: email.trim(),
        units: `${units}口(年${Number(units) * 5000}円)`,
        listing,
        message: message.trim()
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <SentMessage>
        お申し込みありがとうございます。内容を確認のうえ、お支払い方法などをメールでご連絡します。
      </SentMessage>
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
      <div className={lpContactGrid}>
        <label className={lpContactLabel}>
          口数（一口 年5,000円）
          <select className={lpContactInput} name="units" value={units} onChange={(event) => setUnits(event.target.value)}>
            {Array.from({ length: 10 }, (_, i) => `${i + 1}`).map((n) => (
              <option key={n} value={n}>
                {n}口（年{new Intl.NumberFormat("ja-JP").format(Number(n) * 5000)}円）
              </option>
            ))}
          </select>
        </label>
        <label className={lpContactLabel}>
          お名前の掲載
          <select className={lpContactInput} name="listing" value={listing} onChange={(event) => setListing(event.target.value)}>
            <option value="希望する">希望する</option>
            <option value="希望しない">希望しない</option>
          </select>
        </label>
      </div>
      <label className={lpContactLabel}>
        メッセージ（任意）
        <textarea className={lpContactTextarea} name="message" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} />
      </label>
      {state === "error" && <ErrorMessage />}
      <div className={lpContactActions}>
        <Button
          type="submit"
          disabled={!canSubmit || state === "sending"}
          data-ga-event="sponsor_inquiry_click"
          data-ga-label="sponsor_apply_form_submit"
          data-ga-location="/sponsor"
        >
          {state === "sending" ? "送信中..." : "申し込む"}
        </Button>
      </div>
    </form>
  );
}

/** 汎用のお問い合わせフォーム(/contact) */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0 && message.trim().length > 0;
  }, [name, email, message]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || state === "sending") return;

    const subject = "レガッタナビ お問い合わせ";
    if (!FORMSPREE_ID) {
      openMailFallback(subject, [
        `お名前: ${name.trim()}`,
        `メール: ${email.trim()}`,
        "",
        "お問い合わせ内容:",
        message.trim()
      ]);
      return;
    }

    setState("sending");
    try {
      await postToFormspree({
        _subject: subject,
        type: "contact",
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return <SentMessage>お問い合わせを送信しました。内容を確認のうえ、メールでご連絡します。</SentMessage>;
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
        お問い合わせ内容
        <textarea className={lpContactTextarea} name="message" value={message} onChange={(event) => setMessage(event.target.value)} rows={6} required />
      </label>
      {state === "error" && <ErrorMessage />}
      <div className={lpContactActions}>
        <Button
          type="submit"
          disabled={!canSubmit || state === "sending"}
          data-ga-event="contact_click"
          data-ga-label="contact_form_submit"
          data-ga-location="/contact"
        >
          {state === "sending" ? "送信中..." : "送信する"}
        </Button>
      </div>
    </form>
  );
}
