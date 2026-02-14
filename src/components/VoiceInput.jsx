import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VoiceInput({ onResult, placeholder = "דבר עכשיו..." }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "he-IL";

      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        if (event.results[current].isFinal) {
          onResult(transcriptText);
          setTranscript("");
          setIsListening(false);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onResult]);

  const toggleListening = () => {
    if (!recognition) {
      alert("הדפדפן שלך לא תומך בזיהוי קולי");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggleListening}
        className={cn(
          "min-w-[44px] min-h-[44px] transition-all",
          isListening && "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 animate-pulse"
        )}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 text-red-600 dark:text-red-400" />
        ) : (
          <Mic className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        )}
      </Button>
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{transcript || placeholder}</span>
        </div>
      )}
    </div>
  );
}