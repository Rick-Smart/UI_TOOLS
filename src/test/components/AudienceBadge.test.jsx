import { render, screen } from "@testing-library/react";
import AudienceBadge from "../../components/ui/AudienceBadge";

describe("AudienceBadge", () => {
  it("renders nothing when audience is undefined", () => {
    const { container } = render(<AudienceBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for an unknown audience value", () => {
    const { container } = render(<AudienceBadge audience="supervisor" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 'Agent Tool' for audience='agent'", () => {
    render(<AudienceBadge audience="agent" />);
    expect(screen.getByText("Agent Tool")).toBeInTheDocument();
  });

  it("applies audience-badge and audience-agent classes for agent", () => {
    const { container } = render(<AudienceBadge audience="agent" />);
    expect(container.firstChild).toHaveClass("audience-badge");
    expect(container.firstChild).toHaveClass("audience-agent");
  });

  it("renders 'Claimant Support' for audience='claimant'", () => {
    render(<AudienceBadge audience="claimant" />);
    expect(screen.getByText("Claimant Support")).toBeInTheDocument();
  });

  it("applies audience-badge and audience-claimant classes for claimant", () => {
    const { container } = render(<AudienceBadge audience="claimant" />);
    expect(container.firstChild).toHaveClass("audience-badge");
    expect(container.firstChild).toHaveClass("audience-claimant");
  });
});
