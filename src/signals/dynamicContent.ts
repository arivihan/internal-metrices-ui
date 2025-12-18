import { signal } from '@preact/signals-react'
import type { DrawerItem, SubMenuItem, Button } from '@/types/sidebar'

// Dynamic content states
export const currentContentItem = signal<DrawerItem | SubMenuItem | null>(null)
export const popupOpen = signal<boolean>(false)
export const currentPopupButton = signal<Button | null>(null)

// Open popup
export const openPopup = (button: Button) => {
  currentPopupButton.value = button
  popupOpen.value = true
}

// Close popup
export const closePopup = () => {
  popupOpen.value = false
  currentPopupButton.value = null
}

// Set current content item
export const setCurrentContentItem = (item: DrawerItem | SubMenuItem | null) => {
  currentContentItem.value = item
}
