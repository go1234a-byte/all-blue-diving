import { load, page } from "./lib/lazyPage";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { RequireRole } from "./components/auth/RequireRole";
import { RootLayout } from "./components/layout/RootLayout";

const Auth = load(() => import("./pages/Auth"));
const ResetPassword = load(() => import("./pages/ResetPassword"));
const CompleteProfile = load(() => import("./pages/CompleteProfile"));
const NaverCallback = load(() => import("./pages/NaverCallback"));
const Search = load(() => import("./pages/Search"));
const TourDetail = load(() => import("./pages/TourDetail"));
const Checkout = load(() => import("./pages/Checkout"));
const PaymentSuccess = load(() => import("./pages/PaymentSuccess"));
const PaymentFail = load(() => import("./pages/PaymentFail"));
const MyBookings = load(() => import("./pages/MyBookings"));
const Favorites = load(() => import("./pages/Favorites"));
const ChatList = load(() => import("./pages/ChatList"));
const ChatRoom = load(() => import("./pages/ChatRoom"));
const MyPage = load(() => import("./pages/MyPage"));
const InstructorConsole = load(() => import("./pages/InstructorConsole"));
const TourEditPage = load(() => import("./pages/TourEditPage"));
const InstructorPublicProfile = load(() => import("./pages/InstructorPublicProfile"));
const SupportChat = load(() => import("./pages/SupportChat"));
const BusinessInquiryPage = load(() => import("./pages/BusinessInquiryPage"));
const TermsPage = load(() => import("./pages/TermsPage"));
const PrivacyPage = load(() => import("./pages/PrivacyPage"));
const DiveComputerPrivacyPage = load(() => import("./pages/DiveComputerPrivacyPage"));
const RefundPolicyPage = load(() => import("./pages/RefundPolicyPage"));
const InstructorArbitrationRoom = load(() => import("./pages/InstructorArbitrationRoom"));
const AdminArbitrationRoom = load(() => import("./pages/AdminArbitrationRoom"));
const InstructorAdminNotePage = load(() => import("./pages/InstructorAdminNotePage"));
const AdminInstructorNotePage = load(() => import("./pages/admin/AdminInstructorNotePage"));
const AdminLayout = load(() => import("./components/admin/layout/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminHomePage = load(() => import("./pages/admin/AdminHomePage"));
const AdminDashboardPage = load(() => import("./pages/admin/AdminDashboardPage"));
const AdminToursPage = load(() => import("./pages/admin/AdminToursPage"));
const AdminBookingsPage = load(() => import("./pages/admin/AdminBookingsPage"));
const AdminPayoutsPage = load(() => import("./pages/admin/AdminPayoutsPage"));
const AdminAccountingPage = load(() => import("./pages/admin/AdminAccountingPage"));
const AdminInstructorsPage = load(() => import("./pages/admin/AdminInstructorsPage"));
const AdminCentersPage = load(() => import("./pages/admin/AdminCentersPage"));
const AdminUsersPage = load(() => import("./pages/admin/AdminUsersPage"));
const AdminUserDetailPage = load(() => import("./pages/admin/AdminUserDetailPage"));
const AdminSupportPage = load(() => import("./pages/admin/AdminSupportPage"));
const AdminReportsPage = load(() => import("./pages/admin/AdminReportsPage"));
const AdminNotificationsPage = load(() => import("./pages/admin/AdminNotificationsPage"));
const AdminActivityPage = load(() => import("./pages/admin/AdminActivityPage"));
const AdminNoticesPage = load(() => import("./pages/admin/AdminNoticesPage"));
const AdminCouponsPage = load(() => import("./pages/admin/AdminCouponsPage"));
const AdminAnalyticsPage = load(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminSettingsPage = load(() => import("./pages/admin/AdminSettingsPage"));
const AdminManualPage = load(() => import("./pages/admin/AdminManualPage"));
const AdminMorePage = load(() => import("./pages/admin/AdminMorePage"));
const AdminQaChecklistPage = load(() => import("./pages/admin/AdminQaChecklistPage"));
const AdminTourCancellationClaimsPage = load(() => import("./pages/admin/AdminTourCancellationClaimsPage"));
const AdminBusinessInquiriesPage = load(() => import("./pages/admin/AdminBusinessInquiriesPage"));

export const routers = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, name: "home", element: <Home /> },
      { path: "auth", name: "auth", element: page(Auth) },
      { path: "reset-password", name: "reset-password", element: page(ResetPassword) },
      { path: "complete-profile", name: "complete-profile", element: page(CompleteProfile) },
      { path: "naver-callback", name: "naver-callback", element: page(NaverCallback) },
      { path: "search", name: "search", element: page(Search) },
      { path: "tour/:tourId", name: "tour-detail", element: page(TourDetail) },
      { path: "checkout/:tourId", name: "checkout", element: page(Checkout) },
      { path: "payment/success", name: "payment-success", element: page(PaymentSuccess) },
      { path: "payment/fail", name: "payment-fail", element: page(PaymentFail) },
      { path: "favorites", name: "favorites", element: page(Favorites) },
      {
        // 로그인(다이버/강사/관리자 무관, 게스트만 차단)이 필요한 개인화 페이지들을 한 번에 가드.
        element: <RequireRole allow={["public", "instructor", "admin"]} />,
        children: [
          { path: "my-bookings", name: "my-bookings", element: page(MyBookings) },
          { path: "chat", name: "chat", element: page(ChatList) },
          { path: "chat/:tourId", name: "chat-tour", element: page(ChatRoom) },
          { path: "mypage", name: "mypage", element: page(MyPage) },
          { path: "support", name: "support-chat", element: page(SupportChat) },
          { path: "business-inquiry", name: "business-inquiry", element: page(BusinessInquiryPage) },
        ],
      },
      {
        path: "instructor/:id/profile",
        name: "instructor-public-profile",
        element: page(InstructorPublicProfile),
      },
      {
        path: "instructor",
        element: <RequireRole allow={["instructor"]} />,
        children: [
          { index: true, name: "instructor-console", element: page(InstructorConsole) },
          { path: "tours/:tourId/edit", name: "instructor-tour-edit", element: page(TourEditPage) },
          { path: "arbitration", name: "instructor-arbitration", element: page(InstructorArbitrationRoom) },
          { path: "notes", name: "instructor-admin-notes", element: page(InstructorAdminNotePage) },
        ],
      },
      {
        path: "admin",
        name: "admin",
        element: <RequireRole allow={["admin"]} />,
        children: [
          {
            element: page(AdminLayout),
            children: [
              { path: "home", name: "admin-home", element: page(AdminHomePage) },
              { index: true, name: "admin-dashboard", element: page(AdminDashboardPage) },
              { path: "tours", name: "admin-tours", element: page(AdminToursPage) },
              { path: "bookings", name: "admin-bookings", element: page(AdminBookingsPage) },
              { path: "payouts", name: "admin-payouts", element: page(AdminPayoutsPage) },
              { path: "accounting", name: "admin-accounting", element: page(AdminAccountingPage) },
              { path: "instructors", name: "admin-instructors", element: page(AdminInstructorsPage) },
              { path: "centers", name: "admin-centers", element: page(AdminCentersPage) },
              { path: "users", name: "admin-users", element: page(AdminUsersPage) },
              { path: "users/:id", name: "admin-user-detail", element: page(AdminUserDetailPage) },
              { path: "support", name: "admin-support", element: page(AdminSupportPage) },
              { path: "business-inquiries", name: "admin-business-inquiries", element: page(AdminBusinessInquiriesPage) },
              { path: "reports", name: "admin-reports", element: page(AdminReportsPage) },
              { path: "notifications", name: "admin-notifications", element: page(AdminNotificationsPage) },
              { path: "activity", name: "admin-activity", element: page(AdminActivityPage) },
              { path: "notices", name: "admin-notices", element: page(AdminNoticesPage) },
              { path: "coupons", name: "admin-coupons", element: page(AdminCouponsPage) },
              { path: "analytics", name: "admin-analytics", element: page(AdminAnalyticsPage) },
              { path: "settings", name: "admin-settings", element: page(AdminSettingsPage) },
              { path: "manual", name: "admin-manual", element: page(AdminManualPage) },
              { path: "more", name: "admin-more", element: page(AdminMorePage) },
              { path: "qa-checklist", name: "admin-qa-checklist", element: page(AdminQaChecklistPage) },
              {
                path: "cancellation-claims",
                name: "admin-cancellation-claims",
                element: page(AdminTourCancellationClaimsPage),
              },
            ],
          },
          { path: "arbitration/:instructorId", name: "admin-arbitration", element: page(AdminArbitrationRoom) },
          { path: "instructors/:instructorId/notes", name: "admin-instructor-notes", element: page(AdminInstructorNotePage) },
        ],
      },
      { path: "terms", name: "terms", element: page(TermsPage) },
      { path: "privacy", name: "privacy", element: page(PrivacyPage) },
      { path: "divecomputer-privacy", name: "divecomputer-privacy", element: page(DiveComputerPrivacyPage) },
      { path: "refund-policy", name: "refund-policy", element: page(RefundPolicyPage) },
      /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
      { path: "*", name: "404", element: <NotFound /> },
    ],
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
