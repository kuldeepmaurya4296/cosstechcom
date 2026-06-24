import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface ProductGalleryProps {
  gallery: string[];
  name: string;
}

export function ProductGallery({ gallery, name }: ProductGalleryProps) {
  const [gIdx, setGIdx] = useState(0);

  useEffect(() => {
    setGIdx(0);
  }, [gallery]);

  return (
    <div className="space-y-3">
      <motion.div
        key={gIdx}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="aspect-square rounded-2xl bg-muted overflow-hidden"
      >
        <Image
          src={gallery[gIdx]}
          alt={name}
          width={600}
          height={600}
          priority
          className="h-full w-full object-cover"
        />
      </motion.div>
      <div className="grid grid-cols-4 gap-2">
        {gallery.map((g, i) => (
          <button
            key={i}
            onClick={() => setGIdx(i)}
            className={`aspect-square rounded-lg overflow-hidden border-2 ${
              gIdx === i ? "border-primary" : "border-transparent"
            }`}
          >
            <Image src={g} alt="" width={150} height={150} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
