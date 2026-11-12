import type { CompanyConfig } from "@/types";

// TODO: replace with real number from client before launch
export const WHATSAPP_NUMBER = "201012345678";

export const company: CompanyConfig = {
  name: "MotoGearSouq",
  nameEn: "MotoGearSouq",
  tagline: "الشريك الرقمي الرسمي لشركة السعد للدراجات النارية",
  partnerName: "شركة السعد للدراجات النارية",
  partnerNameEn: "ELSAAD Motorcycle",
  established: 1990,
  yearsInBusiness: 35,
  branchesCount: 12,
  brandsCount: 20,
  phone: "01012345678",
  phoneDisplay: "0101 234 5678",
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  email: "info@motogearsouq.com",
  // Partner (ELSAAD) mailbox kept as fallback until MotoGearSouq email hosting is ready
  // TODO: Set up info@motogearsouq.com email hosting before launch
  partnerEmail: "info@elsaadmotorcycle.com",
  address: "شارع جامعة الدول العربية، المهندسين، الجيزة",
};
