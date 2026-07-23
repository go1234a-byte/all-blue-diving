import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Search from "./pages/Search";
import TourDetail from "./pages/TourDetail";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";
import MyBookings from "./pages/MyBookings";
import Favorites from "./pages/Favorites";
import ChatList from "./pages/ChatList";
import ChatRoom from "./pages/ChatRoom";
import MyPage from "./pages/MyPage";
import InstructorConsole from "./pages/InstructorConsole";
import TourEditPage from "./pages/TourEditPage";
import InstructorPublicProfile from "./pages/InstructorPublicProfile";
import SupportChat from "./pages/SupportChat";
import InstructorArbitrationRoom from "./pages/InstructorArbitrationRoom";
import AdminArbitrationRoom from "./pages/AdminArbitrationRoom";
import { AdminLayout } from "./components/admin/layout/AdminLayout";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminToursPage from "./pages/admin/AdminToursPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminPayoutsPage from "./pages/admin/AdminPayoutsPage";
import AdminInstructorsPage from "./pages/admin/AdminInstructorsPage";
import AdminCentersPage from "./pages/admin/AdminCentersPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage";
import AdminSupportPage from "./pages/admin/AdminSupportPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminNoticesPage from "./pages/admin/AdminNoticesPage";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminManualPage from "./pages/admin/AdminManualPage";
import AdminMorePage from "./pages/admin/AdminMorePage";
import { RequireRole } from "./components/auth/RequireRole";
import { RootLayout } from "./components/layout/RootLayout";
import { MimoRootLayout } from "./components/mimo/layout/MimoRootLayout";
import MimoHome from "./pages/mimo/MimoHome";
import MimoSalonDetail from "./pages/mimo/MimoSalonDetail";
import MimoCheckout from "./pages/mimo/MimoCheckout";
import MimoSuccess from "./pages/mimo/MimoSuccess";
import MimoBookings from "./pages/mimo/MimoBookings";
import MimoFavorites from "./pages/mimo/MimoFavorites";
import MimoMyPage from "./pages/mimo/MimoMyPage";
import { GameRootLayout } from "./components/game/layout/GameRootLayout";
import GamePlay from "./pages/game/GamePlay";
import GameLeaderboard from "./pages/game/GameLeaderboard";
import GameShop from "./pages/game/GameShop";

export const routers = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, name: "home", element: <Index /> },
      { path: "auth", name: "auth", element: <Auth /> },
      { path: "reset-password", name: "reset-password", element: <ResetPassword /> },
      { path: "search", name: "search", element: <Search /> },
      { path: "tour/:tourId", name: "tour-detail", element: <TourDetail /> },
      { path: "checkout/:tourId", name: "checkout", element: <Checkout /> },
      { path: "payment/success", name: "payment-success", element: <PaymentSuccess /> },
      { path: "payment/fail", name: "payment-fail", element: <PaymentFail /> },
      { path: "my-bookings", name: "my-bookings", element: <MyBookings /> },
      { path: "favorites", name: "favorites", element: <Favorites /> },
      { path: "chat", name: "chat", element: <ChatList /> },
      { path: "chat/:tourId", name: "chat-tour", element: <ChatRoom /> },
      { path: "mypage", name: "mypage", element: <MyPage /> },
      {
        path: "instructor/:id/profile",
        name: "instructor-public-profile",
        element: <InstructorPublicProfile />,
      },
      {
        path: "instructor",
        element: <RequireRole allow={["instructor"]} />,
        children: [
          { index: true, name: "instructor-console", element: <InstructorConsole /> },
          { path: "tours/:tourId/edit", name: "instructor-tour-edit", element: <TourEditPage /> },
          { path: "arbitration", name: "instructor-arbitration", element: <InstructorArbitrationRoom /> },
        ],
      },
      {
        path: "admin",
        name: "admin",
        element: <RequireRole allow={["admin"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: "home", name: "admin-home", element: <AdminHomePage /> },
              { index: true, name: "admin-dashboard", element: <AdminDashboardPage /> },
              { path: "tours", name: "admin-tours", element: <AdminToursPage /> },
              { path: "bookings", name: "admin-bookings", element: <AdminBookingsPage /> },
              { path: "payouts", name: "admin-payouts", element: <AdminPayoutsPage /> },
              { path: "instructors", name: "admin-instructors", element: <AdminInstructorsPage /> },
              { path: "centers", name: "admin-centers", element: <AdminCentersPage /> },
              { path: "users", name: "admin-users", element: <AdminUsersPage /> },
              { path: "users/:id", name: "admin-user-detail", element: <AdminUserDetailPage /> },
              { path: "support", name: "admin-support", element: <AdminSupportPage /> },
              { path: "reports", name: "admin-reports", element: <AdminReportsPage /> },
              { path: "notifications", name: "admin-notifications", element: <AdminNotificationsPage /> },
              { path: "notices", name: "admin-notices", element: <AdminNoticesPage /> },
              { path: "coupons", name: "admin-coupons", element: <AdminCouponsPage /> },
              { path: "analytics", name: "admin-analytics", element: <AdminAnalyticsPage /> },
              { path: "settings", name: "admin-settings", element: <AdminSettingsPage /> },
              { path: "manual", name: "admin-manual", element: <AdminManualPage /> },
              { path: "more", name: "admin-more", element: <AdminMorePage /> },
            ],
          },
          { path: "arbitration/:instructorId", name: "admin-arbitration", element: <AdminArbitrationRoom /> },
        ],
      },
      { path: "support", name: "support-chat", element: <SupportChat /> },
      /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
      { path: "*", name: "404", element: <NotFound /> },
    ],
  },
  {
    path: "/mimo",
    element: <MimoRootLayout />,
    children: [
      { index: true, name: "mimo-home", element: <MimoHome /> },
      { path: "salon/:salonId", name: "mimo-salon-detail", element: <MimoSalonDetail /> },
      { path: "checkout/:salonId", name: "mimo-checkout", element: <MimoCheckout /> },
      { path: "success", name: "mimo-success", element: <MimoSuccess /> },
      { path: "bookings", name: "mimo-bookings", element: <MimoBookings /> },
      { path: "favorites", name: "mimo-favorites", element: <MimoFavorites /> },
      { path: "mypage", name: "mimo-mypage", element: <MimoMyPage /> },
    ],
  },
  {
    path: "/game",
    element: <GameRootLayout />,
    children: [
      { index: true, name: "game-play", element: <GamePlay /> },
      { path: "leaderboard", name: "game-leaderboard", element: <GameLeaderboard /> },
      { path: "shop", name: "game-shop", element: <GameShop /> },
    ],
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
