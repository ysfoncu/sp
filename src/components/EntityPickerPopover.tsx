import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { PickerEntity, groupEntitiesByPlace, placesLabel } from "../types/entityPicker";
import { overBy } from "../types/quickAssign";

// Chooses the entity for the students picked in the table: a search over the entities grouped by place, each with
// its places left. Full entities can be chosen too (places never block); they show how far over the group would be.
export function EntityPickerPopover({
  options,
  selectedCount,
  onPick,
  children,
}: {
  options: PickerEntity[];
  selectedCount: number;
  onPick: (entityId: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => groupEntitiesByPlace(options, query), [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="top" align="end" className="z-[60] w-[24rem] p-0">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search entity or praksis place" aria-label="Search entity or praksis place" />
          <CommandList className="max-h-72">
            <CommandEmpty>No entity matches.</CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g.placeId} heading={g.placeName}>
                {g.entities.map((o) => {
                  const over = overBy(o.remaining, selectedCount);
                  return (
                    <CommandItem
                      key={o.id}
                      value={o.id}
                      onSelect={() => {
                        onPick(o.id);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="flex-1 truncate">{o.name}</span>
                      <span className={`ml-2 flex-shrink-0 text-xs ${o.remaining > 0 ? "text-green-700" : "text-amber-700"}`}>
                        {placesLabel(o.remaining, o.over)}
                      </span>
                      {over > 0 && (
                        <span className="ml-2 flex-shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                          over by {over}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
