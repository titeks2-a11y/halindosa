import { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "로그인 - 할인도사"
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
