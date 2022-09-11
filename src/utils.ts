import { FacetStruct, ValidationError } from "./types";
import { isAddress } from "@ethersproject/address";
import { isBytesLike } from "@ethersproject/bytes";

/** Zero Address (valid checksum) */
export const AddressZero = "0x0000000000000000000000000000000000000000";

/**
 * Creates the routing of the Diamond function selectors to facets
 * @param facets Facets struct (retrieved from the `facets()` function in the `DiamondLouperFacet`)
 * @returns Diamond functionSelectors to facetAddress routes
 */
export function getDiamondRoutes(facets: FacetStruct[]) {
  const routes: { [key: string]: string } = {};
  // Iterate through the diamond facets
  for (let i = 0; i < facets.length; i++) {
    // Iterate through the facet function selectors
    for (let j = 0; j < facets[i].functionSelectors.length; j++) {
      routes[facets[i].functionSelectors[j]] = facets[i].facetAddress;
    }
  }
  return routes;
}

/**
 * Validates the `facets` to:
 * - Have unique facet addresses
 * - Have non-zero valid checksum addresses
 * - Have unique function selectors
 * - Have byteslike function selectors
 * @param facets Facets struct (retrieved from the `facets()` function in the `DiamondLouperFacet`)
 * @param isModelFacet Boolean indicating if the facet belongs to the model
 * @returns Error list if found
 */
export function validateFacets(facets: FacetStruct[], isModelFacet = false) {
  const name = isModelFacet ? "modelFacets" : "currentFacets";
  // VALIDATION
  const errors: ValidationError[] = [];

  // Validating the current facets
  facets.forEach((facet, i) => {
    // Validating the facet address
    if (!isAddress(facet.facetAddress)) {
      errors.push({
        path: `${name}: ${i}.facetAddress`,
        message: "`facetAddress` is invalid",
        type: "invalid-address",
      });
    } else if (facet.facetAddress === AddressZero) {
      errors.push({
        path: `${name}: ${i}.facetAddress`,
        message: "`facetAddress` is zero address",
        type: "zero-address",
      });
    }
    if (facet.functionSelectors.length === 0) {
      // Validating the function selectors
      // Checking if array is not empty
      errors.push({
        path: `${name}: ${i}.functionSelectors`,
        message: "`functionSelectors` cannot be an empty array",
        type: "empty-functionSelectors",
      });
    }
    // Checking if array contains valid bytes4
    facet.functionSelectors.forEach((fs, j) => {
      if (!isBytesLike(fs)) {
        errors.push({
          path: `${name}: ${i}.functionSelectors.${j}`,
          message: "Each function selector must be bytes like",
          type: "invalid-functionSelector",
        });
      }
    });
  });
  // Validating that current facets addresses are unique
  facets.reduce((addreses: string[], facet, i) => {
    const foundIdx = addreses.indexOf(facet.facetAddress);
    if (foundIdx > -1) {
      errors.push({
        path: `${name}: ${i}.facetAddress`,
        message: "Facet addresese must be unique",
        type: "duplicate-facetAddress",
      });
    } else {
      addreses.push(facet.facetAddress);
    }
    return addreses;
  }, []);
  // Validating that current facets selectors are unique
  facets.reduce((selectors: string[], facet, i) => {
    facet.functionSelectors.forEach((selector, j) => {
      const foundIdx = selectors.indexOf(selector);
      if (foundIdx > -1) {
        errors.push({
          path: `${name}: ${i}.functionSelectors.${j}`,
          message: "Facets must have unique function selectors",
          type: "duplicate-functionSelector",
        });
      } else {
        selectors.push(selector);
      }
    });
    return selectors;
  }, []);

  return errors;
}
