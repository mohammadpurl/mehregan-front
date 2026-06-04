'use client';

/**
 * تبدیل گفتار به متن برای فرم‌های ERP.
 * (هوک useChat.tsx مربوط به چت‌بات فرودگاه است — از این هوک استفاده کنید.)
 */
import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function transcriptFromResults(results: SpeechRecognitionResultList): {
  final: string;
  interim: string;
} {
  let final = '';
  let interim = '';
  for (let i = 0; i < results.length; i++) {
    const piece = (results[i]?.[0]?.transcript ?? '').trim();
    if (!piece) continue;
    if (results[i]?.isFinal) {
      final += `${piece} `;
    } else {
      interim += `${piece} `;
    }
  }
  return {
    final: final.replace(/\s+/g, ' ').trim(),
    interim: interim.replace(/\s+/g, ' ').trim(),
  };
}

function mergeBaseAndSpeech(base: string, final: string, interim: string): string {
  const session = [final, interim].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (!base.trim()) return session;
  if (!session) return base.trim();
  return `${base.trim()} ${session}`.replace(/\s+/g, ' ').trim();
}

export type UseVoiceToTextOptions = {
  lang?: string;
  /** متن فیلد هنگام شروع ضبط (ثابت می‌ماند تا پایان همان ضبط) */
  baseText?: string;
  onText?: (text: string) => void;
};

export function useVoiceToText(options: UseVoiceToTextOptions = {}) {
  const { lang = 'fa-IR', baseText = '', onText } = options;
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseAtStartRef = useRef('');
  const lastEmittedRef = useRef('');
  const wantsListeningRef = useRef(false);
  const onTextRef = useRef(onText);

  const isSupported = typeof window !== 'undefined' && getSpeechRecognitionCtor() != null;

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const { final, interim } = transcriptFromResults(event.results);
      setInterimText(interim);
      const combined = mergeBaseAndSpeech(baseAtStartRef.current, final, interim);
      lastEmittedRef.current = combined;
      onTextRef.current?.(combined);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // no-match: اغلب با کلمهٔ انگلیسی وسط جملهٔ فارسی — ضبط را قطع نکن
      if (event.error === 'aborted' || event.error === 'no-speech' || event.error === 'no-match') {
        return;
      }
      wantsListeningRef.current = false;
      setError(event.error || 'خطا در تشخیص گفتار');
      setIsListening(false);
    };

    recognition.onend = () => {
      if (wantsListeningRef.current && recognitionRef.current) {
        if (lastEmittedRef.current) {
          baseAtStartRef.current = lastEmittedRef.current;
        }
        try {
          recognitionRef.current.start();
          return;
        } catch {
          /* ignore */
        }
      }
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      wantsListeningRef.current = false;
      try {
        recognition.abort();
      } catch {
        try {
          recognition.stop();
        } catch {
          /* ignore */
        }
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    setInterimText('');
    const base = baseText.trim();
    baseAtStartRef.current = base;
    lastEmittedRef.current = base;
    wantsListeningRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      wantsListeningRef.current = false;
      setError('امکان شروع ضبط صدا نیست');
    }
  }, [baseText, isListening]);

  const stopListening = useCallback(() => {
    wantsListeningRef.current = false;
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
    } catch {
      /* ignore */
    }
    setIsListening(false);
    setInterimText('');
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    interimText,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}
