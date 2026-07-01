import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "../components/Navbar";
import AdminSidebar from "../admin/AdminSidebar";
import AdminBreadcrumb from "./AdminBreadcrumb";

const TOAST_OPTIONS = {
  duration: 4000,
  style: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    letterSpacing: "0.05em",
    borderRadius: "0px",
    boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.15)",
    padding: "10px 16px",
  },
};

interface AdminLayoutProps {
  section: string;
  breadcrumbLabel: string;
  children: ReactNode;
  showToaster?: boolean;
  onNavigate: (id: string) => void;
  isProMode: boolean;
  onToggleProMode: (val: boolean) => void;
  lastFrontend: string;
}

/** Layout réutilisable pour toutes les pages d'administration.
 * Wrapper AdminSidebar + Navbar + AdminBreadcrumb + contenu + Toaster. */
export default function AdminLayout({
  section,
  breadcrumbLabel,
  children,
  showToaster = true,
  onNavigate,
  isProMode,
  onToggleProMode,
  lastFrontend,
}: AdminLayoutProps) {
  return (
    <>
      <div className="bg-brand-light text-brand-dark min-h-screen font-sans flex border-l-2 border-brand-rust/20">
        <AdminSidebar onNavigate={onNavigate} lastFrontend={lastFrontend} />
        <div className="flex-1 min-w-0">
          <Navbar
            activeSection={section}
            onNavigate={onNavigate}
            isProMode={isProMode}
            onToggleProMode={onToggleProMode}
            solid
          />
          <div className="pt-20">
            <AdminBreadcrumb items={[{ label: breadcrumbLabel }]} />
            {children}
          </div>
        </div>
      </div>
      {showToaster && <Toaster position="top-center" toastOptions={TOAST_OPTIONS} />}
    </>
  );
}
