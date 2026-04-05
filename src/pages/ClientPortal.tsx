import React, { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  seedEvents, seedClients, seedInvoices,
} from "@/lib/seedData";
import type { Client, Task } from "@/types";
import { ClientPortalView, PortalLogin } from "@/views/ClientPortalView";

export function ClientPortalPage() {
  const [events] = useLocalStorage("events_v5", seedEvents);
  const [clients] = useLocalStorage("clients_v5", seedClients);
  const [invoices] = useLocalStorage("invoices_v5", seedInvoices);
  const [tasks] = useLocalStorage<Task[]>("tasks_v5", () => []);
  const [portalClient, setPortalClient] = useState<Client | null>(null);

  if (!portalClient) {
    return <PortalLogin clients={clients} onLogin={setPortalClient} />;
  }

  return (
    <ClientPortalView
      client={portalClient}
      events={events}
      invoices={invoices}
      tasks={tasks}
      onLogout={() => setPortalClient(null)}
    />
  );
}
