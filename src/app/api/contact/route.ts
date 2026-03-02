import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

const contactSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Invalid email address"),
    company: z.string().optional(),
    subject: z.string().min(1, "Subject is required").max(200),
    message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

// Rate limiting: 5 submissions per hour per IP
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds

async function checkRateLimit(ip: string): Promise<boolean> {
    const key = `contact_rate:${ip}`;

    try {
        const current = await redis.get(key);

        if (current && parseInt(current) >= RATE_LIMIT) {
            return false;
        }

        const pipeline = redis.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, RATE_LIMIT_WINDOW);
        await pipeline.exec();

        return true;
    } catch (error) {
        console.error("Rate limit check error:", error);
        // Allow request if Redis fails
        return true;
    }
}

export async function POST(req: Request) {
    try {
        // Get client IP for rate limiting
        const forwardedFor = req.headers.get("x-forwarded-for");
        const ip = forwardedFor?.split(",")[0] || "unknown";

        // Check rate limit
        const allowed = await checkRateLimit(ip);
        if (!allowed) {
            return NextResponse.json(
                { error: "Too many submissions. Please try again later." },
                { status: 429 }
            );
        }

        const body = await req.json();
        const parsed = contactSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, company, subject, message } = parsed.data;

        // Create contact submission
        const submission = await db.contactSubmission.create({
            data: {
                name,
                email,
                company: company || null,
                message: `Subject: ${subject}\n\n${message}`,
            },
        });

        // TODO: Send notification email to admin

        return NextResponse.json(
            {
                message: "Message sent successfully! We'll get back to you soon.",
                id: submission.id,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json(
            { error: "Failed to send message. Please try again." },
            { status: 500 }
        );
    }
}
