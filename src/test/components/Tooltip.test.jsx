import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Tooltip from "../../components/Tooltip";

describe("Tooltip", () => {
  it("renders the trigger button with default aria-label", () => {
    render(<Tooltip text="Helpful info" />);
    expect(
      screen.getByRole("button", { name: /more info/i }),
    ).toBeInTheDocument();
  });

  it("accepts a custom aria-label via the label prop", () => {
    render(<Tooltip text="Info" label="Learn more" />);
    expect(
      screen.getByRole("button", { name: "Learn more" }),
    ).toBeInTheDocument();
  });

  it("is initially closed (aria-expanded=false)", () => {
    render(<Tooltip text="Helpful info" />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("opens on click (aria-expanded becomes true)", () => {
    render(<Tooltip text="Helpful info" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on second click", () => {
    render(<Tooltip text="Helpful info" />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("adds tooltip-open class when open", () => {
    const { container } = render(<Tooltip text="Helpful info" />);
    fireEvent.click(screen.getByRole("button"));
    expect(container.querySelector(".tooltip-open")).toBeTruthy();
  });

  it("removes tooltip-open class when closed", () => {
    const { container } = render(<Tooltip text="Helpful info" />);
    expect(container.querySelector(".tooltip-open")).toBeNull();
  });

  it("tooltip panel always contains the text content", () => {
    render(<Tooltip text="Helpful info" />);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Helpful info");
  });

  it("sets aria-describedby on the button when open", () => {
    render(<Tooltip text="Helpful info" />);
    const btn = screen.getByRole("button");
    expect(btn).not.toHaveAttribute("aria-describedby");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-describedby");
  });

  it("pressing Escape closes the tooltip", () => {
    render(<Tooltip text="Helpful info" />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(btn.closest(".tooltip-wrap"), { key: "Escape" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
});
