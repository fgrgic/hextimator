import { HextimateOptions } from "../types";

export type FormatOptions = Pick<
  HextimateOptions,
  "format" | "roleNames" | "variantNames" | "separator"
>;
