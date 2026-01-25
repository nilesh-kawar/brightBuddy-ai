import { NextResponse } from "next/server";
import sdk from "microsoft-cognitiveservices-speech-sdk";
import Groq from "groq-sdk";

/**
 * POST /api/voice
 * Supports:
 * - audio → STT → LLM → TTS
 * - text  → TTS (greeting / intro)
 */
export async function POST(req) {
    console.log("🚀 API /api/respond called");
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio");
        const textInput = formData.get("text");

        console.log("📦 FormData received:", {
            audio: audioFile ? "Present (Blob)" : "Missing",
            text: textInput || "Missing"
        });

        const speechKey = process.env.AZURE_SPEECH_KEY;
        const speechRegion = process.env.AZURE_SPEECH_REGION;
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!speechKey || !speechRegion || !groqApiKey) {
            console.error("❌ Missing environment variables");
            return NextResponse.json(
                { error: "Missing environment variables" },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey: groqApiKey });

        let transcript = "";
        let llmResponse = "";

        /* -------------------- STT -------------------- */
        if (!textInput && audioFile) {
            console.log("🎤 Starting Azure STT (Hindi)...");

            const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
            console.log("🔢 Audio buffer size:", audioBuffer.length);

            const speechConfig = sdk.SpeechConfig.fromSubscription(
                speechKey,
                speechRegion
            );
            speechConfig.speechRecognitionLanguage = "hi-IN"; // Changed to Hindi

            const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
            const recognizer = new sdk.SpeechRecognizer(
                speechConfig,
                audioConfig
            );

            transcript = await new Promise((resolve, reject) => {
                recognizer.recognizeOnceAsync(
                    result => {
                        console.log("👂 Reason:", result.reason);
                        recognizer.close();
                        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                            console.log("✅ Recognized:", result.text);
                            resolve(result.text);
                        } else {
                            console.warn("⚠️ No match found or canceled.");
                            resolve("");
                        }
                    },
                    err => {
                        console.error("❌ STT Error callback:", err);
                        recognizer.close();
                        reject(err);
                    }
                );
            });

            if (!transcript) {
                console.log("⚠️ No transcript generated. Returning early.");
                return NextResponse.json({
                    transcript: "",
                    replyText: "Maaf kijiye, mujhe sunayi nahi diya.", // Sorry, I didn't hear that.
                    audioUrl: null,
                    message: "No speech detected"
                });
            }

            console.log("📝 Final Transcript:", transcript);
        }

        /* -------------------- LLM -------------------- */
        if (textInput) {
            llmResponse = textInput;
        } else {
            console.log("🧠 Sending to Groq LLM...");

            const chatCompletion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                temperature: 0.8, // Slightly higher creative freedom
                max_tokens: 150,
                messages: [
                    {
                        role: "system",
                        content: `
You are Pika, a super fun and friendly best friend for a 5-year-old child named Nilesh.

**Speaking Style:**
- Speak in natural **Hindi** (or casual Hinglish if it feels warmer).
- sound VERY happy, excited, and caring.
- Use simple words a kid understands.
- Use fillers like "Oh ho!", "Hmm...", "Achha?" to sound human.
- **NEVER** sound like a robot or teacher. Be a buddy!
- Keep replies SHORT (1-2 sentences max).
`
                    },
                    {
                        role: "user",
                        content: transcript || textInput
                    }
                ]
            });

            llmResponse =
                chatCompletion.choices[0]?.message?.content ||
                "Hmm… main samjha nahi."; // Hmm... I didn't understand.
        }

        console.log("🤖 Buddy says:", llmResponse);

        /* -------------------- TTS (SSML) -------------------- */
        console.log("🔊 Generating Azure TTS (Hindi)...");

        const speechConfig = sdk.SpeechConfig.fromSubscription(
            speechKey,
            speechRegion
        );

        // Using a Hindi Neural voice.
        const voiceName = "hi-IN-SwaraNeural";
        speechConfig.speechSynthesisVoiceName = voiceName;

        // Note: style="cheerful" might be ignored if not strictly supported by hi-IN, 
        // but Swara often adapts well to pitch changes. 
        // We set rate to 1.05 (slightly fast but not rushed) and pitch to +2% for a "younger/happier" feel.
        const ssml = `
<speak version="1.0" xml:lang="hi-IN">
  <voice name="${voiceName}">
    <prosody rate="1.05">
      ${llmResponse}
    </prosody>
  </voice>
</speak>
`;

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

        const audioData = await new Promise((resolve, reject) => {
            synthesizer.speakSsmlAsync(
                ssml,
                result => {
                    synthesizer.close();
                    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                        console.log("✅ TTS generation complete. Bytes:", result.audioData.byteLength);
                        resolve(Buffer.from(result.audioData));
                    } else {
                        console.error("❌ TTS failed. Reason:", result.reason);
                        reject(new Error("TTS synthesis failed: " + result.errorDetails));
                    }
                },
                error => {
                    console.error("❌ TTS Error callback:", error);
                    reject(error);
                }
            );
        });

        // Azure returns WAV/PCM → browser can play it
        const audioUrl = `data:audio/wav;base64,${audioData.toString("base64")}`;

        console.log("📤 Sending response to client.");

        return NextResponse.json({
            transcript,
            replyText: llmResponse,
            audioUrl
        });

    } catch (error) {
        console.error("❌ API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
