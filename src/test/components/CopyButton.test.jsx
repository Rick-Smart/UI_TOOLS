import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CopyButton from "../../components/ui/CopyButton/CopyButton";

function wrap(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("CopyButton", () => {
  it("renders a button with default label 'Copy summary'", () => {
    wrap(<CopyButton getSummary={() => "text"} />);
    expect(
      screen.getByRole("button", { name: "Copy summary" }),
    ).toBeInTheDocument();
  });

  it("renders a custom label via children", () => {
    wrap(<CopyButton getSummary={() => "text"}>Copy my thing</CopyButton>);
    expect(
      screen.getByRole("button", { name: "Copy my thing" }),
    ).toBeInTheDocument();
  });

  it("button has app-button and button-secondary classes", () => {
    wrap(<CopyButton getSummary={() => "text"} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("app-button");
    expect(btn).toHaveClass("button-secondary");
  });

  it("shows no status text before clicking", () => {
    wrap(<CopyButton getSummary={() => "text"} />);
    expect(screen.queryByText("Copied.")).not.toBeInTheDocument();
    expect(screen.queryByText("Copy unavailable.")).not.toBeInTheDocument();
  });

  it("shows 'Copied.' after successful copy", async () => {
    navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    wrap(<CopyButton getSummary={() => "some summary"} />);
    await user.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByText("Copied.")).toBeInTheDocument(),
    );
  });

  it("shows 'Copy unavailable.' when clipboard rejects", async () => {
    navigator.clipboard.writeText = vi
      .fn()
      .mockRejectedValue(new Error("no clipboard"));
    const user = userEvent.setup();
    wrap(<CopyButton getSummary={() => "some summary"} />);
    await user.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByText("Copy unavailable.")).toBeInTheDocument(),
    );
  });

  it("calls getSummary on click", async () => {
    navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined);
    const getSummary = vi.fn(() => "my summary");
    const user = userEvent.setup();
    wrap(<CopyButton getSummary={getSummary} />);
    await user.click(screen.getByRole("button"));
    expect(getSummary).toHaveBeenCalledTimes(1);
  });

  it("does not call clipboard if getSummary returns empty string", async () => {
    navigator.clipboard.writeText = vi.fn();
    const user = userEvent.setup();
    wrap(<CopyButton getSummary={() => ""} />);
    await user.click(screen.getByRole("button"));
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("does not call clipboard if getSummary is not a function", async () => {
    navigator.clipboard.writeText = vi.fn();
    const user = userEvent.setup();
    wrap(<CopyButton getSummary={null} />);
    await user.click(screen.getByRole("button"));
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("disabled prop is forwarded — button is disabled", () => {
    wrap(<CopyButton getSummary={() => "x"} disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("status text has muted class", async () => {
    navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    wrap(<CopyButton getSummary={() => "summary"} />);
    await user.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByText("Copied.")).toBeInTheDocument(),
    );
    expect(screen.getByText("Copied.").tagName).toBe("SPAN");
    expect(screen.getByText("Copied.")).toHaveClass("muted");
  });
});
