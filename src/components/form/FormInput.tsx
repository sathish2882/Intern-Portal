import { Field, ErrorMessage } from "formik";
import { useState } from "react";

interface FormInputProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  variant?: "default" | "admin";
}

const baseClass =
  "w-full h-[46px] rounded-[12px] bg-transparent border px-4 text-sm outline-none transition-colors";

const variantClass: Record<NonNullable<FormInputProps["variant"]>, string> = {
  default:
    "border-[#3b82f6] text-slate-900 placeholder:text-slate-400 focus:border-[#3b82f6] focus:shadow-md",
  admin:
    "border-white/[0.12] text-adark placeholder:text-amuted hover:border-white/[0.2] focus:border-gold",
};

function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  variant = "default",
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const cls = `${baseClass} ${variantClass[variant]}`;

  return (
    <div>
      <label
        htmlFor={name}
        className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block"
      >
        {label}
      </label>

      {type === "password" ? (
        <Field name={name}>
          {({ field }: any) => (
            <div className="relative">
              <input
                id={name}
                {...field}
                value={field.value ?? ""}
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                className={cls}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amuted text-xs select-none"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          )}
        </Field>
      ) : (
        <Field name={name}>
          {({ field, form }: any) => (
            <input
              id={name}
              {...(type === "number"
                ? {
                    name: field.name,
                    value: field.value ?? "",
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;
                      form.setFieldValue(name, val === "" ? null : Number(val));
                    },
                    onBlur: () => form.setFieldTouched(name, true),
                    type: "text",
                    inputMode: "numeric" as const,
                  }
                : {
                    ...field,
                    value: field.value ?? "",
                    type,
                  })}
              placeholder={placeholder}
              className={cls}
            />
          )}
        </Field>
      )}

      <ErrorMessage
        name={name}
        component="p"
        className="text-red-400 text-[11px] mt-1"
      />
    </div>
  );
}

export default FormInput;
