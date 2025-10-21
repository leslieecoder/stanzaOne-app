import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const { amount, tenantEmail, unitNumber, complexName } = await request.json();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn", // Pesos mexicanos
            product_data: {
              name: `Renta - ${complexName}, Unidad ${unitNumber}`,
              description: `Pago de renta mensual`,
            },
            unit_amount: amount * 100, // Stripe uses cents/centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.nextUrl.origin}/tenant?payment=success`,
      cancel_url: `${request.nextUrl.origin}/tenant?payment=cancelled`,
      customer_email: tenantEmail,
      metadata: {
        tenantEmail,
        unitNumber,
        complexName,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
