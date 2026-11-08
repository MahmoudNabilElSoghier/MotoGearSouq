import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import Categories from "@/components/landing/Categories";
import { HowToOrder } from "@/components/landing/HowToOrder";
import { MerchantBanner } from "@/components/landing/MerchantBanner";
import { ShowroomGallery } from "@/components/landing/ShowroomGallery";
import { WhyUs } from "@/components/landing/WhyUs";
import { Brands } from "@/components/landing/Brands";
import { Testimonials } from "@/components/landing/Testimonials";
import { Branches } from "@/components/landing/Branches";
import { Contact } from "@/components/landing/Contact";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <Hero />
      <TrustBar />
      <Categories locale={locale} />
      <HowToOrder />
      <MerchantBanner />
      <Brands />
      <WhyUs />
      <ShowroomGallery />
      <Testimonials />
      <Branches />
      <Contact />
    </>
  );
}
