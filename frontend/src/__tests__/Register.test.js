import React from "react";
import { MemoryRouter } from "react-router-dom";
import {
  render,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import App from "../App";

function mockReactRouterDom() {
  const original = require.requireActual("react-router-dom");
  return {
    ...original,
    useLocation: jest.fn().mockReturnValue({
      pathname: "/register",
      search: "",
      hash: "",
      state: null,
      key: "",
    }),
  };
}

jest.mock("react-router-dom", () => mockReactRouterDom());

// @todo use `import userEvent from "@testing-library/user-event";`
describe("register form", () => {
  it("displays passwords much match notice", async () => {
    const { getByLabelText, findByText, queryByText } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>
    );
    const inputEmail = getByLabelText("Email Address *");
    inputEmail.value = "test@example.com";
    const inputPassword = getByLabelText("Password *");
    fireEvent.change(inputPassword, { target: { value: "foo" } });
    expect(inputPassword.value).toBe("foo");
    const inputConfirmPassword = getByLabelText("Confirm password *");
    fireEvent.change(inputConfirmPassword, { target: { value: "bar" } });
    expect(inputConfirmPassword.value).toBe("bar");

    await findByText("The passwords do not match");

    inputConfirmPassword.focus();
    fireEvent.change(inputConfirmPassword, { target: { value: "foo" } });
    expect(inputConfirmPassword.value).toBe("foo");
    inputConfirmPassword.blur();

    expect(queryByText("The passwords do not match")).not.toBeInTheDocument();
  });

  it("registers a new user", async () => {
    const { debug, getByLabelText, getByText, queryByText } = render(
      <MemoryRouter initialEntries={["/register", "/me"]}>
        <App />
      </MemoryRouter>
    );

    const randomString = Math.random().toString(36).substr(2);
    const testEmail = `${randomString}@example.com`;

    const inputEmail = getByLabelText("Email Address *");
    fireEvent.change(inputEmail, { target: { value: testEmail } });
    const inputPassword = getByLabelText("Password *");
    fireEvent.change(inputPassword, { target: { value: "foo" } });
    expect(inputPassword.value).toBe("foo");
    const inputConfirmPassword = getByLabelText("Confirm password *");
    fireEvent.change(inputConfirmPassword, { target: { value: "foo" } });
    expect(inputConfirmPassword.value).toBe("foo");

    let submitButton = getByText("Create your account").parentElement;
    expect(submitButton.disabled).toBe(false);
    fireEvent.submit(submitButton.closest("form"));
    submitButton = getByText("Create your account").parentElement;
    expect(submitButton.disabled).toBe(true);

    expect(queryByText("Passwords do not match")).not.toBeInTheDocument();

    try {
      await waitForElementToBeRemoved(() => getByText("Create your account"));
    } catch (err) {
      throw err;
    }

    await waitFor(() => getByText(testEmail));
    debug();
  });
});
