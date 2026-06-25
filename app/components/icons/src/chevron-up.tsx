import BaseIcon from "@/app/components/icons/base-icon";
import type { SvgIcon } from "@/app/components/icons/icon.types";

export default function SvgIcon(props:SvgIcon) {
  return (
    <BaseIcon {...props}>
      <path d="M21 16.5L11.989 7.5L3 16.5"/>
    </BaseIcon>
  );
}