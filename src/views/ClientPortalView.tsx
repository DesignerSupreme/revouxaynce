import React from "react";
import { usePortalData } from "@/hooks/usePortalData";
import { PortalLogin } from "@/views/portal/PortalLogin";
import { PortalEventList } from "@/views/portal/PortalEventList";
import { PortalInvoiceTable } from "@/views/portal/PortalInvoices";
import { PortalMoodBoards } from "@/views/portal/PortalMoodBoards";
import logo from "@/assets/revouxaynce-logo.svg";
import { SkeletonLines, SkeletonTable } from "@/components/app/Skeleton";

export function ClientPortalView({ token }: { token: string | null }) {
  const { client, events, invoices, loading, denied, updateInvoiceStatus } = usePortalData(token);

  if (!token) return <PortalLogin />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <SkeletonLines lines={2} label="Loading your events" />
          <SkeletonTable rows={4} cols={4} label="Loading your events" />
        </div>
      </div>
    );
  }

  if (denied || !client) return <PortalLogin invalid />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <img src={logo} alt="Revouxaynce" className="h-8 w-auto" />
          <span className="text-sm font-sans text-muted-foreground truncate">{client.name}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl mb-1">Your events</h1>
        <p className="text-sm text-muted-foreground font-sans mb-8">
          Review your events, quotations and invoices.
        </p>

        <PortalEventList events={events} invoices={invoices} client={client} onUpdateStatus={updateInvoiceStatus} />
        <PortalMoodBoards token={token} events={events} />
        <PortalInvoiceTable invoices={invoices} events={events} client={client} />

        <div className="mt-12 pt-6 border-t border-input text-center">
          <p className="text-xs text-muted-foreground font-sans">Powered by Revouxaynce · Premium Event Management</p>
        </div>
      </div>
    </div>
  );
}
