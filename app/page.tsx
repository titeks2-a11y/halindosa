import { headers } from "next/headers";
import HomeClient from "@/components/HomeClient";

export default async function Page() {
  const initialNow = new Date().toISOString();

  if (process.env.CAPACITOR_BUILD !== "true") {
    await headers();
  }

  return <HomeClient initialNow={initialNow} />;
}
