import { useQuery } from "@tanstack/react-query";
import { fetchPracticeLetters } from "@/services/hangul-service";

export function usePracticeLetters() {
  return useQuery({
    queryKey: ["practice-letters"],
    queryFn: fetchPracticeLetters,
    staleTime: Number.POSITIVE_INFINITY
  });
}

