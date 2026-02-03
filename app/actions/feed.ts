"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function deletePostAction(postId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Unauthorized" }
    }

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)

    if (error) {
        console.error("Error deleting post:", error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/feed')
    return { success: true }
}
