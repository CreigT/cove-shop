"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ClaimAccess({
  sessionId,
  slug,
}: {
  sessionId?: string;
  slug?: string;
}) {
  const [ready, setReady] = useState(!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [sessionId]);

  return (
    <div className="row">
      <Link className="btn" href="/library">
        {ready ? "Open the library" : "Unlocking…"}
      </Link>
      {slug === "care-pass" ? (
        <Link className="btn ghost" href="/help">
          Go to help
        </Link>
      ) : null}
    </div>
  );
}
