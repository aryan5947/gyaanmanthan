import React, { useEffect, useState } from "react";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import "./ErrorFallback.css";

interface ErrorFallbackProps {
  message: string;
  onRetry: () => void;
  retryIn?: number; // optional countdown
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ message, onRetry, retryIn }) => {
  const [countdown, setCountdown] = useState(retryIn || 0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  return (
    <div className="feed-error" role="alert" aria-live="polite">
      <div className="feed-error__icon" aria-hidden="true">
        <ExclamationTriangleIcon className="h-5 w-5" />
      </div>

      <p className="feed-error__message">{message}</p>

      <button
        className="feed-error__retry"
        onClick={onRetry}
        disabled={countdown > 0}
      >
        <ArrowPathIcon className="feed-error__retry-icon" aria-hidden="true" />
        {countdown > 0 ? `Retry in ${countdown}s` : "Retry"}
      </button>
    </div>
  );
};

export default ErrorFallback;
