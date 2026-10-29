import { llmsTxt, textResponse } from "@/lib/llms";

export async function GET() {
  return textResponse(await llmsTxt({ full: true }));
}
