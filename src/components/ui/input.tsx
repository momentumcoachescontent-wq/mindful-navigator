import * as React from "react";
import { cn } from "@/lib/utils";
import { MicrophoneButton } from "./MicrophoneButton";

export interface InputProps extends React.ComponentProps<"input"> {
  showMic?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, showMic, ...props }, ref) => {
    // Only show mic by default for text-based inputs
    const shouldShowMic = showMic !== undefined ? showMic : (type === "text" || type === undefined || type === "search");

    const internalRef = React.useRef<HTMLInputElement>(null);

    const setRefs = React.useCallback(
      (node: HTMLInputElement) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
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
        window.HTMLInputElement.prototype,
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
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
            shouldShowMic && "pr-10" // Make room for the button
          )}
          ref={setRefs}
          {...props}
        />
        {shouldShowMic && (
          <div className="absolute top-1/2 -translate-y-1/2 right-2">
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
Input.displayName = "Input";

export { Input };
