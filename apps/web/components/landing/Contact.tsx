"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@motogearsouq/shared";
import { useTranslations } from "next-intl";
import { company } from "@/lib/config";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageCircle, Phone, Send, CheckCircle2, AlertCircle, Clock, MapPin, ExternalLink } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

export function Contact() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactInput) => {
    setStatus("loading");
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t("errorMessage"));
      }

      setStatus("success");
      reset();
    } catch (err: unknown) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : t("errorMessage"));
    }
  };

  return (
    <section id="contact" className="relative overflow-hidden py-6 sm:py-10 md:py-16 bg-bg scroll-mt-24">
      {/* Faint accent glow, top-right — matches the OG image style */}
      {/* Decorative glow: physical (aesthetic only) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 w-[420px] h-[420px] rounded-full bg-accent/[0.03] blur-3xl"
      />
      <Container size="xl">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-10 pb-4 border-b border-border/50">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              {t("title")}
            </h2>
            <p className="text-muted text-lg">
              {t("subtitle")}
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          {/* Contact Form */}
          <FadeIn delay={0.05}>
            <Card padding="lg" className="bg-card border-border md:p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label={t("fields.name.label")}
                placeholder={t("fields.name.placeholder")}
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label={t("fields.phone.label")}
                placeholder={t("fields.phone.placeholder")}
                type="tel"
                dir="ltr"
                error={errors.phone?.message}
                {...register("phone")}
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-message" className="text-sm font-medium text-fg">
                  {t("fields.message.label")}
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  placeholder={t("fields.message.placeholder")}
                  className="bg-bg border border-border rounded-lg px-4 py-3 text-fg placeholder:text-muted focus:border-accent focus:outline-none resize-none"
                  {...register("message")}
                />
                {errors.message?.message && (
                  <p className="text-red-500 text-sm">{errors.message.message}</p>
                )}
              </div>

              {status === "success" && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{t("successMessage")}</span>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{serverError || t("errorMessage")}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{status === "loading" ? t("sending") : t("submitButton")}</span>
              </Button>
            </form>
            </Card>
          </FadeIn>

          {/* Quick Contact & WhatsApp info */}
          <FadeIn delay={0.1}>
            <div className="space-y-6 lg:py-8">
            <h3 className="text-2xl font-bold mb-4">{t("directTitle")}</h3>
            <p className="text-muted leading-relaxed mb-6">
              {t("directText")}
            </p>

            <div className="space-y-4">
              <Card padding="md" className="bg-card border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-muted">{t("whatsappQuick")}</div>
                    <div className="font-bold text-fg" dir="ltr">
                      {company.whatsappNumber}
                    </div>
                  </div>
                </div>
              <Button variant="secondary" size="sm" asChild className="inline-flex items-center justify-center gap-2 !bg-[#25D366] !text-white font-bold hover:!bg-[#20bd5a] border-none rounded-lg transition-colors">
                <a href={company.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                  <span>{t("messageUs")}</span>
                </a>
              </Button>
              </Card>

              <Card padding="md" className="bg-card border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-muted">{t("hotline")}</div>
                    <div className="font-bold text-fg" dir="ltr">
                      {company.phoneDisplay}
                    </div>
                  </div>
                </div>
              <Button variant="secondary" size="sm" asChild className="inline-flex items-center justify-center gap-2">
                <a href={`tel:${company.phone}`}>
                  <Phone className="w-4 h-4" />
                  <span>{t("callUs")}</span>
                </a>
              </Button>
              </Card>

              <Card padding="md" className="bg-card border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted">{t("hours.title")}</div>
                    <div className="font-bold text-fg">
                      {t("hours.weekdays")}
                    </div>
                    <div className="font-bold text-fg">
                      {t("hours.friday")}
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding="md" className="bg-card border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-muted">{t("address.title")}</div>
                    <div className="font-bold text-fg leading-relaxed">
                      {company.address}
                    </div>
                  </div>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                  >
                    <span>{t("address.map")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </Card>
            </div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
