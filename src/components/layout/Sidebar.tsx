import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building,
  Shield,
  Grid3X3,
  Calendar,
  AlertTriangle,
  Users,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Properties",
    href: "/properties",
    icon: Building,
  },
  {
    title: "Policies",
    href: "/policies",
    icon: Shield,
  },
  {
    title: "Coverage Matrix",
    href: "/coverage-matrix",
    icon: Grid3X3,
  },
  {
    title: "Renewals",
    href: "/renewals",
    icon: Calendar,
  },
  {
    title: "Claims",
    href: "/claims",
    icon: AlertTriangle,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Toggle Button */}
      <div className="flex h-16 items-center justify-end px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                  collapsed ? "justify-center" : "gap-3"
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  {content}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.title}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return content;
        })}
      </nav>
    </div>
  );
}