import type { FeeCategory } from "@/lib/types";

export interface PresetFeeOption {
  name: string;
  category: FeeCategory;
  label: string;
  group: "Standard" | "Others";
  allowExternal?: boolean;
}

export const STANDARD_FEE_OPTIONS: PresetFeeOption[] = [
  // Standard Academic & School Fees
  { name: "Tuition / School Fees", category: "Tuition", label: "Tuition / School Fees", group: "Standard" },
  { name: "Notebook", category: "Books", label: "Notebook", group: "Standard" },
  { name: "Textbooks", category: "Books", label: "Textbooks", group: "Standard" },
  { name: "School Uniform", category: "Uniform", label: "School Uniform", group: "Standard" },
  { name: "Sport Wears", category: "PTA", label: "Sport Wears", group: "Standard" },
  { name: "Transport / Bus Service", category: "Transport", label: "Transport / Bus Service", group: "Standard" },
  { name: "Laboratory & Practical Fees", category: "Development", label: "Laboratory & Practical Fees", group: "Standard" },
  { name: "Excursion & Field Trip", category: "Excursion", label: "Excursion & Field Trip", group: "Standard" },
];

export const OTHER_FEE_OPTIONS: PresetFeeOption[] = [
  // Others (Miscellaneous & External Revenues)
  { name: "Badge fee", category: "Other", label: "Badge fee", group: "Others" },
  { name: "Certificate and testimonials", category: "Other", label: "Certificate and testimonials", group: "Others", allowExternal: true },
  { name: "Admission form fees", category: "Other", label: "Admission form fees", group: "Others", allowExternal: true },
  { name: "Examination fees", category: "Other", label: "Examination fees", group: "Others" },
  { name: "Sale of scrapped assets", category: "Other", label: "Sale of scrapped assets", group: "Others", allowExternal: true },
  { name: "Hall rent", category: "Other", label: "Hall rent", group: "Others", allowExternal: true },
  { name: "Jamb center fees", category: "Other", label: "Jamb center fees", group: "Others", allowExternal: true },
  { name: "Alfurqan clinic fees", category: "Other", label: "Alfurqan clinic fees", group: "Others", allowExternal: true },
  { name: "Previous Term Debt", category: "Other", label: "Debt (Previous Term)", group: "Others" },
  { name: "CUSTOM", category: "Other", label: "Custom / Other Fee (Specify below)", group: "Others", allowExternal: true },
];

export const PRESET_FEE_OPTIONS: PresetFeeOption[] = [
  ...STANDARD_FEE_OPTIONS,
  ...OTHER_FEE_OPTIONS,
];
