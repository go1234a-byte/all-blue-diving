import { KpiCardGrid } from "@/components/admin/dashboard/KpiCardGrid";
import { RecentBookingsTable } from "@/components/admin/dashboard/RecentBookingsTable";
import { PenaltyWarningPanel } from "@/components/admin/dashboard/PenaltyWarningPanel";
import { CenterApprovalPanel } from "@/components/admin/dashboard/CenterApprovalPanel";
import { InstructorVerificationPanel } from "@/components/admin/dashboard/InstructorVerificationPanel";
import { RecentActivityFeed } from "@/components/admin/dashboard/RecentActivityFeed";
import { PendingInquiriesPanel } from "@/components/admin/dashboard/PendingInquiriesPanel";
import { RecentReportsPanel } from "@/components/admin/dashboard/RecentReportsPanel";
import { SystemStatusGrid } from "@/components/admin/dashboard/SystemStatusGrid";
import { OperationalHighlightsPanel } from "@/components/admin/dashboard/OperationalHighlightsPanel";

const AdminDashboardPage = () => {
  return (
    <div className="space-y-6">
      <KpiCardGrid />

      <RecentBookingsTable />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PenaltyWarningPanel />
        <CenterApprovalPanel />
        <InstructorVerificationPanel />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RecentActivityFeed />
        <PendingInquiriesPanel />
        <RecentReportsPanel />
      </div>

      <SystemStatusGrid />

      <OperationalHighlightsPanel />
    </div>
  );
};

export default AdminDashboardPage;
