// src/lib/api.ts

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/** Base URL getter (debug / reuse) */
export const getBaseUrl = () => BASE_URL;

/**
 * Transforms form data based on field mapping configuration
 * Uses popupFields config to map form fields to API fields
 */
export const transformFormDataToPayload = (formData: any, popupFields: any[]) => {
  const payload: any = {
    id: formData.id || null,
    discountAmount: "",
  };

  console.log("🔍 Starting transformation...");
  console.log("📝 Form Data:", formData);
  console.log("⚙️ Popup Fields Config:", popupFields);

  popupFields.forEach((field) => {
    const value = formData[field.value];

    // Determine the API field name (this is the KEY in the output)
    const apiField = field.apiField || field.value;

    console.log(`\n🔄 Processing field: ${field.value}`);
    console.log(`   → Value: ${value}`);
    console.log(`   → API Field: ${apiField}`);
    console.log(`   → Field Config:`, field);

    // Skip if no value (but allow false for booleans)
    if (value === undefined || value === null || value === "") {
      if (field.booleanField) {
        payload[apiField] = false;
        console.log(`   ✅ Set ${apiField} = false (empty boolean field)`);
      } else {
        console.log(`   ⏭️ Skipping empty field`);
      }
      return;
    }

    // Handle boolean fields (status -> active)
    if (field.booleanField) {
      payload[apiField] = value === "active";
      console.log(`   ✅ Set ${apiField} = ${value === "active"} (boolean)`);
      return;
    }

    // Handle array fields
    if (field.isArray) {
      if (typeof value === "string") {
        payload[apiField] = value
          .split(",")
          .map((v: string) => v.trim())
          .filter(Boolean);
      } else if (Array.isArray(value)) {
        payload[apiField] = value;
      }
      console.log(
        `   ✅ Set ${apiField} = ${JSON.stringify(payload[apiField])} (array)`
      );
      return;
    }

    // Handle date formatting (YYYY-MM-DD -> DD/MM/YYYY)
    if (field.type === "date" || field.formatDate) {
      if (value.includes("-")) {
        const [year, month, day] = value.split("-");
        payload[apiField] = `${day}/${month}/${year}`;
      } else {
        payload[apiField] = value;
      }
      console.log(`   ✅ Set ${apiField} = ${payload[apiField]} (date)`);
      return;
    }

    // Handle number fields
    if (field.type === "number") {
      payload[apiField] = Number(value);
      console.log(`   ✅ Set ${apiField} = ${payload[apiField]} (number)`);
      return;
    }

    // Default: copy with mapped field name
    payload[apiField] = value;
    console.log(`   ✅ Set ${apiField} = ${value} (default)`);
  });

  console.log("\n✅ Final Payload:", payload);
  return payload;
};

/**
 * Common field transformers
 * Can be referenced in your layout config
 */
export const fieldTransformers = {
  // Date: yyyy-MM-dd → dd/MM/yyyy
  dateToAPI: (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },

  // String/comma-separated → Array
  toArray: (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value.includes(",")
        ? value.split(",").map((id) => id.trim()).filter(Boolean)
        : [value];
    }
    return [];
  },

  // "active"/"inactive" → boolean
  statusToBoolean: (status: string | boolean): boolean => {
    return status === "active" || status === true;
  },

  // Empty string → null
  emptyToNull: (value: any): any => {
    return value === "" ? null : value;
  },

  // Keep value or null
  orNull: (value: any): any => {
    return value || null;
  },
};

/** Internal fetch wrapper */
const request = async (method: "POST" | "PUT", url: string, payload: any) => {
  const finalUrl = `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;

  console.log(`🚀 ${method} Request:`, finalUrl);
  console.log("📦 Payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(finalUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  console.log(`📡 Response: ${res.status} ${res.statusText}`);

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Error Response:`, text);
    throw new Error(`${method} ${finalUrl} failed (${res.status}): ${text}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    console.log("✅ Success:", data);
    return data;
  }

  console.log("✅ Success (no content)");
  return null;
};

/** POST helper */
export const postData = (url: string, payload: any) =>
  request("POST", url, payload);

/** PUT helper */
export const putData = (url: string, payload: any) =>
  request("PUT", url, payload);