import { z } from "zod";
export const tenantFixtureSchema = z.object({
  tenant: z.object({ slug: z.string().min(1), businessName: z.string().min(1) }),
  canonicalFacts: z.array(z.object({
    id: z.string().min(1), category: z.string().min(1),
    claim: z.string().min(1), evidence: z.string().min(1)
  })),
  surfaces: z.array(z.object({ surface: z.string().min(1), visibleText: z.string() })),
  questions: z.array(z.object({
    id: z.string().min(1), question: z.string().min(1),
    expectedFactIds: z.array(z.string()), negativeControl: z.boolean().optional()
  }))
});
