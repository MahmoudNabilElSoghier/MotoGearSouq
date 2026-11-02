import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
