import { useCallback, useEffect, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

// Speech in, search text out. Interim words land in the box as they are
// recognised, the final phrase runs the search. Every failure is reduced to
// a sentence the shopper can act on, since typing is always still there.
export function useVoiceSearch(callbacks: {
  onTranscript: (text: string, isFinal: boolean) => void;
}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onTranscript } = callbacks;

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    if (transcript) onTranscript(transcript, event.isFinal);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    setError(
      event.error === "not-allowed"
        ? "Microphone access was denied. Type your search instead."
        : event.error === "no-speech"
          ? "Didn't catch that. Tap the mic and try again."
          : "Voice search is not available right now.",
    );
  });

  const start = useCallback(async () => {
    setError(null);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError("Microphone access was denied. Type your search instead.");
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: "en-IN",
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
    });
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  // Leaving the screen mid-sentence must not leave the mic open.
  useEffect(() => () => ExpoSpeechRecognitionModule.abort(), []);

  return { listening, error, start, stop };
}
