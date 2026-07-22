// Enter Pro의 자체 애널리틱스 SDK는 독립 배포(Vercel/GitHub 등) 환경에서는
// 사용하지 않으므로 아무 동작도 하지 않는 스텁으로 대체한다.
export function bootstrapGeneratedSiteAnalytics(): void {
  // no-op in standalone deployment
}
