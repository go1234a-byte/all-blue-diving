#!/usr/bin/env python3
import pathlib
import sys

TARGET = pathlib.Path("src/components/admin/layout/AdminSidebar.tsx")

PATCHES = [
    (
        'import { NavLink } from "react-router-dom";\n'
        'import {\n'
        '  LayoutDashboard,\n'
        '  Compass,\n'
        '  CalendarCheck,\n'
        '  Wallet,\n'
        '  Users,\n'
        '  Building2,\n'
        '  UserRound,\n'
        '  MessageCircle,\n'
        '  Flag,\n'
        '  Bell,\n'
        '  Megaphone,\n'
        '  Ticket,\n'
        '  BarChart3,\n'
        '  Settings,\n'
        '  BookOpen,\n'
        '  ClipboardCheck,\n'
        '} from "lucide-react";\n'
        'import {\n'
        '  Sidebar,\n'
        '  SidebarContent,\n'
        '  SidebarGroup,\n'
        '  SidebarGroupContent,\n'
        '  SidebarHeader,\n'
        '  SidebarMenu,\n'
        '  SidebarMenuButton,\n'
        '  SidebarMenuItem,\n'
        '} from "@/components/ui/sidebar";\n'
        'import { Logo } from "@/components/brand/Logo";\n',
        'import { NavLink, useNavigate } from "react-router-dom";\n'
        'import {\n'
        '  LayoutDashboard,\n'
        '  Compass,\n'
        '  CalendarCheck,\n'
        '  Wallet,\n'
        '  Users,\n'
        '  Building2,\n'
        '  UserRound,\n'
        '  MessageCircle,\n'
        '  Flag,\n'
        '  Bell,\n'
        '  Megaphone,\n'
        '  Ticket,\n'
        '  BarChart3,\n'
        '  Settings,\n'
        '  BookOpen,\n'
        '  ClipboardCheck,\n'
        '  LogOut,\n'
        '} from "lucide-react";\n'
        'import {\n'
        '  Sidebar,\n'
        '  SidebarContent,\n'
        '  SidebarFooter,\n'
        '  SidebarGroup,\n'
        '  SidebarGroupContent,\n'
        '  SidebarHeader,\n'
        '  SidebarMenu,\n'
        '  SidebarMenuButton,\n'
        '  SidebarMenuItem,\n'
        '} from "@/components/ui/sidebar";\n'
        'import { Logo } from "@/components/brand/Logo";\n'
        'import { supabase } from "@/integrations/supabase/client";\n',
    ),
    (
        'export function AdminSidebar() {\n'
        '  return (\n'
        '    <Sidebar collapsible="icon">\n',
        'export function AdminSidebar() {\n'
        '  const navigate = useNavigate();\n'
        '\n'
        '  const handleSignOut = async () => {\n'
        '    await supabase.auth.signOut();\n'
        '    navigate("/", { replace: true });\n'
        '  };\n'
        '\n'
        '  return (\n'
        '    <Sidebar collapsible="icon">\n',
    ),
    (
        '      </SidebarContent>\n'
        '    </Sidebar>\n'
        '  );\n'
        '}\n',
        '      </SidebarContent>\n'
        '      <SidebarFooter>\n'
        '        <SidebarMenu>\n'
        '          <SidebarMenuItem>\n'
        '            <SidebarMenuButton onClick={handleSignOut}>\n'
        '              <LogOut />\n'
        '              <span>로그아웃</span>\n'
        '            </SidebarMenuButton>\n'
        '          </SidebarMenuItem>\n'
        '        </SidebarMenu>\n'
        '      </SidebarFooter>\n'
        '    </Sidebar>\n'
        '  );\n'
        '}\n',
    ),
]


def main():
    if not TARGET.exists():
        print(f"ERROR: {TARGET} not found. Run from repo root.")
        sys.exit(1)

    text = TARGET.read_text(encoding="utf-8")

    for i, (old, new) in enumerate(PATCHES, start=1):
        if old not in text:
            print(f"ERROR: patch {i}/{len(PATCHES)} target text not found.")
            print("File may already be modified. Check manually.")
            sys.exit(1)
        text = text.replace(old, new, 1)
        print(f"OK: patch {i}/{len(PATCHES)} applied")

    TARGET.write_text(text, encoding="utf-8")
    print(f"\nDone: logout button added to {TARGET}")


if __name__ == "__main__":
    main()
