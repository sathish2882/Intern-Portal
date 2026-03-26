import { Field, ErrorMessage } from "formik";
import { Input, InputNumber } from "antd";

interface FormInputProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
}

const commonClass =
  "!w-full !h-[46px] !rounded-[12px] " +
  "!bg-transparent !border-2 !border-[#3b82f6] " +
  "focus-within:!border-[#3b82f6] focus-within:!shadow-md";

const inputClass =
  "!bg-transparent !text-slate-900 !px-4 !text-sm !font-body " +
  "placeholder:!text-slate-400";

function FormInput({
  label,
  name,
  type = "text",
  placeholder,
}: FormInputProps) {
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
              {...field}
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
              value={field.value}
              placeholder={placeholder}
              className={commonClass}
              classNames={{ input: inputClass }}
              controls={false}
              onChange={(value) => form.setFieldValue(name, value)}
            />
          )}
        </Field>
      ) : (
        <Field name={name}>
          {({ field }: any) => (
            <Input
              {...field}
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
