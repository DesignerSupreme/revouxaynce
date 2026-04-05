import React, { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  seedEvents, seedClients, seedInvoices,
} from "@/lib/seedData";
import type { Client, Task } from "@/types";
import { ClientPortalView, PortalLogin } from "@/views/ClientPortalView";

export function ClientPortalPage() {
  const [events] = useLocalStorage("events_v3", seedEvents);
  const [clients] = useLocalStorage("clients_v3", seedClients);
  const [invoices] = useLocalStorage("invoices_v3", seedInvoices);
  const [tasks] = useLocalStorage<Task[]>("tasks_v3", () => []);
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
