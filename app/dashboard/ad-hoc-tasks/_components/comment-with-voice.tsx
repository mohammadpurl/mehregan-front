'use client';

import { Mic, MicOff } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { useVoiceToText } from '@/app/hooks/useVoiceToText';

/** حداکثر طول پیش‌فرض برای فیلدهای چندخطی (شرح / پیام) */
export const VOICE_TEXTAREA_MAX_LENGTH = 10_000;

/** حداکثر طول پیش‌فرض برای عنوان یک‌خطی */
export const VOICE_INPUT_MAX_LENGTH = 500;

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  /** یک‌خطی (مثلاً عنوان) — پیش‌فرض: چندخطی */
  multiline?: boolean;
  maxLength?: number;
};

function clampText(text: string, maxLen: number | undefined): string {
  if (maxLen == null || text.length <= maxLen) return text;
  return text.slice(0, maxLen);
}

export function CommentWithVoice({
  value,
  onChange,
  label = 'توضیح / کامنت',
  placeholder = 'متن کار یا کامنت را بنویسید...',
  disabled,
  rows = 4,
  multiline = true,
  maxLength = multiline ? VOICE_TEXTAREA_MAX_LENGTH : VOICE_INPUT_MAX_LENGTH,
}: Props) {
  const handleText = (text: string) => onChange(clampText(text, maxLength));

  const { isSupported, isListening, error, toggleListening } = useVoiceToText({
    baseText: value,
    onText: handleText,
  });

  const onManualChange = (text: string) => handleText(text);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {isSupported ? (
          <Button
            type="button"
            variant={isListening ? 'destructive' : 'outline'}
            size="sm"
            onClick={toggleListening}
            disabled={disabled}
          >
            {isListening ? (
              <>
                <MicOff className="ml-1 h-4 w-4" />
                توقف ضبط
              </>
            ) : (
              <>
                <Mic className="ml-1 h-4 w-4" />
                ضبط صدا
              </>
            )}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">مرورگر از ضبط صدا پشتیبانی نمی‌کند</span>
        )}
      </div>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onManualChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onManualChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
        />
      )}
      {maxLength ? (
        <p className="text-xs text-muted-foreground text-left" dir="ltr">
          {value.length.toLocaleString('fa-IR')} / {maxLength.toLocaleString('fa-IR')}
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {isListening ? (
        <p className="text-xs text-amber-700">در حال شنیدن… پس از اتمام، «توقف ضبط» را بزنید.</p>
      ) : null}
    </div>
  );
}
