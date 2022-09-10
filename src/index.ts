import { FacetCutAction, FacetCutStruct, FacetStruct } from "./types";
import { AddressZero } from "./utils";
import { isAddress } from "@ethersproject/address";
import { isBytesLike } from "@ethersproject/bytes";

/**
 * Compares two sets of facets in order to retrieve the actions needed to fit a desired facets output
 * @param currentFacets Current facets (retrieved from the `facets()` function in the `DiamondLouperFacet`)
 * @param modelFacets Model (desired) facets that the current list of facets should be compared against
 * @returns Returns the expected diamond cut to be made in order to enforce the model facets
 */
function ensureDiamondFacets(
  currentFacets: FacetStruct[],
  modelFacets: FacetStruct[]
) {
  // VALIDATION
  const errors: {
    path: string;
    message: string;
    type: string;
  }[] = [];
  // Validating the current facets
  currentFacets.forEach((facet, i) => {
    // Validating the facet address
    if (!isAddress(facet.facetAddress)) {
      errors.push({
        path: `currentFacets: ${i}.facetAddress`,
        message: "`facetAddress` is invalid",
        type: "invalid-address",
      });
    } else if (facet.facetAddress === AddressZero) {
      errors.push({
        path: `currentFacets: ${i}.facetAddress`,
        message: "`facetAddress` is zero address",
        type: "zero-address",
      });
    }
    if (facet.functionSelectors.length === 0) {
      // Validating the function selectors
      // Checking if array is not empty
      errors.push({
        path: `currentFacets: ${i}.functionSelectors`,
        message: "`functionSelectors` cannot be an empty array",
        type: "empty-functionSelectors",
      });
    }
    // Checking if array contains valid bytes4
    facet.functionSelectors.forEach((fs, j) => {
      if (!isBytesLike(fs)) {
        errors.push({
          path: `currentFacets: ${i}.functionSelectors.${j}`,
          message: "Each function selector must be bytes like",
          type: "invalid-functionSelector",
        });
      }
    });
  });
  // Validating that current facets addresses are unique
  currentFacets.reduce((addreses: string[], facet, i) => {
    const foundIdx = addreses.indexOf(facet.facetAddress);
    if (foundIdx > -1) {
      errors.push({
        path: `currentFacets: ${i}.facetAddress`,
        message: "Facet addresese must be unique",
        type: "duplicate-facetAddress",
      });
    } else {
      addreses.push(facet.facetAddress);
    }
    return addreses;
  }, []);
  // Validating that current facets selectors are unique
  currentFacets.reduce((selectors: string[], facet, i) => {
    facet.functionSelectors.forEach((selector, j) => {
      const foundIdx = selectors.indexOf(selector);
      if (foundIdx > -1) {
        errors.push({
          path: `currentFacets: ${i}.functionSelectors.${j}`,
          message: "Facets must have unique function selectors",
          type: "duplicate-functionSelector",
        });
      } else {
        selectors.push(selector);
      }
    });
    return selectors;
  }, []);
  // Validating the model facets
  modelFacets.forEach((facet, i) => {
    // Validating the facet address
    if (!isAddress(facet.facetAddress)) {
      errors.push({
        path: `currentFacets: ${i}.facetAddress`,
        message: "`facetAddress` is invalid",
        type: "invalid-address",
      });
    } else if (facet.facetAddress === AddressZero) {
      errors.push({
        path: `currentFacets: ${i}.facetAddress`,
        message: "`facetAddress` is zero address",
        type: "zero-address",
      });
    }
    if (facet.functionSelectors.length === 0) {
      // Validating the function selectors
      // Checking if array is not empty
      errors.push({
        path: `currentFacets: ${i}.functionSelectors`,
        message: "`functionSelectors` cannot be an empty array",
        type: "empty-functionSelectors",
      });
    }
    // Checking if array contains valid bytes4
    facet.functionSelectors.forEach((fs, j) => {
      if (!isBytesLike(fs)) {
        errors.push({
          path: `currentFacets: ${i}.functionSelectors.${j}`,
          message: "Each function selector must be bytes like",
          type: "invalid-functionSelector",
        });
      }
    });
  });
  // Validating that model facets addresses are unique
  modelFacets.reduce((addreses: string[], facet, i) => {
    const foundIdx = addreses.indexOf(facet.facetAddress);
    if (foundIdx > -1) {
      errors.push({
        path: `modelFacets: ${i}.facetAddress`,
        message: "Facet addresese must be unique",
        type: "duplicate-facetAddress",
      });
    } else {
      addreses.push(facet.facetAddress);
    }
    return addreses;
  }, []);
  // Validating that model facets selectors are unique
  modelFacets.reduce((selectors: string[], facet, i) => {
    facet.functionSelectors.forEach((selector, j) => {
      const foundIdx = selectors.indexOf(selector);
      if (foundIdx > -1) {
        errors.push({
          path: `modelFacets: ${i}.functionSelectors.${j}`,
          message: "Facets must have unique function selectors",
          type: "duplicate-functionSelector",
        });
      } else {
        selectors.push(selector);
      }
    });
    return selectors;
  }, []);
  if (errors.length > 0) {
    throw errors;
  }

  // 1) Initialize the desired diamondCut array
  const desiredCut: FacetCutStruct[] = [];

  // 2) Create routes mapping
  const currentRoutes: { [key: string]: string } = {};
  for (let i = 0; i < currentFacets.length; i++) {
    for (let j = 0; j < currentFacets[i].functionSelectors.length; j++) {
      currentRoutes[currentFacets[i].functionSelectors[j]] =
        currentFacets[i].facetAddress;
    }
  }
  const modelRoutes: { [key: string]: string } = {};
  for (let i = 0; i < modelFacets.length; i++) {
    for (let j = 0; j < modelFacets[i].functionSelectors.length; j++) {
      modelRoutes[modelFacets[i].functionSelectors[j]] =
        modelFacets[i].facetAddress;
    }
  }

  const selectorsToRemove: string[] = [];

  // 3) Check currentRoutes against modelRoutes
  for (const [selector] of Object.entries(currentRoutes)) {
    if (currentRoutes[selector] == modelRoutes[selector]) continue;
    if (!modelRoutes[selector]) {
      // Model doesn't have this selector -> To be removed
      selectorsToRemove.push(selector);
    } else {
      // Model's selecter with new facet -> To be replaced
      const foundCutIdx = desiredCut.findIndex(
        (x) =>
          x.facetAddress === modelRoutes[selector] &&
          x.action === FacetCutAction.Replace
      );
      if (foundCutIdx > -1) {
        desiredCut[foundCutIdx].functionSelectors.push(selector);
      } else {
        desiredCut.push({
          facetAddress: modelRoutes[selector],
          action: FacetCutAction.Replace,
          functionSelectors: [selector],
        });
      }
    }
  }

  // 4) Check modelRoutes against currentRoutes
  for (const [selector] of Object.entries(modelRoutes)) {
    if (modelRoutes[selector] == currentRoutes[selector]) continue;
    if (!currentRoutes[selector]) {
      // Current doesn't have this selector -> To be added
      const foundCutIdx = desiredCut.findIndex(
        (x) =>
          x.facetAddress === modelRoutes[selector] &&
          x.action === FacetCutAction.Add
      );
      if (foundCutIdx > -1) {
        desiredCut[foundCutIdx].functionSelectors.push(selector);
      } else {
        desiredCut.push({
          facetAddress: modelRoutes[selector],
          action: FacetCutAction.Add,
          functionSelectors: [selector],
        });
      }
    }
  }

  // 5) Add the removeCut if required
  if (selectorsToRemove.length > 0) {
    desiredCut.push({
      facetAddress: AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: selectorsToRemove,
    });
  }

  // 5) Return expected cut to enforce model facets
  return desiredCut;
}
/**
 * Checks if two diamonds has the same functions
 * @param currentFacets Current facets (retrieved from the `facets()` function in the `DiamondLouperFacet`)
 * @param modelFacets Model (desired) facets that the current list of facets should be compared against
 * @returns Boolean which indicates if two diamonds are the same
 */
function diamondEquals(
  currentFacets: FacetStruct[],
  modelFacets: FacetStruct[]
) {
  return ensureDiamondFacets(currentFacets, modelFacets).length === 0;
}

export { ensureDiamondFacets, diamondEquals };
