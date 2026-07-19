import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { GalleryImage } from "@/types";

interface LightboxProps {
  image: GalleryImage | null;
  onClose: () => void;
}

export default function Lightbox({ image, onClose }: LightboxProps) {
  return (
    <AnimatePresence>
      {image && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#060e1c]/90 p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-8 right-10 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>
          <motion.div
            className="bg-surface rounded-xl2 overflow-hidden max-w-lg w-full"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={image.image} alt={image.caption} className="w-full h-auto object-cover" />
            <div className="p-5">
              <h3 className="font-display font-semibold text-navy">{image.caption}</h3>
              <p className="text-sm text-ink-soft mt-1">Ready for a real photo upload.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
