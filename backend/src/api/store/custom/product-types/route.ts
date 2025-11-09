import { HttpTypes, ProductTypeDTO } from '@medusajs/framework/types';
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductTypeListParams>,
  res: MedusaResponse,
) => {
  const query = req.scope.resolve("query");
  const remoteQueryConfig: { fields?: string[]; pagination?: any } = req.remoteQueryConfig ?? {};
  const fields = (remoteQueryConfig.fields ?? []) as (keyof ProductTypeDTO)[];
  const pagination = remoteQueryConfig.pagination ?? {};
  const filters = req.filterableFields ?? {};

  const { data: productTypes, metadata } = await query.graph({
    entity: "product_types",
    filters,
    fields,
    pagination,
  });

  res.status(200).json({
    product_types: productTypes,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? (pagination?.take ?? 0),
  });
};
