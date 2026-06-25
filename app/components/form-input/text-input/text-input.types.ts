import { DeepMap, FieldError, FieldValues, Path, RegisterOptions, UseFormRegister } from "react-hook-form";
import { TextboxProps } from "../../textbox";

export type TextInputProps<TFormValues extends FieldValues> = Omit<TextboxProps<TFormValues>, 'name'> & {
    register: UseFormRegister<TFormValues>,
    name: Path<TFormValues>,
    errors: Partial<DeepMap<TFormValues, FieldError>>
}

export type ErpTextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    description?: string;
    error?: string;
    rightAligned?: boolean;
  };