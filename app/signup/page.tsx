import { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "회원가입 - 할인도사"
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
