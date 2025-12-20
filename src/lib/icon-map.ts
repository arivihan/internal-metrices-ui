import {
  BookOpen,
  Bot,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  FileCheck,
  BarChart,
  Calendar,
  MessageSquare,
  Bell,
  Folder,
  Home,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  // Dashboard & Home
  LayoutDashboard,
  Home,
  Dashboard: LayoutDashboard,

  // Content
  BookOpen,
  Lecture: BookOpen,
  LectureIcon: BookOpen,
  GraduationCap,
  Course: GraduationCap,

  // Users & Team
  Users,
  User: Users,
  Bot,

  // Files & Documents
  FileText,
  FileCheck,
  Document: FileText,
  Folder,

  // Analytics
  BarChart,
  Analytics: BarChart,
  Chart: BarChart,

  // Communication
  MessageSquare,
  Message: MessageSquare,
  Bell,
  Notification: Bell,

  // Time
  Calendar,

  // Settings
  Settings,
  Setting: Settings,
}

export const getIcon = (iconName?: string): LucideIcon | undefined => {
  if (!iconName) return undefined
  return iconMap[iconName]
}

export default iconMap
