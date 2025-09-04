import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  FileText,
  GitCompare,
  Calendar,
  Users,
} from "lucide-react";

const navigationItems = [
  {
    title: "Assignment Board",
    href: "/",
    icon: LayoutGrid,
  },
  {
    title: "Policies", 
    href: "/policies",
    icon: FileText,
  },
  {
    title: "Compare",
    href: "/compare", 
    icon: GitCompare,
  },
  {
    title: "Renewals",
    href: "/renewals",
    icon: Calendar,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
  },
];

export function Sidebar() {
  return (
    <div className="flex w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-6">
        <span className="text-sm font-medium text-muted-foreground">Navigation</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}