import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.startsWith("sk-your-")) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env" },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { content, title, mode } = body as {
      content: string
      title?: string
      mode?: "improve" | "summarize" | "formal" | "casual" | "expand"
    }

    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json({ error: "Content is required (min 10 chars)" }, { status: 400 })
    }

    const modeInstructions: Record<string, string> = {
      improve:
        "Rewrite and improve this blog post content. Make it more engaging, clear, and professional. Keep the same key points and structure.",
      summarize:
        "Summarize this blog post content into a shorter, concise version that retains all key information.",
      formal:
        "Rewrite this blog post content in a formal, professional tone suitable for a business audience.",
      casual:
        "Rewrite this blog post content in a casual, friendly and conversational tone.",
      expand:
        "Expand this blog post content with more detail, examples, and depth while keeping the same topic and key points.",
    }

    const instruction = modeInstructions[mode ?? "improve"]

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional blog content writer and editor. Your rewrites preserve the author's intent while improving quality. Return only the rewritten content, no extra commentary.",
        },
        {
          role: "user",
          content: `${instruction}\n\n${title ? `Blog title: "${title}"\n\n` : ""}Content:\n${content}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    const rewritten = completion.choices[0]?.message?.content?.trim()
    if (!rewritten) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 })
    }

    return NextResponse.json({ content: rewritten })
  } catch (error: unknown) {
    console.error("Blog rewrite error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Rewrite failed", details: message }, { status: 500 })
  }
}
