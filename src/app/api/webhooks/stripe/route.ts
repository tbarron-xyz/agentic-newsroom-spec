import { NextRequest, NextResponse } from 'next/server';
import stripe from "stripe"


const endpointSecret = process.env["stripeSubSecret"];

export async function POST(request: NextRequest) {
    // TODO: Handle Stripe webhook for customer.subscription.created

    const event = request.body;
    let stripeEvent;
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = request.headers.get('stripe-signature') as string;
        try {
        stripeEvent = stripe.webhooks.constructEvent(
            request.body as any,
            signature,
            endpointSecret
        );
        } catch (err: any) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        // return response.sendStatus(400);
        return NextResponse.json("no")
        }

    // Handle the event
    switch (stripeEvent.type) {
        case 'payment_intent.succeeded':
        const paymentIntent = stripeEvent.data.object;
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        break;
        case 'payment_method.attached':
        const paymentMethod = stripeEvent.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
        // ... handle other event types
        default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    // Return a response to acknowledge receipt of the event

        return NextResponse.json({ message: 'Webhook received' });
    }

}
