import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Policy, PolicyCategory } from "@/types";

interface UsePoliciesResult {
  policies: Policy[];
  loading: boolean;
  getByCategory: (category: PolicyCategory) => Policy[];
}

/**
 * Enter Cloud(Supabase) `policies` 테이블에서 환불/위반/제재 정책을 조회하는 훅.
 */
export function usePolicies(): UsePoliciesResult {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });

      if (!active) return;
      if (!error && data) {
        setPolicies(
          data.map((row) => ({
            id: row.id,
            category: row.category as PolicyCategory,
            sortOrder: row.sort_order,
            title: row.title,
            description: row.description,
            rate: row.rate,
          })),
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const getByCategory = (category: PolicyCategory) =>
    policies.filter((p) => p.category === category);

  return { policies, loading, getByCategory };
}
