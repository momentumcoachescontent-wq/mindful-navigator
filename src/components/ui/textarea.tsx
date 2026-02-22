import * as React from "react";
import { cn } from "@/lib/utils";
import { MicrophoneButton } from "./MicrophoneButton";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showMic?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showMic = true, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    const handleTextReceived = (text: string) => {
      const el = internalRef.current;
      if (!el) return;

      const currentValue = el.value;
      const newValue = currentValue ? `${currentValue} ${text}` : text;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, newValue);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        el.value = newValue;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
            showMic && "pr-10" // Make room for the button
          )}
          ref={setRefs}
          {...props}
        />
        {showMic && (
          <div className="absolute top-2 right-2">
            <MicrophoneButton
              onTextReceived={handleTextReceived}
              size="icon-sm"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
            />
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
