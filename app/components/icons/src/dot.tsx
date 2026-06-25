import BaseIcon from "@/app/components/icons/base-icon";
import type { SvgIcon } from "@/app/components/icons/icon.types";

export default function SvgIcon(props:SvgIcon) {
  return (
    <BaseIcon {...props}>
      <circle cx="3.5779" cy="3.2879" r="2.7487"/>
    </BaseIcon>
  );
}