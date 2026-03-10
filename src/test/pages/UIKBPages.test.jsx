/**
 * UI KB page tests — verifies every refactored page:
 *   - Renders its heading (no crash)
 *   - Critical interactive elements use AppButton (have .app-button class)
 *   - Search inputs are accessible (label → input association)
 *   - Copy button is present and named correctly
 */
import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRouter } from "../renderWithRouter";

import BasePeriodPage from "../../pages/BasePeriodPage";
import WeeklyPayablePage from "../../pages/WeeklyPayablePage";
import MonetaryEligibilityPage from "../../pages/MonetaryEligibilityPage";
import TrendsTipsPage from "../../pages/TrendsTipsPage";
import DocumentSearchPage from "../../pages/DocumentSearchPage";
import TermsGlossaryPage from "../../pages/TermsGlossaryPage";
import AgentResponseCardsPage from "../../pages/AgentResponseCardsPage";
import QuickReferencePage from "../../pages/QuickReferencePage";
import LinksPage from "../../pages/LinksPage";
import ClaimantResourcesPage from "../../pages/ClaimantResourcesPage";

// ─── BasePeriodPage ──────────────────────────────────────────────────────────
describe("BasePeriodPage", () => {
  it("renders without crashing", () => {
    const { container } = renderWithRouter(<BasePeriodPage />);
    // Use level:2 to avoid matching sub-headings like "Base period (4 quarters)"
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /base period calculator/i,
      }),
    ).toBeInTheDocument();
  });

  it("has a date input", () => {
    const { container } = renderWithRouter(<BasePeriodPage />);
    expect(container.querySelector('input[type="date"]')).toBeTruthy();
  });

  it("Copy summary button uses AppButton (.app-button class)", () => {
    renderWithRouter(<BasePeriodPage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });
});

// ─── WeeklyPayablePage ───────────────────────────────────────────────────────
describe("WeeklyPayablePage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<WeeklyPayablePage />);
    expect(
      screen.getByRole("heading", { name: /weekly payable/i }),
    ).toBeInTheDocument();
  });

  it("has WBA and earnings inputs", () => {
    renderWithRouter(<WeeklyPayablePage />);
    const inputs = document.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("shows payable result when inputs are valid", () => {
    renderWithRouter(<WeeklyPayablePage />);
    // Default state: WBA=320, earnings=0 → payable = 320
    expect(screen.getByText(/estimated payable/i)).toBeInTheDocument();
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<WeeklyPayablePage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });
});

// ─── MonetaryEligibilityPage ─────────────────────────────────────────────────
describe("MonetaryEligibilityPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<MonetaryEligibilityPage />);
    expect(
      screen.getByRole("heading", { name: /monetary eligibility/i }),
    ).toBeInTheDocument();
  });

  it("has wage number inputs", () => {
    const { container } = renderWithRouter(<MonetaryEligibilityPage />);
    // Expects Q1-Q4 wage inputs plus minWage
    const numInputs = container.querySelectorAll('input[type="number"]');
    expect(numInputs.length).toBeGreaterThanOrEqual(5);
  });

  it("Copy button only renders when result is valid (not shown on initial load)", () => {
    renderWithRouter(<MonetaryEligibilityPage />);
    // CopyButton is conditionally rendered only after valid data is entered
    expect(screen.queryByRole("button", { name: /copy summary/i })).toBeNull();
  });
});

// ─── TrendsTipsPage ──────────────────────────────────────────────────────────
describe("TrendsTipsPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<TrendsTipsPage />);
    expect(
      screen.getByRole("heading", { name: /trends/i }),
    ).toBeInTheDocument();
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<TrendsTipsPage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });

  it("shows active items count pill", () => {
    const { container } = renderWithRouter(<TrendsTipsPage />);
    // The pill span contains "N active items"; avoid matching the empty-state paragraph
    const pills = container.querySelectorAll("span.pill");
    const activeItemsPill = Array.from(pills).find((p) =>
      /active items/i.test(p.textContent),
    );
    expect(activeItemsPill).toBeTruthy();
  });
});

// ─── DocumentSearchPage ──────────────────────────────────────────────────────
describe("DocumentSearchPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<DocumentSearchPage />);
    expect(
      screen.getByRole("heading", { name: /document search/i }),
    ).toBeInTheDocument();
  });

  it("search input is labeled (AppSearchBar)", () => {
    renderWithRouter(<DocumentSearchPage />);
    expect(
      screen.getByRole("textbox", { name: /document number/i }),
    ).toBeInTheDocument();
  });

  it("search input is type=text", () => {
    renderWithRouter(<DocumentSearchPage />);
    expect(
      screen.getByRole("textbox", { name: /document number/i }),
    ).toHaveAttribute("type", "text");
  });

  it("filtering the search changes match count", () => {
    renderWithRouter(<DocumentSearchPage />);
    const input = screen.getByRole("textbox", { name: /document number/i });
    const allCount = Number(
      screen.getByText(/\d+ matches/).textContent.match(/\d+/)[0],
    );
    fireEvent.change(input, { target: { value: "UIB-XXXNONEXISTENT" } });
    expect(screen.getByText(/0 matches/i)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "" } });
    expect(
      screen.getByText(new RegExp(`${allCount} matches`)),
    ).toBeInTheDocument();
  });

  it("'Search AZDES' action link uses AppButton (.app-button)", () => {
    renderWithRouter(<DocumentSearchPage />);
    const link = screen.getByRole("link", { name: /search azdes/i });
    expect(link).toHaveClass("app-button");
  });

  it("'Open Documents Center' link uses AppButton", () => {
    renderWithRouter(<DocumentSearchPage />);
    const link = screen.getByRole("link", { name: /open documents center/i });
    expect(link).toHaveClass("app-button");
    expect(link).toHaveClass("button-secondary");
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<DocumentSearchPage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
  });

  it("per-result 'Open source' links use AppButton", () => {
    renderWithRouter(<DocumentSearchPage />);
    const openLinks = screen.getAllByRole("link", { name: /open source/i });
    openLinks.forEach((link) => expect(link).toHaveClass("app-button"));
  });
});

// ─── TermsGlossaryPage ────────────────────────────────────────────────────────
describe("TermsGlossaryPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<TermsGlossaryPage />);
    expect(screen.getByRole("heading", { name: /terms/i })).toBeInTheDocument();
  });

  it("search input is labeled (AppSearchBar)", () => {
    renderWithRouter(<TermsGlossaryPage />);
    expect(
      screen.getByRole("textbox", { name: /search terms/i }),
    ).toBeInTheDocument();
  });

  it("filtering narrows results", () => {
    const { container } = renderWithRouter(<TermsGlossaryPage />);
    const input = screen.getByRole("textbox", { name: /search terms/i });
    fireEvent.change(input, { target: { value: "ZZZNOMATCH99" } });
    // Table body should have no rows when nothing matches
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(0);
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<TermsGlossaryPage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
  });
});

// ─── AgentResponseCardsPage ──────────────────────────────────────────────────
describe("AgentResponseCardsPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<AgentResponseCardsPage />);
    expect(
      screen.getByRole("heading", { name: /agent response/i }),
    ).toBeInTheDocument();
  });

  it("search input is labeled (AppSearchBar)", () => {
    renderWithRouter(<AgentResponseCardsPage />);
    expect(
      screen.getByRole("textbox", { name: /search response cards/i }),
    ).toBeInTheDocument();
  });

  it("filtering returns no results for nonsense query", () => {
    renderWithRouter(<AgentResponseCardsPage />);
    const input = screen.getByRole("textbox", {
      name: /search response cards/i,
    });
    fireEvent.change(input, { target: { value: "ZZZNOMATCH" } });
    expect(screen.queryAllByRole("article").length).toBe(0);
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<AgentResponseCardsPage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
  });
});

// ─── QuickReferencePage ───────────────────────────────────────────────────────
describe("QuickReferencePage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<QuickReferencePage />);
    expect(
      screen.getByRole("heading", { name: /quick reference/i }),
    ).toBeInTheDocument();
  });

  it("'Print view' button uses AppButton", () => {
    renderWithRouter(<QuickReferencePage />);
    const btn = screen.getByRole("button", { name: /print view/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).not.toHaveClass("button-secondary");
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<QuickReferencePage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });
});

// ─── LinksPage ────────────────────────────────────────────────────────────────
describe("LinksPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<LinksPage />);
    expect(
      screen.getByRole("heading", { name: /quick links/i }),
    ).toBeInTheDocument();
  });

  it("'Add link' button uses AppButton", () => {
    renderWithRouter(<LinksPage />);
    const btn = screen.getByRole("button", { name: /add link/i });
    expect(btn).toHaveClass("app-button");
  });

  it("'Reset defaults' button uses AppButton", () => {
    renderWithRouter(<LinksPage />);
    const btn = screen.getByRole("button", { name: /reset defaults/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });

  it("Open links use AppButton (.app-button class)", () => {
    renderWithRouter(<LinksPage />);
    const openLinks = screen.getAllByRole("link", { name: /^open$/i });
    openLinks.forEach((link) => expect(link).toHaveClass("app-button"));
  });

  it("Remove buttons use AppButton", () => {
    renderWithRouter(<LinksPage />);
    const removeBtns = screen.getAllByRole("button", { name: /remove/i });
    removeBtns.forEach((btn) => expect(btn).toHaveClass("app-button"));
  });

  it("clicking Add link with a name shows it in the list", () => {
    renderWithRouter(<LinksPage />);
    // Labels are "Link name" and "URL"
    fireEvent.change(screen.getByLabelText(/link name/i), {
      target: { value: "My Test Link" },
    });
    fireEvent.change(screen.getByLabelText(/^url$/i), {
      target: { value: "https://example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add link/i }));
    expect(screen.getByText("My Test Link")).toBeInTheDocument();
  });
});

// ─── ClaimantResourcesPage ────────────────────────────────────────────────────
describe("ClaimantResourcesPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<ClaimantResourcesPage />);
    // Page title comes from claimantResourcesContent.title
    expect(document.querySelector("h1, h2")).toBeInTheDocument();
  });

  it("'Copy share links' button uses AppButton", () => {
    renderWithRouter(<ClaimantResourcesPage />);
    const btn = screen.getByRole("button", { name: /copy share links/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });
});
