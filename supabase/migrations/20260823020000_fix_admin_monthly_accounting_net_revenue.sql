-- admin_monthly_accounting 뷰의 net_revenue 계산 오류 수정.
--
-- 기존: sum(platform_fee_amount) - sum(refund_amount)
-- refund_amount(고객에게 실제 환불된 금액)는 원금+수수료가 합쳐진 총 결제액(total_paid) 기준으로
-- 산정되는데, platform_fee_amount는 취소 여부와 무관하게 예약 시점 값으로 고정되어 있어 절대
-- 줄어들지 않는다. 그 결과 취소·환불이 있는 달은 환불액 전체가 고정된 수수료에서 그대로
-- 차감되어 net_revenue가 실제보다 훨씬 큰 폭의 손실로 계산된다.
-- (예: 30만원 투어를 50% 환불로 취소 → 실제 회사 순익은 수수료의 절반인 15,000원인데,
--  기존 식은 30,000 - 165,000 = -135,000으로 계산해버림.)
--
-- instructor_amount(invoices)는 취소 시 cancel_booking_settlement가 이미 잔여 비율로
-- 비례 축소해서 반영해두므로, "총 결제액 - 환불액 - 강사 정산액"으로 계산하면 취소 유무와
-- 관계없이 회사가 실제로 보유하게 되는 순수익이 정확히 나온다.
create or replace view public.admin_monthly_accounting as
select
  date_trunc('month', period)::date as period,
  count(*) as booking_count,
  sum(gmv_amount) as gmv,
  sum(platform_fee_amount) as platform_fee_revenue,
  sum(refund_amount) as refund_amount,
  sum(gmv_amount) - sum(refund_amount) - sum(instructor_amount) as net_revenue,
  sum(instructor_amount) as instructor_payout_total
from invoices
group by (date_trunc('month', period)::date);
