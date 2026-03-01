export async function revalidate() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) {
    return console.error("NEXT_PUBLIC_BASE_URL is not set")
  }

  try {
    await fetch(`${baseUrl}/api/revalidate`, {
      method: "POST",
      headers: {
        "x-revalidate-secret": process.env.NEXT_PUBLIC_REVALIDATE_SECRET!,
      },
    })
    console.log("Revalidation triggered successfully.")
  } catch (error) {
    console.error("Failed to trigger revalidation:", error)
  }
}
