import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}

export default async function CustomerLoginPage(props: PageProps) {
  // Safe await to handle Next.js 15+ promises and older versions
  const resolvedSearchParams = await props.searchParams;

  const urlParams = new URLSearchParams();
  if (resolvedSearchParams) {
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((val) => urlParams.append(key, val));
        } else {
          urlParams.append(key, value);
        }
      }
    }
  }

  const queryStr = urlParams.toString();
  const dest = queryStr ? `/login?${queryStr}` : "/login";
  redirect(dest);
}

