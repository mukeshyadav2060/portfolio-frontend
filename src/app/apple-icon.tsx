import { getProfile } from "@/lib/api";
import { initialsOf } from "@/lib/format";
import { iconMark } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const p = await getProfile();
  return iconMark(p, initialsOf(p.name), size.width);
}
