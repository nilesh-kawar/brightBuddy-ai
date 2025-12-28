'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

export default function PermissionModal({ isOpen, onGrant }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                >
                    <div className="bg-primary-yellow/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mic className="w-10 h-10 text-primary-yellow" />
                    </div>

                    <h2 className="text-2xl font-extrabold text-text-navy mb-4">
                        Hi! I Can't hear you😥
                    </h2>

                    <p className="text-gray-600 mb-8 font-semibold">
                        I need to use your microphone so we can talk together!
                    </p>

                    <button
                        onClick={onGrant}
                        className="bg-primary-blue text-white w-full py-4 rounded-xl font-bold text-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_0_#29B6F6]"
                    >
                        Yes, Let's Talk!
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
