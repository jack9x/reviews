export interface DiscountCode {
  id: string;
  code: string;
}

export interface DiscountCodeEdge {
  node: DiscountCode;
}

export interface DiscountCodes {
  edges: DiscountCodeEdge[];
}

export interface Discount {
  __typename: string;
  title?: string;
  summary?: string;
  status?: "ACTIVE" | "SCHEDULED" | "EXPIRED";
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number | null;
  codes?: DiscountCodes;
}

export interface DiscountNode {
  id: string;
  discount: Discount;
}

export interface DiscountNodeEdge {
  node: DiscountNode;
}

export interface DiscountOption {
  label: string;
  value: string;
}
