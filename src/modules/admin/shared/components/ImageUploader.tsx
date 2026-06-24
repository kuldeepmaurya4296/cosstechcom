"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  label,
  placeholder = "Image URL (e.g. https://images.unsplash.com/...)",
  className = "",
  required = false,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Uploading "${file.name}"...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image");
      }

      onChange(data.url);
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image from device.", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="flex gap-2">
        <input
          type="url"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          disabled={isUploading}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md text-sm font-medium flex items-center gap-1.5 border border-border transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span>Upload File</span>
            </>
          )}
        </button>
      </div>

      {value && (
        <div className="relative aspect-[4/3] w-32 rounded-lg overflow-hidden border border-border bg-muted group mt-2 shadow-sm">
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-1 bg-background/90 hover:bg-background text-destructive rounded-full shadow-sm hover:scale-105 transition-all duration-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
