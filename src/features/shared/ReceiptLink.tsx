"use client";

import { useCurrentPath } from "@/features/shared/usePageQuery";
import { receiptHref } from "@/lib/return-path";
import Link from "next/link";
import type { ComponentProps } from "react";

export function ReceiptLink({ id, ...props }: { id: string } & Omit<ComponentProps<typeof Link>, "href">) {
  const here = useCurrentPath();
  return <Link href={receiptHref(id, here)} {...props} />;
}
