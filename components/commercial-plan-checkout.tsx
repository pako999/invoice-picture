"use client";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { BillingPeriod, PaidPlan } from "@/lib/plans";
export function CommercialPlanCheckout({tier,billing,className="",variant="default",children}:{tier:PaidPlan;billing:BillingPeriod;className?:string;variant?:"default"|"outline";children?:React.ReactNode}){const{isSignedIn}=useUser();const clerk=useClerk();const router=useRouter();const isEn=usePathname().startsWith("/en");const destination=`${isEn?"/en":""}/checkout?plan=${tier}&billing=${billing}`;function start(){if(!isSignedIn){clerk.openSignUp({forceRedirectUrl:destination,signInFallbackRedirectUrl:destination});return;}router.push(destination);}return <Button variant={variant} onClick={start} className={`w-full ${className}`}>{children??(isEn?"Choose plan →":"Izberi paket →")}</Button>}
