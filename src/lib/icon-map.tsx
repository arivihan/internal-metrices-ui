// import {
//   BookOpen,
//   Bot,
//   GraduationCap,
//   LayoutDashboard,
//   Settings,
//   Users,
//   FileText,
//   FileCheck,
//   BarChart,
//   Calendar,
//   MessageSquare,
//   Gift,
//   Bell,
//   Folder,
//   Home,
//   type LucideIcon,
// } from "lucide-react"

// const iconMap: Record<string, LucideIcon> = {
//   // Dashboard & Home
//   LayoutDashboard,
//   Home,
//   Dashboard: LayoutDashboard,

//   // Content
//   BookOpen,
//   Lecture: BookOpen,
//   LectureIcon: BookOpen,
//   GraduationCap,
//   Course: GraduationCap, 

//   Gift :Gift,

//   // Users & Team
//   Users,
//   User: Users,
//   Bot,

//   // Files & Documents
//   FileText,
//   FileCheck,
//   Document: FileText,
//   Folder,

//   // Analytics
//   BarChart,
//   Analytics: BarChart,
//   Chart: BarChart,

//   // Communication
//   MessageSquare,
//   Message: MessageSquare,
//   Bell,
//   Notification: Bell,

//   // Time
//   Calendar,

//   // Settings
//   Settings,
//   Setting: Settings,
// }

// export const getIcon = (iconName?: string): LucideIcon | undefined => {
//   if (!iconName) return undefined
//   return iconMap[iconName]
// }

// export default iconMap

import * as Icons from "lucide-react";
import type { LucideProps, LucideIcon } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name?: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  if (!name) return null;

  const Icon = (Icons as any)[name] as LucideIcon | undefined;

  if (!Icon) return null; // or fallback icon

  return <Icon {...props} />;
}

export const getIcon = (iconName?: string): LucideIcon | undefined => {
  if (!iconName) return undefined;
  return (Icons as any)[iconName] as LucideIcon | undefined;
};
