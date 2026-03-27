import { Field, ErrorMessage } from "formik";
import { Input, InputNumber } from "antd";

interface FormInputProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  variant?: "default" | "admin";
}

const baseClass =
  "!w-full !h-[46px] !rounded-[12px] " +
  "!bg-transparent !border transition-colors";

const variantClass: Record<NonNullable<FormInputProps["variant"]>, string> = {
  default:
    "!border-[#3b82f6] focus-within:!border-[#3b82f6] focus-within:!shadow-md",
  admin:
    "!border-white/[0.12] hover:!border-white/[0.2] focus-within:!border-[#e9a628] focus-within:!shadow-none",
};

const inputClass =
  "!bg-transparent !text-slate-900 !px-4 !text-sm !font-body " +
  "placeholder:!text-slate-400";

function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  variant = "default",
}: FormInputProps) {
  const commonClass = `${baseClass} ${variantClass[variant]}`;

  return (
    <div>
      {/* LABEL */}
      <label
        htmlFor={name}
        className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block"
      >
        {label}
      </label>

      {/* INPUT */}
      {type === "password" ? (
        <Field name={name}>
          {({ field }: any) => (
            <Input.Password
              id={name}
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={placeholder}
              className={commonClass}
              classNames={{ input: inputClass }}
            />
          )}
        </Field>
      ) : type === "number" ? (
        <Field name={name}>
          {({ field, form }: any) => (
            <InputNumber
              id={name}
              value={field.value ?? null}
              placeholder={placeholder}
              controls={false}
              onChange={(value) => form.setFieldValue(name, value)}
              onBlur={() => form.setFieldTouched(name, true)}
              className={`${commonClass} flex items-center 
                [&_.ant-input-number-input]:!px-4 
                [&_.ant-input-number-input]:!bg-transparent 
                [&_.ant-input-number-input]:!text-slate-900 
                [&_.ant-input-number-input]:!h-[46px] 
                [&_.ant-input-number-input]:!text-sm`}
            />
          )}
        </Field>
      ) : (
        <Field name={name}>
          {({ field }: any) => (
            <Input
              id={name}
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              type={type}
              placeholder={placeholder}
              className={commonClass}
              classNames={{ input: inputClass }}
            />
          )}
        </Field>
      )}

      {/* ERROR */}
      <ErrorMessage
        name={name}
        component="p"
        className="text-red-400 text-[11px] mt-1"
      />
    </div>
  );
}

export default FormInput;
