# diamond-diff

Tool to compare an EIP-2535 Diamond against another EIP-2535 Diamond in order to:

- Check if two Diamonds have the same functions.
- Check what's the desired `diamondCut` on the Diamond to have the same functions (with facets) of a Model Diamond.

## EIP-2535

The Diamond Pattern, or [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535), is a multi-proxy pattern that is able to add, edit or remove different functions from different Smart Contracts (facets) in a single Diamond without virtually any limits.

## When to use

An example of when to use this tool is if you have a factory of Upgradeable Diamonds which needs to follow a model. `diamond-diff` will help you check which diamonds are not ~up-to-date~ (doesn't have the same functions as desired) and let you know what's the needed `diamondCut` so that every existing (deployed) Diamond follows the Model Diamond.

## Installation

```bash
npm install diamond-diff
```

or

```bash
yarn add diamond-diff
```

## Basic usage

```ts
import { ensureDiamondFacets, diamondEquals } from "diamond-diff";

// Facets can be retrieved with the `DiamondLoupeFacet` by calling the `facets()` method

const currentDiamondFacets = [
  {
    facetAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    functionSelectors: ["0xcdffacc6", "0x52ef6b2c"],
  },
  {
    facetAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
  },
];
const modelDiamondFacets = [
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

// Getting the desired diamondCut
const diamondCut = ensureDiamondFacets(current, model);
console.log(diamondCut);
// [
//   {
//     facetAddress: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
//     action: 1, // <- Replace
//     functionSelectors: ["0x8da5cb5b", "0xf2fde38b"],
//   },
//   {
//     facetAddress: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
//     action: 0, // <- Add
//     functionSelectors: ["0x5a150cb7", "0x11bd8a76", "0x6839c886"],
//   },
//   {
//     facetAddress: 0x0000000000000000000000000000000000000000,
//     action: 1, // <- Remove
//     functionSelectors: ["0x52ef6b2c"],
//   },
// ];

// Comparing diamonds
const areEqual = diamondEquals(current, model);
console.log(areEqual); // => false
```

## Considerations

Make sure that the Model Diamond has the required EIP-2535 facets: `DiamondCut`, `DiamondLoupe`. Otherwise the `desiredCut` could convert the `Upgradeable Diamond` into a `Finished Diamond`

## Definitions

- Upgradeable Diamond An upgradeable diamond has the diamondCut function and/or possibly other functions to add/replace/remove functions. It is useful for iterative development or improving an application over time.

- Finished Diamond A finished diamond was an upgradeable diamond and had a number of upgrades. Then its diamondCut function and/or other upgrade functions were removed and upgrades are no longer possible. It is no longer possible to add/replace/remove functions. It has become an immutable diamond.
