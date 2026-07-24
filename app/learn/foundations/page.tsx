import { redirect } from "next/navigation";

/**
 * /learn/foundations alone is a truncated URL, not a page — the units live at
 * /learn/foundations/<slug> and the section itself lives on The Index. Redirect
 * rather than 404 so a trimmed link still lands somewhere useful.
 */
export default function FoundationsIndexPage() {
  redirect("/learn");
}
