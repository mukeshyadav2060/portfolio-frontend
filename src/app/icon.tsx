import { iconMark } from "@/lib/og";

// A multiple of 48px, which Google requires for the favicon it shows in search results.
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return iconMark(size.width);
}
