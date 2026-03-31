import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "@/features/landing/pages/LandingPage";

const mockUseCurrentAccountSession = vi.fn();
const mockUseLogoutMutation = vi.fn();

const motionComponent = ({
  children,
  initial: _initial,
  whileInView: _whileInView,
  viewport: _viewport,
  transition: _transition,
  ...props
}: Record<string, unknown> & { children?: unknown }) => <div {...props}>{children}</div>;

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: () => motionComponent,
    },
  ),
}));

vi.mock("@/features/auth/hooks/useAccountAuth", () => ({
  resolveAccountHomeRoute: (role: string) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "provider":
        return "/provider";
      default:
        return "/hotel";
    }
  },
  useCurrentAccountSession: () => mockUseCurrentAccountSession(),
  useLogoutMutation: () => mockUseLogoutMutation(),
}));

vi.mock("@/features/content/hooks/usePlatformContent", () => ({
  usePlatformPageContent: () => ({
    getText: (section: string, key: string, fallback: string) => {
      const contentMap: Record<string, string> = {
        "header:login_button": "تسجيل الدخول",
        "header:primary_button": "سجل فندقك الآن",
      };

      return contentMap[`${section}:${key}`] ?? fallback;
    },
  }),
}));

vi.mock("@/features/content/hooks/usePlatformLanguage", () => ({
  usePlatformLanguage: () => ({ language: "ar" }),
}));

vi.mock("@/features/content/components/PlatformLanguageToggle", () => ({
  PlatformLanguageToggle: () => <div data-testid="language-toggle" />,
}));

vi.mock("@/shared/layout/AppShell", () => ({
  AppShell: ({ children }: { children: unknown }) => <div>{children}</div>,
}));

describe("LandingPage", () => {
  beforeEach(() => {
    mockUseLogoutMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("shows authenticated account actions instead of anonymous login actions on the home page", () => {
    mockUseCurrentAccountSession.mockReturnValue({
      isLoading: false,
      data: {
        account: {
          role: "hotel",
          fullName: "فندق QA",
        },
        session: {},
      },
    });

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const header = screen.getByRole("banner");

    expect(screen.getAllByText("فندق QA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("تسجيل الخروج").length).toBeGreaterThan(0);
    expect(within(header).queryByText("تسجيل الدخول")).not.toBeInTheDocument();
  });
});
