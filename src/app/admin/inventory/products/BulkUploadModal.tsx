"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Download, Check, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    importedCount?: number;
    errorsCount?: number;
    errors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.error("Please upload a valid CSV file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import inventory");
      }

      setResult({
        success: true,
        importedCount: data.importedCount,
        errorsCount: data.errorsCount,
        errors: data.errors,
      });

      if (data.importedCount > 0) {
        toast.success(`Successfully imported ${data.importedCount} products!`);
        onSuccess();
      } else {
        toast.error("Zero products imported. Check the error logs.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process file upload.");
      setResult({
        success: false,
        errors: [err.message || "File upload failed."],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    window.open("/api/admin/products/import", "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white border border-border w-full max-w-lg rounded-2xl shadow-elevated overflow-hidden z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-border/80">
              <h2 className="font-serif font-bold text-lg text-charcoal flex items-center gap-2">
                <Upload className="h-5 w-5 text-brass" />
                <span>Bulk Import Footwear</span>
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-neutral-100 rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Template Download Section */}
              <div className="bg-brass/5 border border-brass/10 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-cognac uppercase tracking-wider">
                    CSV Upload Template
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Download our pre-formatted template to structure product listings.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-brass/35 hover:border-brass text-cognac hover:bg-brass/5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Template
                </button>
              </div>

              {/* Upload Drop Zone */}
              {!result && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                    isDragOver
                      ? "border-brass bg-brass/5 scale-[0.99]"
                      : file
                        ? "border-emerald-400 bg-emerald-500/5"
                        : "border-border/80 hover:border-brass/60 bg-neutral-50/50 hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  {file ? (
                    <div className="space-y-2">
                      <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-charcoal">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB · Ready to import
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-charcoal">
                        Drag and drop your CSV file here, or browse
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Only CSV spreadsheets are supported (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Action */}
              {file && !result && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading & Processing CSV…
                    </>
                  ) : (
                    "Upload and Process File"
                  )}
                </button>
              )}

              {/* Results Logs */}
              {result && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {result.success ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <Check className="h-4.5 w-4.5" />
                        CSV Processing Completed!
                      </p>
                      <ul className="text-xs text-emerald-700 space-y-0.5 pl-6 list-disc font-medium">
                        <li>
                          Successfully imported: <strong>{result.importedCount} products</strong>
                        </li>
                        <li>
                          Failed rows: <strong>{result.errorsCount}</strong>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                      <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="h-4.5 w-4.5" />
                        Import Process Failed
                      </p>
                    </div>
                  )}

                  {/* Errors log */}
                  {result.errors && result.errors.length > 0 && (
                    <div className="border border-border/80 rounded-xl overflow-hidden">
                      <div className="bg-neutral-50 px-4 py-2 border-b border-border/80 text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex justify-between">
                        <span>Import Failure Logs</span>
                        <span>(showing up to 50)</span>
                      </div>
                      <div className="p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-destructive space-y-1 bg-neutral-50/20">
                        {result.errors.map((err, idx) => (
                          <div key={idx} className="flex gap-1.5 items-start">
                            <span className="text-muted-foreground shrink-0">•</span>
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                    }}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-charcoal text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Upload Another File
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-border/80 flex justify-end gap-2.5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-full transition cursor-pointer text-charcoal"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
