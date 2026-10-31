import { company } from "@/lib/config";
import type {
  Brand,
  Branch,
  GalleryImage,
  PageMeta,
} from "@/types";
import type { Category, Testimonial } from "@elsaad/shared";
import { categories as sharedCategories, testimonials as sharedTestimonials } from "@elsaad/shared";

export const categories: Category[] = sharedCategories;
export const testimonials: Testimonial[] = sharedTestimonials;

export const trustBar = [
  { id: "years", value: "35+" },
  { id: "branches", value: "12" },
  { id: "brands", value: "20+" },
  { id: "customers", value: "10K+" },
];

export const whyUs = [
  { id: "warranty" },
  { id: "maintenance" },
  { id: "installments" },
  { id: "delivery" },
  { id: "genuine-parts" },
  { id: "support" },
];

export const brands: Brand[] = [
  { name: "Honda" },
  { name: "Yamaha" },
  { name: "Suzuki" },
  { name: "Kawasaki" },
  { name: "BMW Motorrad" },
  { name: "KTM" },
  { name: "Ducati" },
  { name: "Harley-Davidson" },
];

export const gallery: GalleryImage[] = [
  { id: "gallery-1", src: "/gallery/placeholder-1.jpg", alt: "" },
  { id: "gallery-2", src: "/gallery/placeholder-2.jpg", alt: "" },
  { id: "gallery-3", src: "/gallery/placeholder-3.jpg", alt: "" },
  { id: "gallery-4", src: "/gallery/placeholder-4.jpg", alt: "" },
  { id: "gallery-5", src: "/gallery/placeholder-5.jpg", alt: "" },
  { id: "gallery-6", src: "/gallery/placeholder-6.jpg", alt: "" },
];

export const branches: Branch[] = [
  {
    id: "cairo",
    name: "",
    address: "",
    phone: company.phone,
    hours: "",
  },
  {
    id: "giza",
    name: "",
    address: "",
    phone: "01000000001",
    hours: "",
  },
  {
    id: "alex",
    name: "",
    address: "",
    phone: "01000000002",
    hours: "",
  },
];

export const meta: PageMeta = {
  title: "MotoGearSouq — الشريك الرقمي الرسمي للسعد",
  description:
    "أكثر من 35 سنة خبرة في الدراجات النارية وقطع الغيار الأصلية. 12 فرع في مصر. ضمان، تقسيط، صيانة، وتوصيل لكل المحافظات.",
  keywords: [
    "دراجات نارية",
    "موتوسيكلات",
    "قطع غيار",
    "MotoGearSouq",
    "ELSAAD",
    "motorcycle",
    "Egypt",
  ],
};
