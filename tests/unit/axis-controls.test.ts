import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AxisSlider } from "../../components/axis-slider";

describe("repeated variable-font controls", () => {
  it("keep each repeated axis independently labelled with unique control IDs", () => {
    const props = {
      tag: "wght",
      name: "Weight",
      min: 100,
      max: 900,
      step: 1,
      value: 400,
      onChange: () => {},
    };
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(AxisSlider, props),
        createElement(AxisSlider, props),
      ),
    );
    const ids = [...html.matchAll(/<input[^>]*id="([^"]+)"/g)].map(
      (match) => match[1],
    );
    const labels = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(labels).toEqual(ids);
    expect([...html.matchAll(/aria-label="Weight \(wght\)"/g)]).toHaveLength(2);
  });
});
