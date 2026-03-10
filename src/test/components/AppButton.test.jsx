import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRouter } from "../renderWithRouter";
import AppButton from "../../components/ui/AppButton/AppButton";

describe("AppButton", () => {
  describe("default (button) variant", () => {
    it("renders as <button> with type=button by default", () => {
      renderWithRouter(<AppButton>Click me</AppButton>);
      const el = screen.getByRole("button", { name: "Click me" });
      expect(el.tagName).toBe("BUTTON");
      expect(el.type).toBe("button");
    });

    it("has app-button class", () => {
      renderWithRouter(<AppButton>Click</AppButton>);
      expect(screen.getByRole("button")).toHaveClass("app-button");
    });

    it("primary variant has no button-secondary class", () => {
      renderWithRouter(<AppButton variant="primary">Primary</AppButton>);
      expect(screen.getByRole("button")).not.toHaveClass("button-secondary");
    });

    it("secondary variant adds button-secondary class", () => {
      renderWithRouter(<AppButton variant="secondary">Secondary</AppButton>);
      expect(screen.getByRole("button")).toHaveClass("button-secondary");
    });

    it("merges extra className", () => {
      renderWithRouter(<AppButton className="my-class">B</AppButton>);
      expect(screen.getByRole("button")).toHaveClass("app-button", "my-class");
    });

    it("forwards onClick", () => {
      const handler = vi.fn();
      renderWithRouter(<AppButton onClick={handler}>Click</AppButton>);
      fireEvent.click(screen.getByRole("button"));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("forwards disabled prop", () => {
      renderWithRouter(<AppButton disabled>Disabled</AppButton>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("does not fire onClick when disabled", () => {
      const handler = vi.fn();
      renderWithRouter(
        <AppButton disabled onClick={handler}>
          D
        </AppButton>,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(handler).not.toHaveBeenCalled();
    });

    it("forwards arbitrary data-* attributes", () => {
      renderWithRouter(<AppButton data-testid="my-btn">B</AppButton>);
      expect(screen.getByTestId("my-btn")).toBeInTheDocument();
    });
  });

  describe("hover state", () => {
    it("adds app-button-hovered class on mouseenter", () => {
      renderWithRouter(<AppButton>Hover me</AppButton>);
      const btn = screen.getByRole("button");
      fireEvent.mouseEnter(btn);
      expect(btn).toHaveClass("app-button-hovered");
    });

    it("removes app-button-hovered class on mouseleave", () => {
      renderWithRouter(<AppButton>Hover me</AppButton>);
      const btn = screen.getByRole("button");
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(btn).not.toHaveClass("app-button-hovered");
    });

    it("calls onHoverChange(true) on mouseenter", () => {
      const onHoverChange = vi.fn();
      renderWithRouter(<AppButton onHoverChange={onHoverChange}>H</AppButton>);
      fireEvent.mouseEnter(screen.getByRole("button"));
      expect(onHoverChange).toHaveBeenCalledWith(true);
    });

    it("calls onHoverChange(false) on mouseleave", () => {
      const onHoverChange = vi.fn();
      renderWithRouter(<AppButton onHoverChange={onHoverChange}>H</AppButton>);
      const btn = screen.getByRole("button");
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(onHoverChange).toHaveBeenLastCalledWith(false);
    });

    it("removes app-button-hovered on blur", () => {
      renderWithRouter(<AppButton>Focus me</AppButton>);
      const btn = screen.getByRole("button");
      fireEvent.focus(btn);
      fireEvent.blur(btn);
      expect(btn).not.toHaveClass("app-button-hovered");
    });
  });

  describe("anchor variant (href)", () => {
    it("renders as <a> when href is provided", () => {
      renderWithRouter(<AppButton href="https://example.com">Link</AppButton>);
      const el = screen.getByRole("link", { name: "Link" });
      expect(el.tagName).toBe("A");
      expect(el).toHaveAttribute("href", "https://example.com");
    });

    it("has app-button class on anchor", () => {
      renderWithRouter(<AppButton href="https://example.com">Link</AppButton>);
      expect(screen.getByRole("link")).toHaveClass("app-button");
    });

    it("forwards target and rel", () => {
      renderWithRouter(
        <AppButton
          href="https://example.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ext
        </AppButton>,
      );
      const el = screen.getByRole("link");
      expect(el).toHaveAttribute("target", "_blank");
      expect(el).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("anchor secondary variant has button-secondary class", () => {
      renderWithRouter(
        <AppButton href="#" variant="secondary">
          Link
        </AppButton>,
      );
      expect(screen.getByRole("link")).toHaveClass("button-secondary");
    });
  });

  describe("router Link variant (to)", () => {
    it("renders as <a> (React Router Link) when to is provided", () => {
      renderWithRouter(<AppButton to="/some-page">Page</AppButton>);
      const el = screen.getByRole("link", { name: "Page" });
      expect(el.tagName).toBe("A");
    });

    it("has app-button class on Link", () => {
      renderWithRouter(<AppButton to="/some-page">Page</AppButton>);
      expect(screen.getByRole("link")).toHaveClass("app-button");
    });
  });
});
