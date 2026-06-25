import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import NewsletterSubscriber from "@/lib/models/NewsletterSubscriber";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return new Response(
        `<html>
          <head>
            <title>Unsubscribe Error</title>
            <style>
              body { font-family: sans-serif; background-color: #FAF9F6; color: #1C1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 20px; border: 1px solid #E4E4E7; text-align: center; max-width: 400px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
              h1 { font-family: Georgia, serif; color: #DC2626; font-size: 24px; margin-top: 0; }
              p { color: #71717A; font-size: 14px; line-height: 1.5; }
              a { display: inline-block; margin-top: 20px; background: #1C1917; color: #FAF9F6; text-decoration: none; padding: 10px 20px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Unsubscribe Failed</h1>
              <p>No email address was provided in the unsubscribe request.</p>
              <a href="/">Go to Homepage</a>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } },
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    // Remove the subscriber from the database
    await NewsletterSubscriber.deleteOne({ email: email.toLowerCase().trim() });

    return new Response(
      `<html>
        <head>
          <title>Unsubscribed — CosstechCom</title>
          <style>
            body { font-family: sans-serif; background-color: #FAF9F6; color: #1C1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 20px; border: 1px solid #E4E4E7; text-align: center; max-width: 400px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            h1 { font-family: Georgia, serif; color: #1C1917; font-size: 24px; margin-top: 0; }
            p { color: #71717A; font-size: 14px; line-height: 1.5; }
            a { display: inline-block; margin-top: 20px; background: #1C1917; color: #FAF9F6; text-decoration: none; padding: 10px 20px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>You have unsubscribed</h1>
            <p>You have been successfully removed from the CosstechCom Club newsletter. You will no longer receive marketing emails from us.</p>
            <a href="/">Go to Homepage</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  } catch (error: any) {
    console.error("Unsubscribe error:", error);
    return new Response(
      `<html>
        <head>
          <title>Unsubscribe Error</title>
          <style>
            body { font-family: sans-serif; background-color: #FAF9F6; color: #1C1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 20px; border: 1px solid #E4E4E7; text-align: center; max-width: 400px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            h1 { font-family: Georgia, serif; color: #DC2626; font-size: 24px; margin-top: 0; }
            p { color: #71717A; font-size: 14px; line-height: 1.5; }
            a { display: inline-block; margin-top: 20px; background: #1C1917; color: #FAF9F6; text-decoration: none; padding: 10px 20px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Error occurred</h1>
            <p>We couldn't process your request due to a server error. Please try again later.</p>
            <a href="/">Go to Homepage</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }
}

export const dynamic = "force-dynamic";
