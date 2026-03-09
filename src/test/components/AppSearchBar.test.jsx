import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AppSearchBar from "../../components/ui/AppSearchBar/AppSearchBar";

describe("AppSearchBar", () => {
  it("renders a labeled input", () => {
    render(
      <AppSearchBar
        id="test-search"
        label="Search"
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
  });

  it("label is associated with input via htmlFor/id", () => {
    render(
      <AppSearchBar id="my-id" label="My label" value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("textbox", { name: "My label" });
    expect(input).toHaveAttribute("id", "my-id");
  });

  it("displays the controlled value", () => {
    render(
      <AppSearchBar id="s" label="Search" value="hello" onChange={vi.fn()} />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });

  it("calls onChange with the new string value (not the event)", () => {
    const onChange = vi.fn();
    render(<AppSearchBar id="s" label="Search" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "abc" },
    });
    expect(onChange).toHaveBeenCalledWith("abc");
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.anything() }),
    );
  });

  it("shows placeholder text", () => {
    render(
      <AppSearchBar
        id="s"
        label="Search"
        value=""
        onChange={vi.fn()}
        placeholder="Type something"
      />,
    );
    expect(screen.getByPlaceholderText("Type something")).toBeInTheDocument();
  });

  it("renders inside a compact-grid wrapper", () => {
    const { container } = render(
      <AppSearchBar id="s" label="Search" value="" onChange={vi.fn()} />,
    );
    expect(container.querySelector(".compact-grid")).toBeInTheDocument();
  });

  it("renders Tooltip when tooltip prop is provided", () => {
    render(
      <AppSearchBar
        id="s"
        label="Search"
        value=""
        onChange={vi.fn()}
        tooltip="Help text here"
      />,
    );
    // Tooltip renders a button with the ℹ character or aria-label
    const tooltipTrigger = screen.getByRole("button");
    expect(tooltipTrigger).toBeInTheDocument();
  });

  it("does not render Tooltip when tooltip prop is omitted", () => {
    render(<AppSearchBar id="s" label="Search" value="" onChange={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("input type is text", () => {
    render(<AppSearchBar id="s" label="Search" value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
  });
});
