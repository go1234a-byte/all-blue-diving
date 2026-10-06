import { supabase } from "@/integrations/supabase/client";

// 알림·준비물 테이블은 아직 src/integrations/supabase/types.ts에 없다(마이그레이션 미적용).
// 로컬 DB에 적용하고 `supabase gen types --local`로 types.ts를 다시 만들면 이 어댑터를 지우고
// 타입이 붙은 supabase.from()을 그대로 쓴다. types.ts는 손으로 고치지 않는다.
export interface QueryError {
  message: string;
}
export interface QueryBuilder extends PromiseLike<{ data: unknown; error: QueryError | null }> {
  select(columns?: string): QueryBuilder;
  eq(column: string, value: unknown): QueryBuilder;
  order(column: string, options: { ascending: boolean }): QueryBuilder;
  limit(count: number): QueryBuilder;
  insert(row: unknown): QueryBuilder;
  update(patch: unknown): QueryBuilder;
  upsert(row: unknown, options: { onConflict: string }): QueryBuilder;
  delete(): QueryBuilder;
}

export const untypedClient = supabase as unknown as { from(table: string): QueryBuilder };

export async function run<T>(builder: PromiseLike<{ data: unknown; error: QueryError | null }>): Promise<T> {
  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return data as T;
}
