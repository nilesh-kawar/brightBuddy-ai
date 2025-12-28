'use client';
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
    return (
        <main className="flex flex-col items-center justify-between min-h-screen p-6 text-center relative overflow-hidden">
            {/* Decorative Stars */}
            <motion.div
                className="absolute text-primary-yellow text-4xl z-0 opacity-60"
                style={{ top: '10%', left: '10%' }}
                animate={{ opacity: [0.4, 1, 0.4], rotate: [0, 45, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                ✦
            </motion.div>
            <motion.div
                className="absolute text-primary-yellow text-2xl z-0 opacity-60"
                style={{ top: '15%', right: '15%' }}
                animate={{ opacity: [0.3, 0.8, 0.3], rotate: [0, -30, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            >
                ✦
            </motion.div>
            <motion.div
                className="absolute text-primary-yellow text-xl z-0 opacity-60"
                style={{ bottom: '20%', left: '15%' }}
                animate={{ opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
            >
                ★
            </motion.div>

            <header className="w-full pt-4 z-10">
                <motion.h1
                    className="text-3xl font-extrabold text-white tracking-wide drop-shadow-md"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    BrightBuddy AI
                </motion.h1>
            </header>

            <section className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-10 z-10">
                <motion.div
                    className="relative w-64 h-64 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
                    transition={{
                        scale: { duration: 0.5 },
                        opacity: { duration: 0.5 },
                        y: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }
                    }}
                >
                    {/* Placeholder for Buddy Mascot */}
                    <img
                        src="/final.png"
                        alt="Buddy Mascot"
                        className="w-full h-auto object-contain drop-shadow-xl"
                    />
                </motion.div>

                <motion.div
                    className="text-3xl font-extrabold text-white leading-tight drop-shadow-sm mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Hi! What would you like to do today?
                </motion.div>

                <div className="flex flex-col gap-5 w-full px-4">
                    <motion.button
                        className="bg-white w-full py-5 rounded-[30px] font-extrabold text-2xl text-text-navy flex items-center justify-center gap-4 border-none cursor-pointer shadow-[0_6px_0_#E0E0E0,0_10px_20px_rgba(0,0,0,0.15)] transition-transform active:translate-y-[6px] active:shadow-[0_0_0_#E0E0E0,0_2px_5px_rgba(0,0,0,0.1)]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <span className="text-3xl flex items-center justify-center">📖</span>
                        Story Time
                    </motion.button>

                    <Link href="/chat" className="w-full no-underline">
                        <motion.button
                            className="bg-white w-full py-5 rounded-[30px] font-extrabold text-2xl text-text-navy flex items-center justify-center gap-4 border-none cursor-pointer shadow-[0_6px_0_#E0E0E0,0_10px_20px_rgba(0,0,0,0.15)] transition-transform active:translate-y-[6px] active:shadow-[0_0_0_#E0E0E0,0_2px_5px_rgba(0,0,0,0.1)]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <span className="text-3xl flex items-center justify-center">🗣️</span>
                            Talk to Me
                        </motion.button>
                    </Link>
                </div>
            </section>

            <footer className="w-full pb-6 flex flex-col items-center opacity-80 z-10">
                <motion.div
                    className="flex gap-4 text-sm font-bold text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <span>Safe</span> • <span>Ad-free</span> • <span>Made for kids</span>
                </motion.div>
            </footer>
        </main>
    )
}
