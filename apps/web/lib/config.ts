import type { CompanyConfig } from "@/types";

// TODO: replace with real number from client before launch
const WHATSAPP_NUMBER = "201000000000";

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
  // TODO: replace with real number from client before launch
  phone: "01000000000",
  phoneDisplay: "0100 000 0000",
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  // TODO: replace with real number from client before launch
  email: "info@motogearsouq.com",
  // Partner (ELSAAD) mailbox kept as fallback until MotoGearSouq email hosting is ready
  // TODO: Set up info@motogearsouq.com email hosting before launch
  partnerEmail: "info@elsaadmotorcycle.com",
  address: "شارع جامعة الدول العربية، المهندسين، الجيزة",
};
