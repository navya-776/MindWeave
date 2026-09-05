import { useState, useEffect } from "react";
import { speakText, stopSpeech, isSpeechRecognitionSupported, startListening } from "@/lib/intelliplay/voiceAssistant";
import { useProfile } from "@/lib/intelliplay/store";

export interface SeniorVoiceBarProps {
  promptText?: string;
  onVoiceResult?: (text: string) => void;
  className?: string;
  autoPlay?: boolean;
}

export function SeniorVoiceBar({
  promptText,
  onVoiceResult,
  className = "",
  autoPlay = false,
}: SeniorVoiceBarProps) {
  const { profile } = useProfile();
  const speechRate = profile?.accessibility?.speechRate ?? 0.85;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const canListen = isSpeechRecognitionSupported() && Boolean(onVoiceResult);

  useEffect(() => {
    if (autoPlay && promptText) {
      handleSpeak();
    }
    return () => {
      stopSpeech();
    };
  }, [promptText]);

  const handleSpeak = () => {
    if (!promptText) return;
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    speakText(promptText, {
      rate: speechRate,
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handleToggleListen = () => {
    if (!canListen) return;
    if (isListening) {
      setIsListening(false);
      setInterimText("");
      return;
    }

    setIsListening(true);
    setInterimText("Listening…");

    const stopFn = startListening(
      (transcript, isFinal) => {
        setInterimText(transcript);
        if (isFinal) {
          setIsListening(false);
          onVoiceResult?.(transcript);
        }
      },
      () => {
        setIsListening(false);
        setInterimText("");
      }
    );

    // Auto timeout after 8 seconds
    setTimeout(() => {
      setIsListening(false);
      stopFn();
    }, 8000);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-muted/60 border border-border ${className}`}
    >
      {promptText ? (
        <button
          type="button"
          onClick={handleSpeak}
          className={`toy-press flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
            isPlaying
              ? "bg-primary text-primary-foreground shadow-soft animate-pulse"
              : "bg-card border border-border text-foreground hover:border-primary/50"
          }`}
          title="Read instructions aloud"
        >
          <span className="text-base">{isPlaying ? "🔊" : "🔈"}</span>
          <span>{isPlaying ? "Reading Aloud…" : "Read Aloud"}</span>
        </button>
      ) : null}

      {canListen ? (
        <button
          type="button"
          onClick={handleToggleListen}
          className={`toy-press flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
            isListening
              ? "bg-destructive text-destructive-foreground shadow-soft animate-pulse"
              : "bg-card border border-border text-foreground hover:border-primary/50"
          }`}
          title="Answer by voice"
        >
          <span className="text-base">{isListening ? "🎙️" : "🎤"}</span>
          <span>{isListening ? "Listening…" : "Answer by Voice"}</span>
        </button>
      ) : null}

      {interimText && isListening ? (
        <span className="text-xs font-semibold text-primary italic pl-2 truncate max-w-xs">
          "{interimText}"
        </span>
      ) : null}
    </div>
  );
}
