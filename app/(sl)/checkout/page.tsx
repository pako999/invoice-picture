import { EmbeddedPlanCheckout } from "@/components/embedded-plan-checkout";
export default async function CheckoutPage({searchParams}:{searchParams:Promise<{plan?:string;billing?:string}>}){const p=await searchParams;return <EmbeddedPlanCheckout locale="sl" plan={p.plan??"basic"} billing={p.billing??"monthly"}/>}
