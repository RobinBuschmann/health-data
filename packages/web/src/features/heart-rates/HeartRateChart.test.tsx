import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HeartRateChart } from "./HeartRateChart";

describe("given no data", () => {
  it("should render without crashing", () => {
    const { container } = render(<HeartRateChart data={[]} />);
    expect(container.firstChild).not.toBeNull();
  });
});

describe("given heart rate data", () => {
  it("should render without crashing", () => {
    const { container } = render(
      <HeartRateChart
        data={[
          { timestamp: "2024-01-01T00:00:00.000Z", bpm: 72 },
          { timestamp: "2024-01-02T00:00:00.000Z", bpm: 68 },
        ]}
      />,
    );
    expect(container.firstChild).not.toBeNull();
  });
});
