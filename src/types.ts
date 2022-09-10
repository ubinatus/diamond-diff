export enum FacetCutAction {
  Add = 0,
  Replace = 1,
  Remove = 2,
}

export interface FacetStruct {
  facetAddress: string;
  functionSelectors: string[];
}

export interface FacetCutStruct extends FacetStruct {
  action: FacetCutAction;
}