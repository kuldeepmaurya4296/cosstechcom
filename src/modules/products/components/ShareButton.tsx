"use client";

import React, { useState, useRef, useEffect } from "react";
import { Share2, Copy, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ShareButtonProps {
  productName: string;
  productBrand?: string;
}

export function ShareButton({ productName, productBrand }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Product link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = () => {
    const url = getShareUrl();
    if (navigator.share) {
      navigator
        .share({
          title: `${productBrand ? `${productBrand} - ` : ""}${productName}`,
          text: `Check out ${productName} on CosstechCom!`,
          url: url,
        })
        .catch(() => {
          // Ignored share cancellations
        });
    } else {
      setIsOpen(true);
    }
  };

  const shareText = `Check out this amazing pair of footwear: ${productName} on CosstechCom!`;

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: (
        <svg className="h-4 w-4 fill-emerald-500" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
      url: () =>
        `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + getShareUrl())}`,
      bgColor: "hover:bg-emerald-50",
      textColor: "text-[#25D366]",
    },
    {
      name: "Facebook",
      icon: (
        <svg className="h-4 w-4 fill-blue-600" viewBox="0 0 24 24">
          <path d="M9.101 23.659v-9.531H6.13v-3.633h2.971V7.76c0-2.946 1.798-4.553 4.427-4.553 1.259 0 2.576.225 2.576.225v2.834h-1.452c-1.46 0-1.914.906-1.914 1.837v2.209h3.193l-.51 3.633h-2.683v9.531H9.101Z" />
        </svg>
      ),
      url: () =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
      bgColor: "hover:bg-blue-50",
      textColor: "text-[#1877F2]",
    },
    {
      name: "X / Twitter",
      icon: (
        <svg className="h-4 w-4 fill-foreground" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: () =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`,
      bgColor: "hover:bg-neutral-100",
      textColor: "text-foreground",
    },
  ];

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={handleNativeShare}
        onMouseEnter={() => !navigator.share && setIsOpen(true)}
        className="p-2.5 border border-border rounded-xl hover:bg-muted transition mt-1 shrink-0 flex items-center justify-center cursor-pointer group"
        aria-label="Share product"
      >
        <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-white border border-border/80 rounded-xl shadow-lg z-50 overflow-hidden"
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="p-1.5 space-y-0.5">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-foreground/80 hover:text-foreground transition-all duration-200 ${link.bgColor}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.icon}
                  <span>Share on {link.name}</span>
                </a>
              ))}
              <div className="h-[1px] bg-border/50 my-1" />
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-foreground/80 hover:text-foreground hover:bg-neutral-50 transition-all duration-200 cursor-pointer"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{copied ? "Link Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
