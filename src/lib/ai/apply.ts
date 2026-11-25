import { revalidatePath } from "next/cache"
import { updateApplication, type ApplicationStatus } from "@/lib/applications"
import { getBlogPostById, saveBlogPost, updateLead } from "@/lib/cms"
import type { LeadStatus } from "@/lib/store"
import { decideAction, getAction, type Action } from "./store.ts"

/**
 * Applies a proposal the admin approved. The pending -> applied claim happens first, so a double click or a second
 * tab cannot apply it twice; a failure is recorded on the proposal.
 */
export async function applyAction(id: string): Promise<{ ok: true; action: Action } | { ok: false; error: string }> {
  const action = await getAction(id)
  if (!action) return { ok: false, error: "Proposal not found" }
  if (action.status !== "pending") return { ok: false, error: `Already ${action.status}` }
  if (!(await decideAction(id, "applied"))) return { ok: false, error: "Already decided" }
  try {
    const after = action.after as Record<string, string | undefined>
    if (action.kind === "blog_seo") {
      const post = await getBlogPostById(action.targetId)
      if (!post || post.source === "content") throw new Error("Blog post not found or not editable in the CMS")
      await saveBlogPost({
        ...post,
        seoTitle: after.seo_title ?? post.seoTitle ?? null,
        seoDescription: after.seo_description ?? post.seoDescription ?? null,
        excerpt: after.excerpt ?? post.excerpt,
      })
      revalidatePath("/blog")
      revalidatePath(`/blog/${post.slug}`)
      revalidatePath("/sitemap.xml")
      revalidatePath("/admin/blogs")
    } else if (action.kind === "lead_update") {
      await updateLead(action.targetId, { status: after.status as LeadStatus | undefined, notes: after.notes })
      revalidatePath("/admin/leads")
    } else {
      await updateApplication(action.targetId, { status: after.status as ApplicationStatus | undefined, notes: after.notes })
      revalidatePath("/admin/applications")
    }
    return { ok: true, action: { ...action, status: "applied" } }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const { createSupabaseAdminClient } = await import("@/lib/supabase")
    await createSupabaseAdminClient().from("ai_actions").update({ status: "failed", error: message.slice(0, 500) }).eq("id", id)
    return { ok: false, error: message }
  }
}
