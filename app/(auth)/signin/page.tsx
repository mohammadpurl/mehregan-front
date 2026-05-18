import { Suspense } from "react";
import { SignInForm } from "../_components/sign-in-form";

export default async function SignInPage() {
  return <Suspense> <SignInForm /></Suspense>;
}
