import type { BusinessType } from '@/api/types'

export interface SetBusinessTypeInput {
  businessType: BusinessType
  businessTypeLabel?: string
}

/**
 * Corpo do PATCH de segmento. O texto livre so entra quando tem conteudo util;
 * a categoria `outros` exige ele, mas essa regra fica no dialog e no backend.
 *
 * Sem import de runtime (`@/api/types` e type-only) para o `bun test` carregar
 * este modulo sozinho, como o catalog.ts faz.
 */
export const buildSetBusinessTypeBody = (
  input: SetBusinessTypeInput
): { business_type: BusinessType; business_type_label?: string } => {
  const label = input.businessTypeLabel?.trim()
  return label
    ? { business_type: input.businessType, business_type_label: label }
    : { business_type: input.businessType }
}
