// lib/sendPush.js
// Fires a Web Push to every device registered for a cockpit.
//
// Never throws. A failed push must not fail the action that triggered it -
// an approval still has to save even if someone's phone is unreachable.

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

let configured = false;
let cachedClient = null;

function getClient() {
    if (cachedClient) return cachedClient;
    cachedClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return cachedClient;
}

function configure() {
    if (configured) return true;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
        console.warn("VAPID keys missing - push notifications are disabled");
        return false;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    return true;
}

/**
 * @param {string} recipient  cockpit key, e.g. "jeremiah"
 * @param {{ title: string, body?: string, url?: string, tag?: string }} payload
 */
export async function sendPush(recipient, payload) {
    try {
        if (!configure()) return;

        const supabase = getClient();

        const { data: subs, error } = await supabase
            .from("push_subscriptions")
            .select("id, endpoint, p256dh, auth")
            .eq("cockpit", recipient);

        if (error) throw error;
        if (!subs?.length) return;

        const body = JSON.stringify({
            title: payload.title,
            body: payload.body || "",
            url: payload.url || `/${recipient}`,
            tag: payload.tag,
        });

        const dead = [];

        await Promise.all(
            subs.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        },
                        body,
                        { TTL: 60 * 60 * 24 },
                    );
                } catch (err) {
                    // 404 or 410 means the browser threw the subscription away -
                    // the app was uninstalled or permission revoked. Clean it up.
                    if (err?.statusCode === 404 || err?.statusCode === 410) {
                        dead.push(sub.id);
                    } else {
                        console.error("Push failed:", err?.statusCode, err?.body || err);
                    }
                }
            }),
        );

        if (dead.length) {
            await supabase.from("push_subscriptions").delete().in("id", dead);
        }
    } catch (err) {
        console.error("sendPush error:", err);
    }
}