# Internal Metrics UI - Complete Mapping & Feature Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [View Types](#view-types)
3. [DualSectionView](#dualsectionview)
4. [DropdownTableView](#dropdowntableview)
5. [TabsViewer](#tabsviewer)
6. [Configuration Structure](#configuration-structure)
7. [API Integration](#api-integration)
8. [Features Summary](#features-summary)

---

## Architecture Overview

### Framework & Stack

- **Framework**: React 18 + TypeScript
- **UI Library**: shadcn/ui components
- **Icons**: lucide-react + custom DynamicIcon mapping
- **Notifications**: sonner (toast-based)
- **API Client**: Fetch-wrapper pattern with `apiClient<T>(url, config)`
- **State Management**: React Signals for global state

### Component Hierarchy

```
DynamicContent (Main Container)
├── TabsViewer (TABS view type)
│   ├── Tab 1...N
│   └── Tab Content (Table + Search)
├── DropdownTableView (DROPDOWN_VIEW type)
│   ├── Dropdown Selector
│   ├── Search/Filter Section
│   └── Data Table with Pagination
└── DualSectionView (DUAL_SECTION_VIEW type)
    ├── Left Section (Paginated List)
    ├── Right Section (Multi-select)
    ├── Modal (Add Items)
    └── Action Buttons
```

---

## View Types

### 1. TABS View

**Purpose**: Display data in multiple tabs with search and filtering

**Features**:

- Multiple tabs fetched from config
- Search/filter on each tab independently
- Dynamic search with parameters
- Pagination support
- Action dropdowns per row

**When to Use**: When you have related data that should be organized in separate tabs

**Example Config**:

```json
{
  "type": "TABS",
  "tabs": [
    {
      "tabId": "tab-1",
      "title": "Tab Title",
      "getDataUrl": "/api/data",
      "search": {
        "fields": [...],
        "searchActionUrl": "/api/search",
        "method": "GET"
      },
      "tableHeaders": [...]
    }
  ]
}
```

---

### 2. DROPDOWN_VIEW Type

**Purpose**: Select between multiple views with a dropdown selector

**Features**:

- Dropdown selector for switching views
- Each view has its own table, search, and pagination
- Isolated data loading per view
- Single action dropdown per row
- Search filters with multiple field types

**When to Use**: When you have multiple independent datasets that user can toggle between

**Example Config**:

```json
{
  "type": "DROPDOWN_VIEW",
  "dropdownSelector": {
    "label": "Select Type",
    "selectOptions": [
      { "label": "Option 1", "value": "view-1" },
      { "label": "Option 2", "value": "view-2" }
    ]
  },
  "views": {
    "view-1": {
      "title": "View 1",
      "getDataUrl": "/api/data-1",
      "search": {...},
      "tableHeaders": [...]
    }
  }
}
```

---

### 3. DUAL_SECTION_VIEW Type

**Purpose**: Create mappings between two entities with display order

**Features**:

- Left section: Paginated, searchable single-select list
- Right section: Multi-select with display order inputs
- Modal to add items from another API
- Extract fields from selected items for payload
- Auto-select first item on load
- Cyan highlight for selected items
- Only newly added items sent to API
- Toast notifications for user feedback

**When to Use**: When creating/managing relationships between entities (exam↔grades, exam-grades↔streams, etc.)

---

## DualSectionView

### Component Location

`src/components/DualSectionView.tsx` (760 lines)

### Props

```typescript
interface DualSectionViewProps {
  leftSection: {
    title: string;
    description: string;
    fetchUrl: string;
    optionLabelKey: string;
    optionValueKey: string;
    fieldName: string;
    selectionType: "single";
    placeholder?: string;
    extractFields?: {
      [payloadKey: string]: objectKey; // Extract fields for payload
    };
  };
  rightSection: {
    title: string;
    description: string;
    fetchUrl: string;
    optionLabelKey: string;
    optionValueKey: string;
    fieldName: string;
    selectionType: "multi-select";
    includeDisplayOrder: boolean;
    displayOrderPlaceholder?: string;
    searchParams?: {
      [paramKey: string]: objectKey; // Extract params from left selection
    };
    searchParam?: string; // Legacy single param
  };
  popupActions: Array<{
    id: string;
    type: "modal" | "copy" | "submit";
    label: string;
    modalFetchUrl?: string;
    modalOptionLabelKey?: string;
    modalOptionValueKey?: string;
    // ... other config
  }>;
  submitUrl: string;
  method: "POST" | "PUT";
  onSuccess?: () => void;
}
```

### State Management

```typescript
// Selection
const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
const [selectedLeftObject, setSelectedLeftObject] =
  useState<SelectionItem | null>(null);
const [selectedRight, setSelectedRight] = useState<string[]>([]);

// Pagination (Left Section)
const [leftPageNumber, setLeftPageNumber] = useState(0);
const [leftPageSize, setLeftPageSize] = useState(10);
const [leftTotalElements, setLeftTotalElements] = useState(0);

// Display Orders
const [rightDisplayOrders, setRightDisplayOrders] = useState<
  Record<string, number>
>({});

// Data & Loading
const [leftOptions, setLeftOptions] = useState<SelectionItem[]>([]);
const [rightOptions, setRightOptions] = useState<SelectionItem[]>([]);
const [originalRightOptions, setOriginalRightOptions] = useState<
  SelectionItem[]
>([]);
const [addedItems, setAddedItems] = useState<Record<string, SelectionItem>>({});

// UI State
const [leftLoading, setLeftLoading] = useState(false);
const [rightLoading, setRightLoading] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);
const [searchLeft, setSearchLeft] = useState("");
```

### Key Features

#### 1. Left Section - Paginated List

- **Pagination**: 10 items per page by default
- **Search**: Client-side filtering on current page
- **Auto-Select**: First item auto-selected on load
- **Visual Feedback**: Cyan border and background for selected item
- **Scrollbar**: Hidden but scrollable
- **API Call**: `GET {fetchUrl}?level=SYSTEM&pageNo=0&pageSize=10`

#### 2. Right Section - Multi-Select with Display Order

- **Dynamic Fetch**: Triggered when left item selected
- **Extracted Search Params**: `searchParams` config extracts fields from selected left object
- **Example API Call**:
  ```
  GET /api/exam-grade-streams?examId=3&gradeId=2&level=SYSTEM
  ```
- **Auto-Population**: Displays already-mapped items with their display orders
- **Display Order Inputs**: Editable number inputs for each item
- **Remove Buttons**: X button only for newly added items

#### 3. Modal - Add Items

- **Trigger**: "Add Items" button in action buttons
- **Multi-Select**: Select multiple items to add
- **API**: Fetch available items from `modalFetchUrl`
- **Data Preservation**: All original fields preserved when adding
- **Label Fallbacks**: Uses modalLabelKey → displayName → name → gradeName

#### 4. Submit & Payload

**Intelligent Payload Construction**:

- Check if `extractFields` exists in leftSection config
- Extract `examId`, `gradeId`, etc. from `selectedLeftObject`
- Add to payload as separate fields
- Only include newly added items (not original ones)
- Include display orders in array

**Example Payload**:

```json
{
  "examId": 3,
  "gradeId": 2,
  "streams": [
    { "streamId": 1, "displayOrder": 1 },
    { "streamId": 5, "displayOrder": 2 }
  ]
}
```

**Fallback Payload** (if no extractFields):

```json
{
  "examGradeId": 47,
  "gradeDisplayOrderRequests": [{ "gradeId": 2, "displayOrder": 1 }]
}
```

#### 5. Notifications

- **Success**: `toast.success("Mapping created successfully!")`
- **Error**: `toast.error(error.message)`
- **Info**: `toast.info("Copy functionality coming soon")`

### Configuration Examples

#### Example 1: Exam-Grade Mapping

```json
{
  "configName": "exam-grade-creation",
  "uiJson": {
    "type": "DUAL_SECTION_VIEW",
    "leftSection": {
      "title": "Exams",
      "fetchUrl": "/secure/api/v1/exams",
      "optionLabelKey": "displayName",
      "optionValueKey": "id",
      "fieldName": "examId",
      "selectionType": "single"
    },
    "rightSection": {
      "title": "Grades",
      "fetchUrl": "/secure/api/v1/exam-grades",
      "optionLabelKey": "gradeName",
      "optionValueKey": "gradeId",
      "fieldName": "gradeDisplayOrderRequests",
      "includeDisplayOrder": true,
      "searchParam": "examId"
    },
    "submitUrl": "/secure/api/v1/exam-grades",
    "method": "POST"
  }
}
```

#### Example 2: Exam-Grade-Stream Mapping (with extractFields)

```json
{
  "configName": "exam-grade-stream-creation",
  "uiJson": {
    "type": "DUAL_SECTION_VIEW",
    "leftSection": {
      "title": "Exam-Grades",
      "fetchUrl": "/secure/api/v1/exam-grades",
      "optionLabelKey": "displayName",
      "optionValueKey": "examGradeMappingId",
      "extractFields": {
        "examId": "examId",
        "gradeId": "gradeId"
      },
      "fieldName": "examId,gradeId",
      "selectionType": "single"
    },
    "rightSection": {
      "title": "Streams",
      "fetchUrl": "/secure/api/v1/exam-grade-streams",
      "optionLabelKey": "streamName",
      "optionValueKey": "streamId",
      "fieldName": "streams",
      "includeDisplayOrder": true,
      "searchParams": {
        "examId": "examId",
        "gradeId": "gradeId"
      }
    },
    "submitUrl": "/secure/api/v1/exam-grade-streams",
    "method": "POST"
  }
}
```

---

## DropdownTableView

### Component Location

`src/components/DropdownTableView.tsx` (400 lines)

### Props

```typescript
interface DropdownTableViewProps {
  dropdownSelector: {
    label: string;
    selectOptions: Array<{
      label: string;
      value: string;
    }>;
  };
  views: {
    [viewKey: string]: {
      title: string;
      description?: string;
      icon?: string;
      getDataUrl: string;
      search?: {
        fields: Array<{
          label: string;
          type: "text" | "select";
          value: string;
          placeholder?: string;
          selectOptions?: Array<{ label: string; value: string }>;
        }>;
        searchActionUrl: string;
        method: "GET" | "POST";
      };
      tableHeaders: Array<{
        order: number;
        accessor: string;
        Header: string;
        type: "text" | "actions";
        actions?: Array<{
          id: string;
          title: string;
          type: string;
        }>;
      }>;
    };
  };
  onTabChange: (viewKey: string, url: string, page: number) => void;
  onRowAction: (action: any, id: string, viewKey: string) => void;
  onButtonClick?: (button: any) => void;
  onViewJson?: (rowData: any) => void;
  CellRenderer?: (props: any) => JSX.Element;
  tabPagination: Record<string, any>;
  onPageChange: (viewKey: string, page: number) => void;
  searchData: Record<string, any>;
  onSearchDataChange: (data: Record<string, any>) => void;
  onSearch: (viewKey: string, searchValue: string) => void;
  onClear: (viewKey: string) => void;
  isSearching: boolean;
  tabsData: Record<string, any[]>;
  loadingTabs: Record<string, boolean>;
  tabErrors?: Record<string, any>;
}
```

### Features

#### 1. Dropdown Selector

- Switch between multiple views
- View key passed to all handlers
- Current view displayed in table

#### 2. Search & Filter Section

- **Layout**: Horizontal single-line flex layout with scrolling
- **Field Types**:
  - Text input: For free-form search
  - Select dropdown: For categorical filtering
- **Features**:
  - Invisible scrollbar but scrollable
  - Search button with loading state
  - Clear button (only shows if filters have values)
  - All filters sent to API

#### 3. Table with Pagination

- **Dynamic Columns**: Based on `tableHeaders` config
- **Column Sorting**: By `order` property
- **Pagination**: Shows "Page X of Y (Total Z items)"
- **Previous/Next Buttons**: Smart disable logic
- **Actions**: Single dropdown with Edit/Delete options

#### 4. API Integration

**Initial Load**:

```
GET {getDataUrl}?level=SYSTEM&pageNo=0&pageSize=10
```

**Search**:

```
GET {searchActionUrl}?level=SYSTEM&pageNo=0&pageSize=100
  &examId=3&gradeId=2&sortBy=examName&sortDir=ASC
```

**Clear Search**:

- Resets search data
- Refetches from `getDataUrl`
- Resets to page 0

### Configuration Example

```json
{
  "type": "DROPDOWN_VIEW",
  "dropdownSelector": {
    "label": "Select Mapping Type",
    "selectOptions": [
      { "label": "Exam-Grade", "value": "exam-grade" },
      { "label": "Exam-Grade-Stream", "value": "exam-grade-stream" }
    ]
  },
  "views": {
    "exam-grade": {
      "title": "Exam-Grade Mapping",
      "getDataUrl": "/secure/api/v1/exam-grades",
      "search": {
        "fields": [
          {
            "label": "Exam ID",
            "type": "text",
            "value": "examId",
            "placeholder": "Enter Exam ID"
          },
          {
            "label": "Sort By",
            "type": "select",
            "value": "sortBy",
            "selectOptions": [
              { "label": "Exam Name", "value": "examName" },
              { "label": "Grade Name", "value": "gradeName" }
            ]
          }
        ],
        "searchActionUrl": "/secure/api/v1/exam-grades",
        "method": "GET"
      },
      "tableHeaders": [
        {
          "order": 1,
          "accessor": "id",
          "Header": "ID",
          "type": "text"
        },
        {
          "order": 2,
          "accessor": "examName",
          "Header": "Exam",
          "type": "text"
        },
        {
          "order": 999,
          "accessor": "actions",
          "Header": "Actions",
          "type": "actions",
          "actions": [
            { "id": "edit", "title": "Edit" },
            { "id": "delete", "title": "Delete" }
          ]
        }
      ]
    }
  }
}
```

---

## TabsViewer

### Component Location

`src/components/TabsViewer.tsx`

### Features

- Multiple tabs with independent data loading
- Per-tab search and filtering
- Per-tab pagination
- Tab-specific actions
- Unified UI for tab management

### When to Use

- Multiple related datasets in one view
- Tab-based content organization
- Each tab has similar structure but different data

---

## Configuration Structure

### Base Config File Structure

```json
{
  "configName": "unique-config-name",
  "order": 1,
  "description": "Human readable description",
  "uiJson": {
    "type": "DUAL_SECTION_VIEW | DROPDOWN_VIEW | TABS"
    // Type-specific config...
  }
}
```

### File Locations

- **Exam-Grade Mapping**: `examgrade.json`
- **All Mappings Config**: `ztest.json`
- **Other Configs**: `{name}.json` in root

---

## API Integration

### Request Pattern

```typescript
const response = await apiClient<T>(url, {
  method: "GET" | "POST" | "PUT" | "DELETE",
  params: { key: value }, // Query parameters
  body: JSON.stringify(payload), // Request body
});
```

### Response Handling

**Paginated Response**:

```json
{
  "content": [...],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 100,
  "totalPages": 10
}
```

**Fallback Formats**:

- `response.data` (wrapped response)
- `response` (direct array)
- `response.results` (array in results field)

### Error Handling

- Try-catch wrapping all API calls
- User notifications via `toast.error()`
- Console logging for debugging
- Graceful fallbacks to empty data

---

## Features Summary

### DualSectionView Features

✅ Paginated left section (10 items/page)
✅ Searchable list with filter
✅ Auto-select first item on load
✅ Cyan highlight for selected items
✅ Multi-select right section
✅ Display order inputs for each item
✅ Modal to add items from another API
✅ Extract fields from selected object
✅ Dynamic search parameters
✅ Only newly added items sent to API
✅ Toast notifications
✅ Hidden scrollbars with scroll functionality
✅ Responsive layout
✅ Loading states with spinners

### DropdownTableView Features

✅ Dropdown selector for view switching
✅ Dynamic table with sortable columns
✅ Single-line search filters
✅ Text and select input types
✅ Search with custom parameters
✅ Clear search functionality
✅ Pagination with previous/next
✅ Action dropdown per row
✅ Loading states
✅ No data message
✅ Responsive table design
✅ Horizontal scrollbar for filters
✅ Invisible scrollbars

### TabsViewer Features

✅ Multiple tabs with independent data
✅ Per-tab search filtering
✅ Per-tab pagination
✅ Tab-specific actions
✅ Consistent UI across tabs
✅ Auto-refresh after CRUD operations

### General Features

✅ Dynamic configuration from JSON
✅ Toast notifications (sonner)
✅ TypeScript support
✅ Responsive design
✅ Accessible UI (shadcn/ui)
✅ Loading skeletons
✅ Error handling
✅ Console logging for debugging
✅ Backward compatibility
✅ Extensible architecture

---

## Data Flow Example

### Exam-Grade-Stream Creation Flow

1. **User Opens Form**

   - DualSectionView loads
   - Fetches exam-grades from `/secure/api/v1/exam-grades?level=SYSTEM&pageNo=0&pageSize=10`
   - Auto-selects first exam-grade (e.g., examId=3, gradeId=2)

2. **Left Selection Triggers Right Fetch**

   - `selectedLeftObject` contains full exam-grade object
   - `extractFields` config extracts examId=3 and gradeId=2
   - Right section fetches: `/secure/api/v1/exam-grade-streams?examId=3&gradeId=2&level=SYSTEM`
   - Displays already-mapped streams with their display orders

3. **User Adds Streams**

   - Clicks "Add Streams" button
   - Modal opens with `/secure/api/v1/stream` data
   - User selects multiple streams
   - Auto display order assigned (1, 2, 3...)
   - X button only visible for newly added items

4. **User Submits**
   - System builds payload:
     ```json
     {
       "examId": 3,
       "gradeId": 2,
       "streams": [
         { "streamId": 5, "displayOrder": 1 },
         { "streamId": 8, "displayOrder": 2 }
       ]
     }
     ```
   - POSTs to `/secure/api/v1/exam-grade-streams`
   - Success toast shown
   - Form resets
   - Parent component refreshes data

---

## Best Practices

### Configuration

- Always include `order` property for consistent ordering
- Use descriptive labels and placeholders
- Set `displayOrderPlaceholder` to guide users
- Define `extractFields` when payload needs transformed data

### Component Usage

- Pass all required props
- Handle all callbacks properly
- Provide sensible defaults
- Log important state changes

### API Design

- Support pagination with `pageNo` and `pageSize`
- Include `level` parameter for filtering
- Return consistent response format
- Provide helpful error messages

### UX

- Show loading states
- Provide clear feedback via toasts
- Auto-select defaults when appropriate
- Use consistent styling and colors
- Disable buttons when in invalid states

---

## Dynamicity & Backward Compatibility

### All Features Are Dynamic

- ✅ Configurations loaded from JSON
- ✅ Column counts vary per config
- ✅ Field types determined by config
- ✅ Search parameters dynamic
- ✅ Extract fields optional (graceful fallback)
- ✅ Pagination optional (works with any data size)
- ✅ Modal features optional (graceful when missing)

### Backward Compatibility

- Old configs without `extractFields` work fine
- Old configs without `searchParams` use `searchParam`
- Old configs without pagination still work
- All new features are opt-in

---

## Troubleshooting

### Search Not Working

1. Verify `searchActionUrl` is correct
2. Ensure `searchParams` or `searchParam` configured
3. Check API supports expected parameters
4. Review browser network tab for actual request

### Pagination Not Showing

- Only shows if `totalElements > pageSize`
- Check if API returns pagination metadata
- Verify `pageNo` and `pageSize` params in API call

### Display Order Not Saving

- Ensure `includeDisplayOrder: true` in config
- Check display order values in payload
- Verify API expects `displayOrder` field

### Modal Not Showing Added Items

- Confirm `modalOptionLabelKey` matches API response field
- Check all original item data is preserved
- Verify `addedItems` state includes the item

---

## File References

| File                                   | Purpose                        | Lines |
| -------------------------------------- | ------------------------------ | ----- |
| `src/components/DualSectionView.tsx`   | Dual-section mapping form      | 760   |
| `src/components/DropdownTableView.tsx` | Dropdown + table + search      | 400   |
| `src/components/TabsViewer.tsx`        | Tab-based view                 | -     |
| `src/pages/DynamicContent.tsx`         | Main container                 | 2868  |
| `examgrade.json`                       | Exam-grade-stream config       | 74    |
| `ztest.json`                           | All mappings config            | 460   |
| `src/index.css`                        | Global styles + scrollbar-hide | 150   |

---

**Last Updated**: January 7, 2026
**Status**: ✅ Production Ready
**Dynamic**: ✅ Fully Dynamic & Backward Compatible
