"use client";

import { forwardRef } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, disabled, label, description, id }, ref) => {
    return (
      <div className="flex items-start space-x-3">
        <button
          ref={ref}
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50
            ${checked ? "bg-indigo-600" : "bg-gray-200"}
          `}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow 
              ring-0 transition duration-200 ease-in-out
              ${checked ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </button>
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={id}
                className="block text-sm font-medium text-gray-900"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = "Toggle";

export default Toggle;
