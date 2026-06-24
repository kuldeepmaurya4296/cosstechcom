"use server";

import { connectToDatabase } from "@/lib/db";
import Banner from "@/lib/models/Banner";
import Settings from "@/lib/models/Settings";
import { revalidatePath } from "next/cache";

import Brand from "@/lib/models/Brand";
import NewsletterSubscriber from "@/lib/models/NewsletterSubscriber";
import { sendNewsletterEmail } from "@/lib/email";

export async function saveBanner(data: any) {
  try {
    await connectToDatabase();
    if (data.id) {
      await Banner.findByIdAndUpdate(data.id, data);
    } else {
      await Banner.create(data);
    }
    revalidatePath("/admin/cms");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBanner(id: string) {
  try {
    await connectToDatabase();
    await Banner.findByIdAndDelete(id);
    revalidatePath("/admin/cms");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveSetting(key: string, value: any) {
  try {
    await connectToDatabase();
    await Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true });
    revalidatePath("/admin/cms");
    revalidatePath("/");
    revalidatePath("/privacy-policy");
    revalidatePath("/terms");
    revalidatePath("/delivery-policy");
    revalidatePath("/refund-policy");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveBrand(data: any) {
  try {
    await connectToDatabase();
    if (data.id) {
      await Brand.findByIdAndUpdate(data.id, data);
    } else {
      await Brand.create(data);
    }
    revalidatePath("/admin/cms");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBrand(id: string) {
  try {
    await connectToDatabase();
    await Brand.findByIdAndDelete(id);
    revalidatePath("/admin/cms");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSubscriber(id: string) {
  try {
    await connectToDatabase();
    await NewsletterSubscriber.findByIdAndDelete(id);
    revalidatePath("/admin/cms");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendNewsletterBlast(subject: string, htmlContent: string) {
  try {
    await connectToDatabase();
    const subscribers = await NewsletterSubscriber.find({}).lean();
    if (subscribers.length === 0) {
      return { success: false, error: "No subscribers found to send to." };
    }

    const emailPromises = subscribers.map((sub: any) =>
      sendNewsletterEmail(sub.email, subject, htmlContent),
    );

    const results = await Promise.allSettled(emailPromises);
    const sentCount = results.filter((r) => r.status === "fulfilled" && r.value === true).length;

    return {
      success: true,
      message: `Newsletter blast completed: successfully sent to ${sentCount}/${subscribers.length} subscribers.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
