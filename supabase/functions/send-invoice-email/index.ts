import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invoiceId, clientEmail, clientName, invoiceAmount, portalUrl } = await req.json()

    if (!invoiceId || !clientEmail) {
      return new Response(
        JSON.stringify({ error: 'invoiceId and clientEmail are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Update last_sent_at
    await supabase
      .from('invoices')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('id', invoiceId)

    // For now, log the email send (actual email delivery requires email domain setup)
    console.log(`Invoice email queued for ${clientEmail}`, {
      invoiceId,
      clientName,
      invoiceAmount,
      portalUrl,
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invoice notification logged for ${clientEmail}. Set up an email domain in Cloud → Emails to enable actual email delivery.`,
        last_sent_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
