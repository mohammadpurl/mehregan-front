import { FieldValues } from "react-hook-form";
import { TextInputProps } from "./text-input.types";
import { TextBox } from "../../textbox";

const TextInput = <TFormValues extends FieldValues>({
    name,
    register,
    errors,
    variant,
    ...rest
}: TextInputProps<TFormValues>) => {
    return (
        <TextBox
            name={name}
            register={register}
            errors={errors}
            variant={variant}
            {...rest}
        />
    );
};

export default TextInput;
