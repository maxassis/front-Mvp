import { describe, expect, it } from 'bun:test'

import { buildSetBusinessTypeBody } from './business-type'

describe('buildSetBusinessTypeBody', () => {
  it('inclui o texto livre quando informado', () => {
    expect(
      buildSetBusinessTypeBody({ businessType: 'outros', businessTypeLabel: '  Petshop  ' })
    ).toEqual({ business_type: 'outros', business_type_label: 'Petshop' })
  })

  it('omite o texto livre quando so tem espacos', () => {
    expect(
      buildSetBusinessTypeBody({ businessType: 'beleza', businessTypeLabel: '   ' })
    ).toEqual({ business_type: 'beleza' })
  })

  it('omite o texto livre quando ausente', () => {
    expect(buildSetBusinessTypeBody({ businessType: 'alimentacao' })).toEqual({
      business_type: 'alimentacao'
    })
  })
})
