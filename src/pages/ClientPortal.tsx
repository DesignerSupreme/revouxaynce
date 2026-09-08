import React, { useState } from "react";
import { readPortalToken } from "@/lib/portalClient";
import { ClientPortalView } from "@/views/ClientPortalView";

export function ClientPortalPage() {
  const [token] = useState<string | null>(() => readPortalToken());
  return <ClientPortalView token={token} />;
}
