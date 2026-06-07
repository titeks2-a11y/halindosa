import { headers } from "next/headers";
import HomeClient from "@/components/HomeClient";

export default async function Page() {
  if (process.env.CAPACITOR_BUILD !== "true") {
    await headers();
  }

  return <HomeClient />;
}
