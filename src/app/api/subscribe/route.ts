import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const subscribeSchema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = subscribeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, name } = parsed.data;

        // Check if already subscribed
        const existingSubscriber = await db.subscriber.findUnique({
            where: { email },
        });

        if (existingSubscriber) {
            return NextResponse.json(
                { message: "You're already subscribed!" },
                { status: 200 }
            );
        }

        // Create new subscriber
        await db.subscriber.create({
            data: {
                email,
                name: name || null,
            },
        });

        return NextResponse.json(
            { message: "Successfully subscribed! Welcome aboard." },
            { status: 201 }
        );
    } catch (error) {
        console.error("Subscription error:", error);
        return NextResponse.json(
            { error: "Failed to subscribe. Please try again." },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const subscribers = await db.subscriber.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return NextResponse.json({ subscribers, count: subscribers.length });
}
