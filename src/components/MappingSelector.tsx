import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsViewer } from "@/components/TabsViewer";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownSelector {
  label: string;
  selectOptions: DropdownOption[];
}

interface ViewConfig {
  title?: string;
  description?: string;
  icon?: string;
  buttons?: any[];
  getDataUrl: string;
  search?: any;
  tableHeaders?: any[];
}

interface Props {
  dropdownSelector: DropdownSelector;
  views: Record<string, ViewConfig>;
  onTabChange: (tabId: string, getDataUrl: string, page?: number) => Promise<void>;
  onRowAction: (action: any, rowData: any) => void;
  onButtonClick: (button: any) => void;
  onViewJson: (data: any) => void;
  CellRenderer: React.ComponentType<any>;
  tabPagination: Record<string, any>;
  onPageChange: (tabId: string, page: number) => void;
  searchData: Record<string, any>;
  onSearchDataChange: (data: Record<string, any>) => void;
  onSearch: (tabId: string, searchValue: string) => Promise<void>;
  onClear: (tabId: string) => void;
  isSearching: boolean;
  tabsData: Record<string, any[]>;
  loadingTabs: Record<string, boolean>;
  tabErrors: Record<string, string | null>;
}

export const MappingSelector: React.FC<Props> = ({
  dropdownSelector,
  views,
  onTabChange,
  onRowAction,
  onButtonClick,
  onViewJson,
  CellRenderer,
  tabPagination,
  onPageChange,
  searchData,
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching,
  tabsData,
  loadingTabs,
  tabErrors,
}) => {
  const [selectedView, setSelectedView] = useState<string>(
    dropdownSelector.selectOptions[0]?.value || ""
  );

  const selectedViewConfig = views[selectedView];

  // Fetch data when selected view changes or component mounts
  useEffect(() => {
    if (selectedView && selectedViewConfig?.getDataUrl) {
      console.log(
        `[MappingSelector] Fetching data for ${selectedView} from ${selectedViewConfig.getDataUrl}`
      );
      onTabChange(selectedView, selectedViewConfig.getDataUrl, 0);
    }
  }, [selectedView]);

  if (!selectedViewConfig) {
    return (
      <div className="p-4 text-red-500">
        No view configuration found for "{selectedView}"
      </div>
    );
  }

  // Create a single-tab configuration for TabsViewer
  const singleTab = {
    tabId: selectedView,
    tabTitle: dropdownSelector.selectOptions.find(
      (opt) => opt.value === selectedView
    )?.label,
    ...selectedViewConfig,
  };

  return (
    <div className="space-y-4  w-full h-full flex flex-col">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">{dropdownSelector.label}</label>
        <Select value={selectedView} onValueChange={setSelectedView}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a mapping type" />
          </SelectTrigger>
          <SelectContent>
            {dropdownSelector.selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden w-full">
        <TabsViewer
          tabs={[singleTab]}
          activeTab={selectedView}
          tabsData={tabsData}
          loadingTabs={loadingTabs}
          tabErrors={tabErrors}
          title={selectedViewConfig.title || dropdownSelector.label}
          onTabChange={onTabChange}
          onRowAction={onRowAction}
          onButtonClick={onButtonClick}
          onViewJson={onViewJson}
          CellRenderer={CellRenderer}
          searchData={searchData}
          onSearchDataChange={onSearchDataChange}
          onSearch={() => onSearch(selectedView, searchData[selectedView] || "")}
          onClear={() => onClear(selectedView)}
          isSearching={isSearching}
          tabPagination={tabPagination}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
