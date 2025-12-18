import { signal } from '@preact/signals-react'

// Form popup state
export const formPopupData = signal<Record<string, any>>({})

// Update form field
export const updateFormField = (fieldName: string, value: any) => {
  formPopupData.value = {
    ...formPopupData.value,
    [fieldName]: value,
  }
}

// Reset form
export const resetForm = () => {
  formPopupData.value = {}
}

// Get form data
export const getFormData = () => formPopupData.value
