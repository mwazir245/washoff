import type { ReactNode } from "react";
import AdminSidebarNavigation from "@/features/admin/components/AdminSidebarNavigation";
import { DashboardLayout } from "@/shared/layout/DashboardLayout";

interface AdminWorkspaceLayoutProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const AdminWorkspaceLayout = ({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
}: AdminWorkspaceLayoutProps) => {
  return (
    <DashboardLayout title={title} subtitle={subtitle} eyebrow={eyebrow} actions={actions}>
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-start">
        <AdminSidebarNavigation />
        <div className="min-w-0 space-y-10">{children}</div>
      </div>
    </DashboardLayout>
  );
};

export default AdminWorkspaceLayout;
