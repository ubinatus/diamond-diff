export enum FacetCutAction {
  Add = 0,
  Replace = 1,
  Remove = 2,
}

export interface FacetStruct {
  /** Facet contract address that expose (external/public) the `functionSelectors` */
  facetAddress: string;
  /** Function selectors as bytes4 */
  functionSelectors: string[];
}

export interface FacetCutStruct extends FacetStruct {
  /** Action to do on the Diamond: Add=0, Replace=1, Remove=2 */
  action: FacetCutAction;
}

export type ValidationError = {
  /** Path of the encountered error */
  path: string;
  /** User-facing message */
  message: string;
  /** Internal error message */
  type: string;
};
