"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IRAN_PROVINCES } from "@/lib/iran-province";

type ProvinceComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
};

/**
 * Searchable province picker (استان) — the user can either scroll through
 * the list or type to filter it.
 */
export function ProvinceCombobox({
  value,
  onChange,
  id,
  placeholder = "انتخاب استان...",
}: ProvinceComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="استان"
          className={cn(
            "h-9 w-full justify-between border-input bg-transparent px-3 font-normal shadow-xs transition-[color,box-shadow] dark:bg-input/30",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
        dir="rtl"
      >
        <Command>
          <CommandInput placeholder="جستجوی استان..." />
          <CommandList>
            <CommandEmpty>استانی یافت نشد.</CommandEmpty>
            <CommandGroup>
              {IRAN_PROVINCES.map((province) => (
                <CommandItem
                  key={province}
                  value={province}
                  onSelect={() => {
                    onChange(province === value ? "" : province);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === province ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {province}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}