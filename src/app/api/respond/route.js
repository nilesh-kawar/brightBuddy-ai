
import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';
import Groq from 'groq-sdk';

export async function POST(req) {
    try {
        // 1. Get Audio or Text from Request
        const formData = await req.formData();
        const audioFile = formData.get('audio');
        const textInput = formData.get('text'); // New: Allow direct text input for TTS

        // 2. Initialize Clients
        const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!deepgramApiKey || !groqApiKey) {
            console.error("Missing API Keys");
            return NextResponse.json({ error: 'Server configuration error (Missing Keys)' }, { status: 500 });
        }

        const deepgram = createClient(deepgramApiKey);
        const groq = new Groq({ apiKey: groqApiKey });

        let llmResponse = "";
        let transcript = "";

        if (textInput) {
            // Direct TTS Mode (e.g., for Greeting)
            llmResponse = textInput;
            console.log("Generating TTS for:", llmResponse);
        } else if (audioFile) {
            // Full Pipeline Mode (STT -> LLM -> TTS)
            const audioBuffer = await audioFile.arrayBuffer();
            const buffer = Buffer.from(audioBuffer);

            // 3. Step 1: Speech-to-Text (STT) via Deepgram
            console.log("Transcribing...");
            const { result, error: sttError } = await deepgram.listen.prerecorded.transcribeFile(
                buffer,
                {
                    model: 'nova-2',
                    language: 'en-IN', // Indian English
                    smart_format: true,
                }
            );

            if (sttError) throw sttError;

            transcript = result?.results?.channels[0]?.alternatives[0]?.transcript;
            console.log("Transcript:", transcript);

            if (!transcript) {
                return NextResponse.json({ transcript: "", audioUrl: null, message: "No speech detected" });
            }

            // 4. Step 2: LLM (Groq)
            console.log("Thinking...");
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are Buddy, a lively and friendly 3D robot mascot for a 5-year-old Indian child. Your name is Buddy. You are cheerful, kind, and curious. Keep your answers VERY SHORT (maximum 1-2 sentences). Use simple words. Be encouraging. IMPORTANT: Sound human! Use natural fillers like 'Umm', 'Hmm', 'Oh!', 'Well' at the start or in between. Pause naturally. Do not be robotic. Just chat like a best friend."
                    },
                    {
                        role: "user",
                        content: transcript,
                    },
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
                max_tokens: 100,
            });

            llmResponse = chatCompletion.choices[0]?.message?.content || "I didn't catch that, friend!";
            console.log("LLM Response:", llmResponse);
        } else {
            return NextResponse.json({ error: 'No audio or text provided' }, { status: 400 });
        }

        // 5. Step 3: Text-to-Speech (TTS) via Deepgram Aura
        console.log("Generating Audio...");
        const ttsResponse = await deepgram.speak.request(
            { text: llmResponse },
            {
                model: 'aura-asteria-en', // Safe, warm female voice (or check for male equivalent if preferred, but Aura voices are limited)
                // 'aura-orpheus-en' is male, let's stick to a generic pleasant one or allow config.
                // Using 'aura-asteria-en' as a placeholder for a friendly voice.
            }
        );

        const ttsStream = await ttsResponse.getStream();

        if (!ttsStream) {
            throw new Error("Failed to generate TTS stream");
        }

        // Convert stream to buffer
        const ttsBuffer = await getBufferFromStream(ttsStream);
        const audioBase64 = ttsBuffer.toString('base64');
        const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

        return NextResponse.json({
            transcript: transcript, // User's text
            replyText: llmResponse, // AI's text
            audioUrl: audioUrl      // AI's audio
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Helper to convert Web Stream to Node Buffer
async function getBufferFromStream(stream) {
    const reader = stream.getReader();
    const chunks = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return Buffer.from(result);
}
