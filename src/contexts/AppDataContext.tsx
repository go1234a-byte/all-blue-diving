// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPayoutRow(row: any): Payout {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    bookingId: row.booking_id,
    firstAmount: Number(row.first_amount),
    secondAmount: Number(row.second_amount),
    status: row.status,
    // 원천징수 관련 컬럼은 payouts_directory 뷰에서 본인 강사/관리자에게만 값이 내려오고,
    // 그 외 열람자에게는 null로 마스킹되어 온다 (금액 필드와 동일한 보안 정책).
    withholdingTaxRate:
      row.withholding_tax_rate === null || row.withholding_tax_rate === undefined
        ? undefined
        : Number(row.withholding_tax_rate),
    withholdingTaxAmount:
      row.withholding_tax_amount === null || row.withholding_tax_amount === undefined
        ? undefined
        : Number(row.withholding_tax_amount),
    netPayoutAmount:
      row.net_payout_amount === null || row.net_payout_amount === undefined
        ? undefined
        : Number(row.net_payout_amount),
    businessTypeAtPayout: row.business_type_at_payout ?? null,
  };
}
