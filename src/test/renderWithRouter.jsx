import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * Render a component inside a MemoryRouter.
 * Required for any component that uses AppButton with `to=`, or any page
 * that contains React Router <Link> elements.
 */
export function renderWithRouter(ui, { initialEntries = ["/"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>,
  );
}
