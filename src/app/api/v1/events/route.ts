/**
 * GET /api/v1/events
 * 
 * Server-Sent Events endpoint for real-time token updates.
 * Streams budget and token events to connected dashboard clients.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectEventStream, createUserEventStream } from "@/lib/tokens/sse-emitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const projectId = request.nextUrl.searchParams.get("projectId");

        // If projectId provided, verify ownership
        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { userId: true },
            });

            if (!project) {
                return NextResponse.json(
                    { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } },
                    { status: 404 }
                );
            }

            if (project.userId !== session.user.id) {
                return NextResponse.json(
                    { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                    { status: 403 }
                );
            }

            // Create project-specific event stream
            const stream = createProjectEventStream(projectId);

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    Connection: "keep-alive",
                    "X-Accel-Buffering": "no", // Disable nginx buffering
                },
            });
        }

        // No projectId - stream all user events
        const stream = createUserEventStream(session.user.id);

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (error) {
        console.error("[SSE Events] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
