import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent } from "@/components/ui/card";
import type { Search, SearchField } from "@/types/sidebar";

interface SearchFiltersProps {
  searchable: boolean;
  search: Search | undefined;
  searchData: Record<string, string>;
  onSearchDataChange: (data: Record<string, string>) => void;
  onSearch: () => void;
  onClear: () => void;
  isSearching: boolean;
}

export function SearchFilters({
  searchable,
  search,
  searchData,
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching,
}: SearchFiltersProps) {
  if (!searchable || !search) return null;

  const hasSearchCriteria = Object.values(searchData).some(
    (val) => val !== "" && val !== null && val !== undefined
  );

  return (
    <CardContent className="space-y-4">
      <h3 className="text-sm font-semibold">Search</h3>
      <div className="flex gap-2 flex-wrap">
        {search.fields.map((field: SearchField, index: number) => (
          <div key={index} className="flex-1 min-w-[200px]">
            {field.type === "select" ? (
              <Select
                value={searchData[field.value] || ""}
                onValueChange={(value) =>
                  onSearchDataChange({ ...searchData, [field.value]: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {(field.selectOptions || []).map((option, idx) => (
                    <SelectItem key={idx} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.type || "text"}
                placeholder={field.placeholder}
                value={searchData[field.value] || ""}
                onChange={(e) =>
                  onSearchDataChange({
                    ...searchData,
                    [field.value]: e.target.value,
                  })
                }
              />
            )}
          </div>
        ))}
        <Button onClick={onSearch} disabled={isSearching}>
          {search.searchBtnText || "Search"}
        </Button>
        {hasSearchCriteria && (
          <Button variant="outline" onClick={onClear} disabled={isSearching}>
            Clear
          </Button>
        )}
      </div>
    </CardContent>
  );
}
