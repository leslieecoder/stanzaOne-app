import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebaseClient";
import { addDoc, collection } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  // Handle successful payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Save payment to Firestore
      await addDoc(collection(db, "payments"), {
        amount: session.amount_total! / 100,
        currency: session.currency,
        tenantEmail: session.metadata?.tenantEmail,
        unitNumber: session.metadata?.unitNumber,
        complexName: session.metadata?.complexName,
        status: "completed",
        stripeSessionId: session.id,
        createdAt: new Date(),
        paidAt: new Date(),
      });

      console.log("Payment saved to Firestore");
    } catch (error) {
      console.error("Error saving payment:", error);
    }
  }

  return NextResponse.json({ received: true });
}
