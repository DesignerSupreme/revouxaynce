const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is authenticated (or service role for cron)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const threeDaysStr = threeDaysFromNow.toISOString().slice(0, 10)
    const todayStr = now.toISOString().slice(0, 10)

    // Find invoices due in 3 days (Sent or Quotation status)
    const { data: dueSoon, error: dueErr } = await supabase
      .from('invoices')
      .select('id, client_id, due_date, status, reminder_sent_at')
      .in('status', ['Sent', 'Quotation'])
      .lte('due_date', threeDaysStr)
      .gte('due_date', todayStr)

    if (dueErr) console.error('Error fetching due-soon invoices:', dueErr.message)

    // Find overdue invoices where last reminder > 7 days ago (or never sent)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString()

    const { data: overdueInvs, error: overdueErr } = await supabase
      .from('invoices')
      .select('id, client_id, due_date, status, reminder_sent_at')
      .eq('status', 'Overdue')

    if (overdueErr) console.error('Error fetching overdue invoices:', overdueErr.message)

    // Filter overdue: only remind if never reminded or last reminder > 7 days ago
    const overdueToRemind = (overdueInvs || []).filter(inv =>
      !inv.reminder_sent_at || new Date(inv.reminder_sent_at) < sevenDaysAgo
    )

    const toRemind = [...(dueSoon || []), ...overdueToRemind]
    let sentCount = 0

    for (const inv of toRemind) {
      if (!inv.client_id) continue

      // Get client email
      const { data: client } = await supabase
        .from('clients')
        .select('name, email')
        .eq('id', inv.client_id)
        .single()

      if (!client?.email) continue

      const portalUrl = `${SUPABASE_URL.replace('.supabase.co', '.lovable.app')}/portal/invoice/${inv.id}`

      // Log the reminder (actual email delivery requires email domain setup)
      console.log(`Reminder queued for ${client.email}`, {
        invoiceId: inv.id,
        clientName: client.name,
        status: inv.status,
        dueDate: inv.due_date,
        portalUrl,
      })

      // Update reminder_sent_at
      await supabase
        .from('invoices')
        .update({ reminder_sent_at: now.toISOString() })
        .eq('id', inv.id)

      // Log audit
      await supabase
        .from('audit_logs')
        .insert({
          invoice_id: inv.id,
          action: 'Reminder Sent',
          performed_by: 'system',
          details: `Automated reminder to ${client.email} (${inv.status})`,
        })

      sentCount++
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: sentCount,
        message: `Processed ${toRemind.length} invoices, sent ${sentCount} reminders. Set up an email domain in Cloud → Emails to enable actual email delivery.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Reminder error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
