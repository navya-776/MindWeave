/**
 * Senior Voice & Speech Assistant
 * Browser-native Web Speech API implementation for dignified senior accessibility.
 * Runs completely client-side for zero latency and strict privacy preservation.
 */

export interface SpeechOptions {
  rate?: number; // 0.6 to 1.0 (slower for seniors)
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

/** Speak text aloud using SpeechSynthesis with senior-friendly default speed. */
export function speakText(text: string, options: SpeechOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("SpeechSynthesis is not supported in this browser.");
    return;
  }

  try {
    // Cancel any active speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 0.85; // Relaxed speed
    utterance.pitch = options.pitch ?? 1.0;
    utterance.lang = options.lang ?? "en-US";

    if (options.onEnd) {
      utterance.onend = () => options.onEnd?.();
    }
    if (options.onError) {
      utterance.onerror = (e) => options.onError?.(e);
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speech synthesis error:", err);
  }
}

/** Stop any currently playing audio speech. */
export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/** Check if speech recognition is available in current browser environment. */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

export type RecognitionCallback = (transcript: string, isFinal: boolean) => void;

/**
 * Start listening for voice input from the microphone.
 * Returns an unsubscribe / stop function.
 */
export function startListening(
  onResult: RecognitionCallback,
  onError?: (err: any) => void,
  lang: string = "en-US"
): () => void {
  if (!isSpeechRecognitionSupported()) {
    console.warn("SpeechRecognition not supported in this browser.");
    onError?.(new Error("SpeechRecognition not supported"));
    return () => {};
  }

  try {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      onError?.(event);
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore if already stopped
      }
    };
  } catch (err) {
    console.error("Failed to start speech recognition:", err);
    onError?.(err);
    return () => {};
  }
}
