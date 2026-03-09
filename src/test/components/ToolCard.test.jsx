import { screen } from "@testing-library/react";
import { renderWithRouter } from "../renderWithRouter";
import ToolCard from "../../components/ui/ToolCard";

const defaultProps = {
  title: "Base Period Calculator",
  description: "Calculate the base period for a UI claim.",
  to: "/base-period",
  actionLabel: "Open Tool",
  audience: "agent",
};

describe("ToolCard", () => {
  it("renders the title in an h3", () => {
    renderWithRouter(<ToolCard {...defaultProps} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Base Period Calculator" }),
    ).toBeInTheDocument();
  });

  it("renders the description text", () => {
    renderWithRouter(<ToolCard {...defaultProps} />);
    expect(
      screen.getByText("Calculate the base period for a UI claim."),
    ).toBeInTheDocument();
  });

  it("renders the action label as an AppButton link", () => {
    renderWithRouter(<ToolCard {...defaultProps} />);
    const link = screen.getByRole("link", { name: "Open Tool" });
    expect(link).toHaveClass("app-button");
    expect(link).toHaveAttribute("href", "/base-period");
  });

  it("applies button-secondary class to the action link", () => {
    renderWithRouter(<ToolCard {...defaultProps} />);
    expect(screen.getByRole("link", { name: "Open Tool" })).toHaveClass(
      "button-secondary",
    );
  });

  it("renders an AudienceBadge for a known audience", () => {
    renderWithRouter(<ToolCard {...defaultProps} audience="agent" />);
    expect(screen.getByText("Agent Tool")).toBeInTheDocument();
  });

  it("renders claimant badge for audience='claimant'", () => {
    renderWithRouter(<ToolCard {...defaultProps} audience="claimant" />);
    expect(screen.getByText("Claimant Support")).toBeInTheDocument();
  });

  it("renders no badge when audience is undefined", () => {
    renderWithRouter(<ToolCard {...defaultProps} audience={undefined} />);
    expect(screen.queryByText("Agent Tool")).toBeNull();
    expect(screen.queryByText("Claimant Support")).toBeNull();
  });

  it("wraps content in a tool-card article", () => {
    const { container } = renderWithRouter(<ToolCard {...defaultProps} />);
    expect(container.querySelector("article.tool-card")).toBeTruthy();
  });
});
