import { StoreHeader } from "@/components/layout/StoreHeader";
import { StoreFooter } from "@/components/layout/StoreFooter";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      {children}
      <StoreFooter />
    </>
  );
}
