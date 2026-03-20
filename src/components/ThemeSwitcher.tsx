import { Palette } from "lucide-react";
import { themes, useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themePreviewColors: Record<string, string> = {
  warm: "bg-[hsl(160,30%,28%)]",
  dark: "bg-[hsl(15,90%,55%)]",
  bright: "bg-[hsl(220,85%,55%)]",
  forest: "bg-[hsl(145,50%,45%)]",
};

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as typeof theme)}>
          {themes.map((t) => (
            <DropdownMenuRadioItem
              key={t.id}
              value={t.id}
              className={cn("flex items-center gap-3 cursor-pointer", theme === t.id && "font-medium")}
            >
              <span className={cn("w-3 h-3 rounded-full shrink-0", themePreviewColors[t.id])} />
              {t.label}
              {theme === t.id && <span className="ml-auto text-xs text-primary">✓</span>}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
