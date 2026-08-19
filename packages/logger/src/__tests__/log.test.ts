import { jest } from "@jest/globals";

import { log } from "../index.js";

jest.spyOn(global.console, "log");

describe("@repo/logger", () => {
  it("prints a message", () => {
    log("hello");
    expect(console.log).toHaveBeenCalled();
  });
});
