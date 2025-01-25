import { APIClient } from "../src/APIClient";
import { rest } from "msw";
import { setupServer } from "msw/node";

const backendUrl = process.env.BACKEND_URL
const apiClient = new APIClient(backendUrl);

// Mock server for API requests
const server = setupServer(
  rest.get(`${backendUrl}/test`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: "Success" }));
  }),
  rest.get(`${backendUrl}/auth-required`, (req, res, ctx) => {
    return res(ctx.status(403), ctx.json({ message: "Forbidden" }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("APIClient", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "";
  });

  it("should fetch data successfully", async () => {
    const response = await apiClient.get("/test");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Success");
  });

  it("should clear local data and redirect on 403 Forbidden", async () => {
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: "" };

    await expect(apiClient.get("/auth-required")).rejects.toThrow(
      "User is not authenticated. Redirecting to /auth."
    );

    // Verify localStorage is cleared
    expect(localStorage.length).toBe(0);

    // Verify cookies are cleared
    expect(document.cookie).toBe("");

    // Verify redirection
    expect(window.location.href).toBe("/auth");
  });

  it("should handle other HTTP errors gracefully", async () => {
    server.use(
      rest.get(`${baseUrl}/error`, (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: "Server Error" }));
      })
    );

    const response = await apiClient.get("/error");
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.message).toBe("Server Error");
  });
});
