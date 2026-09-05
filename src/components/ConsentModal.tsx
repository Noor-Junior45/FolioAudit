import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Cookie, Check } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptAds: () => void;
  onRejectAds: () => void;
  currentAdsConsent: boolean | null;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onAcceptAds,
  onRejectAds,
  currentAdsConsent,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="consent-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            id="consent-popup-card"
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[340px] rounded-2xl bg-[#edf0f2] p-4 sm:p-5 shadow-2xl border border-white/70 text-center select-none"
          >
            {/* Top Close Button (X) */}
            <button
              id="consent-modal-close-btn"
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-neutral-200/90 hover:bg-neutral-300 flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              aria-label="Close consent dialog"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Top Center Green Cookie Icon Badge */}
            <div className="w-11 h-11 rounded-full bg-[#d2f3dc] flex items-center justify-center mx-auto mb-2.5 shadow-xs">
              <Cookie className="w-5.5 h-5.5 text-[#12a150] fill-[#12a150]" />
            </div>

            {/* Main Heading */}
            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 leading-tight tracking-tight">
              Welcome to
              <br />
              <span className="text-neutral-950">FolioAudit!</span>
            </h2>

            {/* Middle Feature Highlights Container */}
            <div className="bg-[#e2e6ea]/80 rounded-xl p-3 sm:p-3.5 my-3 text-left border border-neutral-200/70 space-y-2">
              <p className="text-xs font-medium text-neutral-600 leading-snug">
                We use cookies to improve your experience. By accepting, you agree to:
              </p>

              <div className="space-y-2 pt-0.5 text-xs font-medium text-neutral-800">
                {/* Google Analytics with Yes Tick */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#12a150] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                  <span>Google Analytics</span>
                </div>

                {/* Personalized Offers & Suggestions */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#12a150] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                  <span>Personalized offers & suggestions</span>
                </div>

                {/* Better Site Performance */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#12a150] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                  <span>Better site performance</span>
                </div>
              </div>
            </div>

            {/* Reject & Accept Buttons */}
            <div className="flex items-center gap-2.5 w-full">
              {/* Reject Button */}
              <button
                id="consent-reject-ads-btn"
                type="button"
                onClick={onRejectAds}
                className="flex-1 py-2 px-3 rounded-xl bg-[#dde1e4] hover:bg-[#d0d5d9] active:bg-[#c5cbcf] text-neutral-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs"
              >
                Reject
              </button>

              {/* Animated Accept Button */}
              <motion.button
                id="consent-accept-ads-btn"
                type="button"
                onClick={onAcceptAds}
                animate={{
                  scale: [1, 1.025, 1],
                  boxShadow: [
                    '0 3px 12px 0 rgba(18, 161, 80, 0.25)',
                    '0 5px 18px 0 rgba(18, 161, 80, 0.45)',
                    '0 3px 12px 0 rgba(18, 161, 80, 0.25)',
                  ],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="relative flex-1 py-2 px-3 rounded-xl bg-[#12a150] hover:bg-[#0e8842] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer overflow-hidden"
              >
                {/* Gentle shimmer glow sweep across accept button */}
                <motion.span
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none -skew-x-12"
                  animate={{ x: ['-120%', '120%'] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: 'linear',
                    repeatDelay: 1,
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  Accept
                </span>
              </motion.button>
            </div>

            {/* Bottom Footer Note */}
            <p className="text-[10px] text-neutral-400 font-medium text-center mt-3 tracking-wide">
              Secure & Private. No data sold.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
