import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let filename = searchParams.get("filename");

    const contentType = request.headers.get("content-type") || "";
    let fileToUpload: File | Blob;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "No file field found in form data" }, { status: 400 });
      }
      fileToUpload = file;
      if (!filename) {
        filename = file.name;
      }
    } else {
      const blob = await request.blob();
      fileToUpload = blob;
    }

    if (!filename) {
      filename = `upload-${Date.now()}.bin`;
    }

    // 2. Validate File Size (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (fileToUpload.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds the 5MB limit." }, { status: 400 });
    }

    // 3. Validate Mime Type (Images only)
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    const fileType = fileToUpload.type;
    const ext = filename.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

    const isValidMime = fileType && allowedMimeTypes.includes(fileType);
    const isValidExt = ext && allowedExtensions.includes(ext);

    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        { error: "Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed." },
        { status: 400 },
      );
    }

    // 4. Handle Upload
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("BLOB_READ_WRITE_TOKEN not set. Falling back to local filesystem storage...");
      try {
        const { writeFile, mkdir } = await import("fs/promises");
        const path = await import("path");

        const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, safeFilename);
        const buffer = Buffer.from(await fileToUpload.arrayBuffer());
        await writeFile(filePath, buffer);

        console.log(`Successfully uploaded to local filesystem: /uploads/${safeFilename}`);
        return NextResponse.json({
          success: true,
          url: `/uploads/${safeFilename}`,
          size: fileToUpload.size,
        });
      } catch (err: any) {
        console.error("Local filesystem upload error:", err);
        return NextResponse.json(
          { error: err.message || "Failed to upload to local filesystem" },
          { status: 500 },
        );
      }
    }

    console.log(`Uploading file "${filename}" to Vercel Blob...`);
    const blob = await put(filename, fileToUpload, {
      access: "public",
    });

    console.log(`Successfully uploaded to Vercel Blob: ${blob.url}`);
    return NextResponse.json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      size: fileToUpload.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
