export interface ApiStrategy {
  addApi(param: any): Promise<any>;
  delApi(param: any): Promise<any>;
  updateApi: (param: any) => Promise<any>;
}
