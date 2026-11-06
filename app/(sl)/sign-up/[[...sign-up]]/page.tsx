import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <SignUp forceRedirectUrl="/scan" />
    </div>
  );
}
