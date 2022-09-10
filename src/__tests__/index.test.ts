import { expect, describe, it } from "@jest/globals";
import { ensureDiamondFacets, diamondEquals } from "../index";
import { FacetCutAction } from "../types";
import { AddressZero } from "../utils";

describe("Arguments validator", () => {
  const valid = {
    facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
  };
  const withEmptyAddress = {
    facetAddress: "",
    functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
  };
  const withEmptySelectors = {
    facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    functionSelectors: [],
  };
  const withInvalidSelector = {
    facetAddress: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    functionSelectors: ["notBytes"],
  };
  const withFacetZeroAddress = {
    facetAddress: AddressZero,
    functionSelectors: [],
  };
  const withInvalidAddress = {
    facetAddress: "notAddress",
    functionSelectors: ["0xf2fde38b"],
  };

  it("check current facets with empty address", () => {
    expect(() =>
      ensureDiamondFacets([withEmptyAddress], [valid])
    ).toThrowError();
  });
  it("check current facets with empty selectors", () => {
    expect(() =>
      ensureDiamondFacets([withEmptySelectors], [valid])
    ).toThrowError();
  });
  it("check current facets with invalid selector", () => {
    expect(() =>
      ensureDiamondFacets([withInvalidSelector], [valid])
    ).toThrowError();
  });
  it("check current facets with facet as zero address", () => {
    expect(() =>
      ensureDiamondFacets([withFacetZeroAddress], [valid])
    ).toThrowError();
  });
  it("check current facets with invalid address", () => {
    expect(() =>
      ensureDiamondFacets([withInvalidAddress], [valid])
    ).toThrowError();
  });
  it("check current facets with unique selectors", () => {
    expect(() => ensureDiamondFacets([valid, valid], [valid])).toThrowError();
  });

  it("check model facets with empty address", () => {
    expect(() =>
      ensureDiamondFacets([valid], [withEmptyAddress])
    ).toThrowError();
  });
  it("check model facets with empty selectors", () => {
    expect(() =>
      ensureDiamondFacets([valid], [withEmptySelectors])
    ).toThrowError();
  });
  it("check model facets with invalid selector", () => {
    expect(() =>
      ensureDiamondFacets([valid], [withInvalidSelector])
    ).toThrowError();
  });
  it("check model facets with facet as zero address", () => {
    expect(() =>
      ensureDiamondFacets([valid], [withFacetZeroAddress])
    ).toThrowError();
  });
  it("check model facets with invalid address", () => {
    expect(() =>
      ensureDiamondFacets([valid], [withInvalidAddress])
    ).toThrowError();
  });
  it("check model facets with unique selectors", () => {
    expect(() => ensureDiamondFacets([valid], [valid, valid])).toThrowError();
  });
});

describe("Desired cut", () => {
  it("returns desired cut when model has new facet functions", () => {
    const current = [
      {
        facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
      },
    ];
    const newFacet = {
      facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
    };
    const model = current.concat([newFacet]);
    const diamondCut = ensureDiamondFacets(current, model);
    expect(diamondCut).toEqual([
      {
        facetAddress: newFacet.facetAddress,
        action: FacetCutAction.Add,
        functionSelectors: newFacet.functionSelectors,
      },
    ]);
  });
  it("returns desired cut when model functions removed from a single facet", () => {
    const current = [
      {
        facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
      },
      {
        facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
      },
    ];
    const model = [
      {
        facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
      },
      {
        facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        functionSelectors: ["0xf2fde38b"],
      },
    ];
    const diamondCut = ensureDiamondFacets(current, model);
    expect(diamondCut).toEqual([
      {
        facetAddress: AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: ["0x8da5cb5b"],
      },
    ]);
  });
  it("returns desired cut when model functions removed from multiple facets", () => {
    const current = [
      {
        facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
      },
      {
        facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
      },
    ];
    const model = [
      {
        facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        functionSelectors: ["0xcdffacc6"],
      },
      {
        facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        functionSelectors: ["0xf2fde38b"],
      },
    ];
    const diamondCut = ensureDiamondFacets(current, model);
    expect(diamondCut).toEqual([
      {
        facetAddress: AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: ["0x52ef6b2c", "0x8da5cb5b"],
      },
    ]);
  });
  it("returns desired cut when model facet is replaced", () => {
    const current = [
      {
        facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
      },
    ];
    const newFacetAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
    const model = [
      {
        facetAddress: newFacetAddress,
        functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
      },
    ];
    const diamondCut = ensureDiamondFacets(current, model);
    expect(diamondCut).toEqual([
      {
        facetAddress: newFacetAddress,
        action: FacetCutAction.Replace,
        functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
      },
    ]);
  });

  it("returns desired cut when add, remove are replaced are required", () => {
    const current = [
      {
        facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
      },
      {
        facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
      },
    ];
    const model = [
      // Existing facet with removed function
      {
        facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        // functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
        functionSelectors: ["0xcdffacc6"],
      },
      // Existing function with new facet address
      {
        // facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        facetAddress: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
        functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
      },
      // New Facet with new functions
      {
        facetAddress: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
        functionSelectors: ["0x5a150cb7", "0x11bd8a76", "0x6839c886"],
      },
    ];
    const diamondCut = ensureDiamondFacets(current, model);

    expect(diamondCut).toEqual([
      {
        facetAddress: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
        action: FacetCutAction.Replace,
        functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
      },
      {
        facetAddress: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
        action: FacetCutAction.Add,
        functionSelectors: ["0x5a150cb7", "0x11bd8a76", "0x6839c886"],
      },
      {
        facetAddress: AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: ["0x52ef6b2c"],
      },
    ]);
  });
});

describe("Equal diamonds", () => {
  it("compares two diamonds with different selectors", () => {
    expect(
      diamondEquals(
        [
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfafafafa", "0xfbfbfbfb"],
          },
        ],
        [
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfafafafa", "0xfcfcfcfc"],
          },
        ]
      )
    ).toBeFalsy;
  });
  it("compares two diamonds with same selectors but different facets", () => {
    expect(
      diamondEquals(
        [
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfafafafa", "0xfbfbfbfb"],
          },
        ],
        [
          {
            facetAddress: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
            functionSelectors: ["0xfafafafa", "0xfbfbfbfb"],
          },
        ]
      )
    ).toBeFalsy;
  });

  it("compares two equal", () => {
    expect(
      diamondEquals(
        [
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfafafafa", "0xfbfbfbfb"],
          },
        ],
        [
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfafafafa", "0xfbfbfbfb"],
          },
        ]
      )
    ).toBeTruthy;
  });

  it("ignores the order of the facets", () => {
    expect(
      diamondEquals(
        [
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfafafafa", "0xfbfbfbfb"],
          },
          {
            facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
            functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
          },
        ],
        [
          {
            facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
            functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
          },
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfafafafa", "0xfbfbfbfb"],
          },
        ]
      )
    ).toBeTruthy;
  });
  it("ignores the order of the selectors", () => {
    expect(
      diamondEquals(
        [
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfbfbfbfb", "0xfafafafa"],
          },
          {
            facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
            functionSelectors: ["0xf2fde38b", "0x8da5cb5b"],
          },
        ],
        [
          {
            facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
            functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
          },
          {
            facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            functionSelectors: ["0xfafafafa", "0xfbfbfbfb"],
          },
        ]
      )
    ).toBeTruthy;
  });
});
