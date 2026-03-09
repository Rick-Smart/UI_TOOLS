import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AppModal from "../../components/ui/AppModal/AppModal";

const noop = () => {};

describe("AppModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <AppModal isOpen={false} onClose={noop} title="Test" titleId="test-id">
        Content
      </AppModal>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a dialog when isOpen is true", () => {
    render(
      <AppModal
        isOpen={true}
        onClose={noop}
        title="My Modal"
        titleId="modal-title"
      >
        Body content
      </AppModal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("My Modal")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("has correct ARIA attributes on the dialog", () => {
    render(
      <AppModal isOpen={true} onClose={noop} title="M" titleId="my-modal-id">
        <span />
      </AppModal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "my-modal-id");
  });

  it("close button uses AppButton", () => {
    render(
      <AppModal isOpen={true} onClose={noop} title="M" titleId="m">
        <span />
      </AppModal>,
    );
    expect(screen.getByRole("button", { name: /close modal/i })).toHaveClass(
      "app-button",
    );
  });

  it("clicking the close button calls onClose", () => {
    const onClose = vi.fn();
    render(
      <AppModal isOpen={true} onClose={onClose} title="M" titleId="m">
        <span />
      </AppModal>,
    );
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("pressing Escape calls onClose", () => {
    const onClose = vi.fn();
    render(
      <AppModal isOpen={true} onClose={onClose} title="M" titleId="m">
        <span />
      </AppModal>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking the backdrop calls onClose", () => {
    const onClose = vi.fn();
    const { container } = render(
      <AppModal isOpen={true} onClose={onClose} title="M" titleId="m">
        <span />
      </AppModal>,
    );
    fireEvent.click(container.querySelector(".app-modal-root"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking inside the panel does NOT call onClose", () => {
    const onClose = vi.fn();
    const { container } = render(
      <AppModal isOpen={true} onClose={onClose} title="M" titleId="m">
        <p>Inner content</p>
      </AppModal>,
    );
    fireEvent.click(container.querySelector(".app-modal-panel"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closeOnBackdrop=false prevents backdrop dismiss", () => {
    const onClose = vi.fn();
    const { container } = render(
      <AppModal
        isOpen={true}
        onClose={onClose}
        closeOnBackdrop={false}
        title="M"
        titleId="m"
      >
        <span />
      </AppModal>,
    );
    fireEvent.click(container.querySelector(".app-modal-root"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders footer content when footer prop is provided", () => {
    render(
      <AppModal
        isOpen={true}
        onClose={noop}
        title="M"
        titleId="m"
        footer={<button>Confirm</button>}
      >
        <span />
      </AppModal>,
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("does not render footer section when footer prop is omitted", () => {
    const { container } = render(
      <AppModal isOpen={true} onClose={noop} title="M" titleId="m">
        <span />
      </AppModal>,
    );
    expect(container.querySelector(".app-modal-footer")).toBeNull();
  });

  it("applies panelClassName to the panel", () => {
    const { container } = render(
      <AppModal
        isOpen={true}
        onClose={noop}
        title="M"
        titleId="m"
        panelClassName="wide-modal"
      >
        <span />
      </AppModal>,
    );
    expect(container.querySelector(".app-modal-panel")).toHaveClass(
      "wide-modal",
    );
  });
});
