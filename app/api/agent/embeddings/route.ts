import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    const supabase = createClient();
    const { action, commentId, postIds } = await req.json();
    const localUrl = process.env.LOCAL_EMBEDDING_URL || "http://localhost:8000/embed";

    try {
        if (action === "batch_process") {
            // Process embeddings for all comments in specific posts
            const { data: comments, error: fetchError } = await supabase
                .from("comments")
                .select("id, content")
                .in("post_id", postIds);

            if (fetchError) throw fetchError;

            const results = [];
            for (const comment of comments) {
                // Call local embedding service
                const response = await fetch(localUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: comment.content })
                });

                if (response.ok) {
                    const data = await response.json();
                    const embedding = data.embedding;

                    if (embedding) {
                        const { error: upsertError } = await supabase
                            .from("comment_embeddings")
                            .upsert({
                                comment_id: comment.id,
                                embedding: embedding
                            });
                        results.push({ id: comment.id, success: !upsertError });
                    }
                } else {
                    results.push({ id: comment.id, success: false, error: "Local service failed" });
                }
            }
            return NextResponse.json({ success: true, results });
        }

        if (action === "update_single" && commentId) {
            const { data: comment, error: fetchError } = await supabase
                .from("comments")
                .select("content")
                .eq("id", commentId)
                .single();

            if (fetchError) throw fetchError;

            const response = await fetch(localUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: comment.content })
            });

            if (response.ok) {
                const data = await response.json();
                const embedding = data.embedding;

                if (embedding) {
                    const { error: upsertError } = await supabase
                        .from("comment_embeddings")
                        .upsert({
                            comment_id: commentId,
                            embedding: embedding
                        });
                    if (upsertError) throw upsertError;
                }
                return NextResponse.json({ success: true });
            }
            throw new Error("Local embedding service failed");
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Embedding pipeline error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
