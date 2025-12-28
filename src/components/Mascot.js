'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

// Animation variants for different states
const variants = {
    idle: {
        y: [0, -10, 0],
        scale: 1,
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    greeting: {
        y: [0, -10, 0],
        rotate: [0, -5, 5, -5, 0],
        transition: { duration: 2, ease: "easeInOut" }
    },
    listening: {
        scale: 1.05,
        y: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    talking: {
        scale: [1, 1.02, 1],
        y: [0, -2, 0],
        transition: { duration: 0.3, repeat: Infinity, ease: "linear" }
    },
    happy: {
        y: [0, -20, 0, -10, 0],
        scale: [1, 1.1, 1],
        transition: { duration: 0.8, ease: "easeOut" }
    },
    thinking: {
        rotate: [0, 2, -2, 0],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

export default function Mascot({ state = 'idle' }) {
    // Map internal states to prompt/image if needed, but for now using single image + CSS animation

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            <motion.div
                animate={state}
                variants={variants}
                className="relative w-full h-full"
            >
                {/* Placeholder for Buddy Mascot - In a real app, might switch images based on state */}
                <img
                    src="/final.png"
                    alt="Buddy Mascot"
                    className="w-full h-full object-contain drop-shadow-2xl"
                />

                {/* Simple visual indicator for eyes/state if using static image */}
                {state === 'listening' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-1/4 right-1/4 text-2xl"
                    >
                        👂
                    </motion.div>
                )}
            </motion.div>

            {/* Shadow */}
            <div className="absolute -bottom-4 w-32 h-4 bg-black/10 rounded-full blur-md" />
        </div>
    );
}
