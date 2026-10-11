import { Check, Palette } from "lucide-react";
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
  warm: "bg-[hsl(330,24%,16%)]",
  dark: "bg-[hsl(10,95%,74%)]",
  bright: "bg-[hsl(330,12%,96%)]",
  forest: "bg-[hsl(158,17%,18%)]",
};

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="Choose appearance"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as typeof theme)}
        >
          {themes.map((t) => (
            <DropdownMenuRadioItem
              key={t.id}
              value={t.id}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                theme === t.id && "font-medium",
              )}
            >
              <span
                className={cn(
                  "w-3 h-3 rounded-full shrink-0 border border-input",
                  themePreviewColors[t.id],
                )}
              />
              {t.label}
              {theme === t.id && (
                <Check
                  className="ml-auto h-3 w-3 text-primary"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
