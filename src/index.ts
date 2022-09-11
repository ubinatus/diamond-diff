import { FacetCutAction, FacetCutStruct, FacetStruct } from "./types";
import { AddressZero, getDiamondRoutes, validateFacets } from "./utils";

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
  // Validating the current facets
  const currentFacetsError = validateFacets(currentFacets);
  // Validating the model facets
  const modelFacetsError = validateFacets(modelFacets, true);
  const errors = currentFacetsError.concat(modelFacetsError);
  if (errors.length > 0) {
    throw errors;
  }

  // 1) Initialize the desired diamondCut array
  const desiredCut: FacetCutStruct[] = [];

  // 2) Create routes mapping
  const currentRoutes = getDiamondRoutes(currentFacets);
  const modelRoutes = getDiamondRoutes(modelFacets);

  // 3) Check currentRoutes against modelRoutes
  const selectorsToRemove: string[] = [];
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

  // 6) Return expected cut to enforce model facets
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
  // VALIDATION
  // Validating the current facets
  const currentFacetsError = validateFacets(currentFacets);
  // Validating the model facets
  const modelFacetsError = validateFacets(modelFacets, true);
  const errors = currentFacetsError.concat(modelFacetsError);
  if (errors.length > 0) {
    throw errors;
  }

  // 1) Create routes mapping
  const currentRoutes = getDiamondRoutes(currentFacets);
  const modelRoutes = getDiamondRoutes(modelFacets);

  // 2) Check currentRoutes against modelRoutes
  for (const [selector] of Object.entries(currentRoutes)) {
    if (currentRoutes[selector] == modelRoutes[selector]) continue;
    // selector was removed or its facet address was changed -> Not equal
    return false;
  }

  // 3) Check modelRoutes against currentRoutes
  for (const [selector] of Object.entries(modelRoutes)) {
    if (modelRoutes[selector] == currentRoutes[selector]) continue;
    // selector was removed or its facet address was changed -> Not equal
    return false;
  }

  // 4) If we went here it's because diamonds are equal
  return true;
}

export { ensureDiamondFacets, diamondEquals };
