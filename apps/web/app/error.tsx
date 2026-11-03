"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center">
      <Container size="md" className="py-24 text-center">
        <p className="text-6xl font-extrabold text-accent mb-4">!</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4">
          حصلت مشكلة تقنية
        </h1>
        <p className="text-muted mb-8">
          حاول تحدّث الصفحة، أو كلمنا لو المشكلة استمرت.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button size="lg" onClick={reset}>
            حاول تاني
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="w-4 h-4" />
              ارجع للرئيسية
            </Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
