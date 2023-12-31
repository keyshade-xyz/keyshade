import prisma from "@/apps/web/lib/prismadb";
import { IncomingHttpHeaders } from "http";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";


const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_KEY || "";

async function handler(request: Request) {
    const payload = await request.json();
    const headersList = headers();
    const heads = {
        "svix-id": headersList.get("svix-id"),
        "svix-timestamp": headersList.get("svix-timestamp"),
        "svix-signature": headersList.get("svix-signature"),
    };
    const wh = new Webhook(webhookSecret);
    let evt: Event | null = null;

    try {
        evt = wh.verify(
            JSON.stringify(payload),
            heads as IncomingHttpHeaders & WebhookRequiredHeaders
        ) as Event;
    } catch (err) {
        console.error((err as Error).message);
        return NextResponse.json({}, { status: 400 });
    }

    const eventType: EventType = evt.type;
    if (eventType === "user.created" || eventType === "user.updated") {
        const { id,
            email_addresses,
            first_name,
            last_name,
            profile_image_url,
        } = evt.data;

        await prisma.user.upsert({
            where: {
                id: id as string,
                email: email_addresses[0].email_address as string
            },
            create: {
                id: id as string,
                email: email_addresses[0].email_address as string,
                name: first_name as string || "" + last_name as string || "",
                profilePictureUrl: profile_image_url,
                isOnboardingFinished: false,

            },
            update: {
                email: email_addresses[0].email_address as string,
                name: first_name as string || "" + last_name as string || "",
                profilePictureUrl: profile_image_url,
            },
        });
    }

    return NextResponse.json({
        message: "ok",
    }, { status: 200 });
}

type EventType = "user.created" | "user.updated" | "*";

type Event = {
    // the webhook record has diverse type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, string | number | Date | any>;
    object: "event";
    type: EventType;
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
