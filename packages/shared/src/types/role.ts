import type { Dateish } from "./common";

export interface Role {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  system: boolean;
  order: number;
  createdAt: Dateish;
}
