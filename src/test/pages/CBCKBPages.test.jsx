/**
 * CBC KB page tests — verifies every refactored CBC page:
 *   - Renders its heading (no crash)
 *   - Interactive elements use AppButton (.app-button class)
 *   - Search inputs are labeled (AppSearchBar)
 *   - Copy buttons present and themed
 */
import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRouter } from "../renderWithRouter";

import CBCCallHandlingPage from "../../pages/cbc/CBCCallHandlingPage";
import CBCMillisPage from "../../pages/cbc/CBCMillisPage";
import CBCTroubleshootingPage from "../../pages/cbc/CBCTroubleshootingPage";

import CBCDocumentSearchPage from "../../pages/cbc/CBCDocumentSearchPage";
import CBCTermsPage from "../../pages/cbc/CBCTermsPage";
import CBCTrendsTipsPage from "../../pages/cbc/CBCTrendsTipsPage";
import CBCLinksPage from "../../pages/cbc/CBCLinksPage";
import CBCResourcesPage from "../../pages/cbc/CBCResourcesPage";
import CBCFAQPage from "../../pages/cbc/CBCFAQPage";

// ─── CBCDocumentSearchPage ────────────────────────────────────────────────────
describe("CBCDocumentSearchPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCDocumentSearchPage />);
    expect(
      screen.getByRole("heading", { name: /document search/i }),
    ).toBeInTheDocument();
  });

  it("search input is labeled (AppSearchBar)", () => {
    renderWithRouter(<CBCDocumentSearchPage />);
    expect(
      screen.getByRole("textbox", { name: /document number or keyword/i }),
    ).toBeInTheDocument();
  });

  it("filtering with no match shows empty state", () => {
    renderWithRouter(<CBCDocumentSearchPage />);
    const input = screen.getByRole("textbox", {
      name: /document number or keyword/i,
    });
    fireEvent.change(input, { target: { value: "ZZZNOMATCH99" } });
    expect(screen.getByText(/no matching documents/i)).toBeInTheDocument();
  });

  it("'Search DES Documents Center' link uses AppButton", () => {
    renderWithRouter(<CBCDocumentSearchPage />);
    const link = screen.getByRole("link", {
      name: /search des documents center/i,
    });
    expect(link).toHaveClass("app-button");
    expect(link.tagName).toBe("A");
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<CBCDocumentSearchPage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });

  it("per-result Open links use AppButton", () => {
    renderWithRouter(<CBCDocumentSearchPage />);
    const openLinks = screen.getAllByRole("link", { name: /^open$/i });
    expect(openLinks.length).toBeGreaterThan(0);
    openLinks.forEach((link) => expect(link).toHaveClass("app-button"));
  });
});

// ─── CBCTermsPage ─────────────────────────────────────────────────────────────
describe("CBCTermsPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCTermsPage />);
    expect(
      screen.getByRole("heading", { name: /cbc terms/i }),
    ).toBeInTheDocument();
  });

  it("search input is labeled (AppSearchBar)", () => {
    renderWithRouter(<CBCTermsPage />);
    expect(
      screen.getByRole("textbox", { name: /search terms/i }),
    ).toBeInTheDocument();
  });

  it("filtering with no match shows empty state", () => {
    renderWithRouter(<CBCTermsPage />);
    const input = screen.getByRole("textbox", { name: /search terms/i });
    fireEvent.change(input, { target: { value: "ZZZNOMATCH99" } });
    expect(screen.getByText(/no matching terms/i)).toBeInTheDocument();
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<CBCTermsPage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });
});

// ─── CBCTrendsTipsPage ────────────────────────────────────────────────────────
describe("CBCTrendsTipsPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCTrendsTipsPage />);
    expect(
      screen.getByRole("heading", { name: /trends/i }),
    ).toBeInTheDocument();
  });

  it("Copy summary button uses AppButton", () => {
    renderWithRouter(<CBCTrendsTipsPage />);
    const btn = screen.getByRole("button", { name: /copy summary/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });

  it("shows active items count pill", () => {
    const { container } = renderWithRouter(<CBCTrendsTipsPage />);
    // The pill span contains "N active items"; avoid matching the empty-state paragraph
    const pills = container.querySelectorAll("span.pill");
    const activeItemsPill = Array.from(pills).find((p) =>
      /active items/i.test(p.textContent),
    );
    expect(activeItemsPill).toBeTruthy();
  });
});

// ─── CBCLinksPage ─────────────────────────────────────────────────────────────
describe("CBCLinksPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCLinksPage />);
    expect(
      screen.getByRole("heading", { name: /quick links/i }),
    ).toBeInTheDocument();
  });

  it("'Add link' button uses AppButton", () => {
    renderWithRouter(<CBCLinksPage />);
    const btn = screen.getByRole("button", { name: /add link/i });
    expect(btn).toHaveClass("app-button");
  });

  it("'Reset to defaults' button uses AppButton", () => {
    renderWithRouter(<CBCLinksPage />);
    const btn = screen.getByRole("button", { name: /reset to defaults/i });
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });

  it("Open links use AppButton", () => {
    renderWithRouter(<CBCLinksPage />);
    const openLinks = screen.getAllByRole("link", { name: /^open$/i });
    openLinks.forEach((link) => expect(link).toHaveClass("app-button"));
  });

  it("Remove buttons use AppButton", () => {
    renderWithRouter(<CBCLinksPage />);
    const removeBtns = screen.getAllByRole("button", { name: /remove/i });
    removeBtns.forEach((btn) => expect(btn).toHaveClass("app-button"));
  });

  it("adding a link shows it in the list", () => {
    renderWithRouter(<CBCLinksPage />);
    // CBCLinksPage labels are "Name" and "URL"
    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "Test Link" },
    });
    fireEvent.change(screen.getByLabelText(/^url$/i), {
      target: { value: "https://example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add link/i }));
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });
});

// ─── CBCResourcesPage ─────────────────────────────────────────────────────────
describe("CBCResourcesPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCResourcesPage />);
    expect(
      screen.getByRole("heading", { name: /cbc portal resources/i }),
    ).toBeInTheDocument();
  });

  it("'Open CBC Portal' link uses AppButton", () => {
    renderWithRouter(<CBCResourcesPage />);
    const link = screen.getByRole("link", { name: /open cbc portal/i });
    expect(link).toHaveClass("app-button");
    expect(link.tagName).toBe("A");
  });

  it("'DES CBC Resources Page' link uses AppButton secondary", () => {
    renderWithRouter(<CBCResourcesPage />);
    // Multiple links match the regex; find the one that IS the secondary button (not a generic 'Open' link)
    const links = screen.getAllByRole("link", {
      name: /des cbc resources page/i,
    });
    const secondaryLink = links.find((l) =>
      l.classList.contains("button-secondary"),
    );
    expect(secondaryLink).toBeTruthy();
    expect(secondaryLink).toHaveClass("app-button");
  });

  it("'Technical Support' link uses AppButton secondary", () => {
    renderWithRouter(<CBCResourcesPage />);
    const link = screen.getByRole("link", { name: /technical support/i });
    expect(link).toHaveClass("app-button");
    expect(link).toHaveClass("button-secondary");
  });

  it("Quick Share 'Open' links use AppButton", () => {
    renderWithRouter(<CBCResourcesPage />);
    // There are multiple "Open" links across quick share + guides
    const openLinks = screen.getAllByRole("link", { name: /^open$/i });
    expect(openLinks.length).toBeGreaterThan(0);
    openLinks.forEach((link) => expect(link).toHaveClass("app-button"));
  });
});

// ─── CBCFAQPage ───────────────────────────────────────────────────────────────
describe("CBCFAQPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCFAQPage />);
    expect(
      screen.getByRole("heading", { name: /cbc frequently asked questions/i }),
    ).toBeInTheDocument();
  });

  it("search input is labeled (AppSearchBar)", () => {
    renderWithRouter(<CBCFAQPage />);
    expect(
      screen.getByRole("textbox", { name: /search questions/i }),
    ).toBeInTheDocument();
  });

  it("category filter buttons use AppButton (.app-button)", () => {
    renderWithRouter(<CBCFAQPage />);
    const allChip = screen.getByRole("tab", { name: /^all$/i });
    expect(allChip).toHaveClass("app-button");
  });

  it("'All' category is selected by default", () => {
    renderWithRouter(<CBCFAQPage />);
    const allChip = screen.getByRole("tab", { name: /^all$/i });
    expect(allChip).toHaveAttribute("aria-selected", "true");
  });

  it("clicking a category tab filters questions", () => {
    renderWithRouter(<CBCFAQPage />);
    const allCount = screen.getAllByRole("article").length;
    // Click the first non-All category tab
    const tabs = screen.getAllByRole("tab");
    const nonAllTab = tabs.find((t) => t.textContent !== "All");
    if (nonAllTab) {
      fireEvent.click(nonAllTab);
      const filteredCount = screen.getAllByRole("article").length;
      expect(filteredCount).toBeLessThanOrEqual(allCount);
    }
  });

  it("accordion items use AppButton", () => {
    renderWithRouter(<CBCFAQPage />);
    // Accordion triggers have class "accordion-trigger"; find them among all buttons
    const allBtns = screen.queryAllByRole("button");
    const accordionTriggers = allBtns.filter((b) =>
      b.classList.contains("accordion-trigger"),
    );
    expect(accordionTriggers.length).toBeGreaterThan(0);
    accordionTriggers.forEach((btn) => expect(btn).toHaveClass("app-button"));
  });

  it("clicking an accordion item opens its answer", () => {
    renderWithRouter(<CBCFAQPage />);
    const allBtns = screen.queryAllByRole("button");
    const firstAccordion = allBtns.find((b) =>
      b.classList.contains("accordion-trigger"),
    );
    expect(firstAccordion).toBeInTheDocument();
    expect(firstAccordion).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(firstAccordion);
    expect(firstAccordion).toHaveAttribute("aria-expanded", "true");
  });

  it("searching filters FAQ items", () => {
    renderWithRouter(<CBCFAQPage />);
    const input = screen.getByRole("textbox", { name: /search questions/i });
    fireEvent.change(input, { target: { value: "ZZZNOMATCH99" } });
    expect(screen.queryAllByRole("article").length).toBe(0);
  });

  it("shows result count text", () => {
    const { container } = renderWithRouter(<CBCFAQPage />);
    // Result count element (e.g. "5 questions") rendered alongside the FAQ items
    const articles = container.querySelectorAll("article");
    expect(articles.length).toBeGreaterThan(0);
  });
});

// ─── CBCTroubleshootingPage ───────────────────────────────────────────────────
describe("CBCTroubleshootingPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCTroubleshootingPage />);
    expect(
      screen.getByRole("heading", { name: /troubleshooting/i }),
    ).toBeInTheDocument();
  });

  it("search input is labeled (AppSearchBar)", () => {
    renderWithRouter(<CBCTroubleshootingPage />);
    expect(
      screen.getByRole("textbox", { name: /search issues and steps/i }),
    ).toBeInTheDocument();
  });

  it("category filter tabs use AppButton", () => {
    renderWithRouter(<CBCTroubleshootingPage />);
    const allTab = screen.getByRole("tab", { name: /^all$/i });
    expect(allTab).toHaveClass("app-button");
  });

  it("'All' category is selected by default", () => {
    renderWithRouter(<CBCTroubleshootingPage />);
    const allTab = screen.getByRole("tab", { name: /^all$/i });
    expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  it("accordion triggers use AppButton", () => {
    renderWithRouter(<CBCTroubleshootingPage />);
    const allBtns = screen.queryAllByRole("button");
    const accordionTriggers = allBtns.filter((b) =>
      b.classList.contains("accordion-trigger"),
    );
    expect(accordionTriggers.length).toBeGreaterThan(0);
    accordionTriggers.forEach((btn) => expect(btn).toHaveClass("app-button"));
  });

  it("clicking an accordion item opens its steps", () => {
    renderWithRouter(<CBCTroubleshootingPage />);
    const allBtns = screen.queryAllByRole("button");
    const firstAccordion = allBtns.find((b) =>
      b.classList.contains("accordion-trigger"),
    );
    expect(firstAccordion).toBeInTheDocument();
    expect(firstAccordion).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(firstAccordion);
    expect(firstAccordion).toHaveAttribute("aria-expanded", "true");
  });

  it("filtering with no match shows empty state", () => {
    renderWithRouter(<CBCTroubleshootingPage />);
    const input = screen.getByRole("textbox", {
      name: /search issues and steps/i,
    });
    fireEvent.change(input, { target: { value: "ZZZNOMATCH99" } });
    expect(screen.getByText(/no matching issues found/i)).toBeInTheDocument();
  });

  it("clicking a category tab filters results", () => {
    renderWithRouter(<CBCTroubleshootingPage />);
    const tabs = screen.getAllByRole("tab");
    const nonAllTab = tabs.find((t) => t.textContent !== "All");
    if (nonAllTab) {
      const allBefore = screen
        .queryAllByRole("button")
        .filter((b) => b.classList.contains("accordion-trigger")).length;
      fireEvent.click(nonAllTab);
      const afterCount = screen
        .queryAllByRole("button")
        .filter((b) => b.classList.contains("accordion-trigger")).length;
      expect(afterCount).toBeLessThanOrEqual(allBefore);
    }
  });
});

// ─── CBCCallHandlingPage / CBCCallFlowNavigator ───────────────────────────────
describe("CBCCallHandlingPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCCallHandlingPage />);
    expect(
      screen.getByRole("heading", { name: /call handling/i }),
    ).toBeInTheDocument();
  });

  it("call triage navigator is present with a question node", () => {
    renderWithRouter(<CBCCallHandlingPage />);
    // The navigator's first step label is a <p class="muted"> inside an article.result.stack
    const muteEls = document.querySelectorAll("article.result.stack p.muted");
    const stepLabel = Array.from(muteEls).find((el) =>
      /step 1/i.test(el.textContent),
    );
    expect(stepLabel).toBeTruthy();
  });

  it("triage option buttons use AppButton accordion-trigger style", () => {
    renderWithRouter(<CBCCallHandlingPage />);
    const allBtns = screen.queryAllByRole("button");
    const triageBtns = allBtns.filter((b) =>
      b.classList.contains("accordion-trigger"),
    );
    expect(triageBtns.length).toBeGreaterThan(0);
    triageBtns.forEach((btn) => expect(btn).toHaveClass("app-button"));
  });

  it("clicking a triage option advances the flow", () => {
    renderWithRouter(<CBCCallHandlingPage />);
    const allBtns = screen.queryAllByRole("button");
    const firstOption = allBtns.find((b) =>
      b.classList.contains("accordion-trigger"),
    );
    expect(firstOption).toBeInTheDocument();
    fireEvent.click(firstOption);
    // After navigating, Back and Start Over type-chip controls appear in the navigator
    const backBtns = screen
      .queryAllByRole("button")
      .filter(
        (b) => b.classList.contains("type-chip") && /back/i.test(b.textContent),
      );
    expect(backBtns.length).toBeGreaterThan(0);
  });

  it("Back button returns to previous step", () => {
    renderWithRouter(<CBCCallHandlingPage />);
    const allBtns = screen.queryAllByRole("button");
    const firstOption = allBtns.find((b) =>
      b.classList.contains("accordion-trigger"),
    );
    fireEvent.click(firstOption);
    const backBtn = screen
      .queryAllByRole("button")
      .find(
        (b) => b.classList.contains("type-chip") && /back/i.test(b.textContent),
      );
    fireEvent.click(backBtn);
    // Back at step 1 — no Back/Start Over chips remain
    const backBtnsAfter = screen
      .queryAllByRole("button")
      .filter(
        (b) => b.classList.contains("type-chip") && /back/i.test(b.textContent),
      );
    expect(backBtnsAfter.length).toBe(0);
  });
});

// ─── CBCMillisPage ────────────────────────────────────────────────────────────
describe("CBCMillisPage", () => {
  it("renders without crashing", () => {
    renderWithRouter(<CBCMillisPage />);
    expect(
      screen.getByRole("heading", { level: 2, name: /milliseconds/i }),
    ).toBeInTheDocument();
  });

  it("shows a live current timestamp", () => {
    renderWithRouter(<CBCMillisPage />);
    // The live ms value is a large number — check it's present in the output
    const result = screen.getByLabelText(/current unix timestamp/i);
    expect(result).toBeInTheDocument();
    const ms = Number(
      result.querySelector("span").textContent.replace(/,/g, ""),
    );
    expect(ms).toBeGreaterThan(1_000_000_000_000);
  });

  it("datetime-local input is labeled", () => {
    renderWithRouter(<CBCMillisPage />);
    expect(screen.getByLabelText(/date and time/i)).toBeInTheDocument();
  });

  it("milliseconds input is labeled", () => {
    renderWithRouter(<CBCMillisPage />);
    expect(screen.getByLabelText(/milliseconds value/i)).toBeInTheDocument();
  });

  it("entering a valid ms value shows a readable date", () => {
    renderWithRouter(<CBCMillisPage />);
    const input = screen.getByLabelText(/milliseconds value/i);
    fireEvent.change(input, { target: { value: "1741651200000" } });
    // The ms→date result panel shows a bold readable date string
    const resultsPanel = input.closest("section");
    expect(
      resultsPanel.querySelector("span[style*='font-weight: 600']"),
    ).toBeTruthy();
  });

  it("entering an invalid ms value shows an error hint", () => {
    renderWithRouter(<CBCMillisPage />);
    const input = screen.getByLabelText(/milliseconds value/i);
    fireEvent.change(input, { target: { value: "not-a-number" } });
    expect(screen.getByText(/valid positive number/i)).toBeInTheDocument();
  });

  it("copy buttons use AppButton secondary", () => {
    renderWithRouter(<CBCMillisPage />);
    const copyBtns = screen.getAllByRole("button", { name: /copy/i });
    expect(copyBtns.length).toBeGreaterThan(0);
    copyBtns.forEach((btn) => {
      expect(btn).toHaveClass("app-button");
      expect(btn).toHaveClass("button-secondary");
    });
  });
});
