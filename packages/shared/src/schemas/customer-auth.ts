import { z } from "zod";

const egyptPhone = /^01[0125][0-9]{8}$/;

export const createRetailCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(egyptPhone, "رقم موبايل مصري غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  email: z.string().email().optional().or(z.literal("")),
});

export const createWholesaleCustomerSchema = createRetailCustomerSchema.extend({
  businessName: z.string().min(2).max(200),
  taxNumber: z.string().min(3).max(50),
  commercialRegister: z.string().min(3).max(50),
});

export const customerLoginSchema = z.object({
  phone: z.string().regex(egyptPhone, "رقم موبايل مصري غير صحيح"),
  password: z.string().min(1),
});

export type CreateRetailCustomerInput = z.infer<typeof createRetailCustomerSchema>;
export type CreateWholesaleCustomerInput = z.infer<typeof createWholesaleCustomerSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
