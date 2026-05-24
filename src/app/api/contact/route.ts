import { redirect } from "next/navigation"
import { z } from "zod"
import { createMessage } from "@/lib/cms"

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional().default(""),
  projectType: z.string().min(2),
  budget: z.string().min(1),
  message: z.string().min(10),
})

export async function POST(request: Request) {
  const formData = await request.formData()
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    projectType: formData.get("projectType"),
    budget: formData.get("budget"),
    message: formData.get("message"),
  })

  if (!parsed.success) {
    return Response.json({ error: "Invalid submission" }, { status: 400 })
  }

  await createMessage(parsed.data)
  redirect("/contact?sent=1")
}
