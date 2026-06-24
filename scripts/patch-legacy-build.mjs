/**
 * Patches legacy Classbon imports before production build.
 * Safe to run on every build — overwrites known legacy shims only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function write(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`[patch-legacy-build] wrote ${relativePath}`);
}

write(
  "app/(auth)/_components/verification-form.tsx",
  `'use client';

/** ERP sign-in (legacy Classbon OTP form replaced at build time). */
export { SignInForm as VerificationForm } from './sign-in-form';
`
);

write(
  "lib/classbon-icons.tsx",
  `export {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Home,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageCircle as Message,
  Phone,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";

export type { LucideIcon as Icon } from "lucide-react";
`
);

write(
  "_components/general/button.tsx",
  `export { Button, styles as buttonStyles } from "@/app/components/button";
`
);

write(
  "_components/general/textbox.tsx",
  `export { TextBox, styles as textboxStyles } from "@/app/components/textbox";
`
);

console.log("[patch-legacy-build] done");
