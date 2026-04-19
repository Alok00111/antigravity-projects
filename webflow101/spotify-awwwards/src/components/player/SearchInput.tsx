"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => {
        if (query) {
          router.push(`/web-player/search?q=${encodeURIComponent(query)}`);
        } else {
          router.push(`/web-player/search`);
        }
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [query, router]);

  return (
    <div className="relative w-full max-w-md group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 transition-colors ${isPending ? 'text-white animate-pulse' : 'text-muted-foreground group-focus-within:text-white'}`} />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-10 py-3 bg-white/10 border border-transparent rounded-full text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all font-medium"
        placeholder="What do you want to listen to?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
