import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { Categories } from "@/components/landing/Categories";
import { WhyUs } from "@/components/landing/WhyUs";
import { Brands } from "@/components/landing/Brands";
import { Gallery } from "@/components/landing/Gallery";
import { Testimonials } from "@/components/landing/Testimonials";
import { Branches } from "@/components/landing/Branches";
import { Contact } from "@/components/landing/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Categories />
      <WhyUs />
      <Brands />
      <Gallery />
      <Testimonials />
      <Branches />
      <Contact />
    </>
  );
}
