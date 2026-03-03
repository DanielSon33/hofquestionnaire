/**
 * Supabase Edge Function: send-survey-email
 *
 * Sends a summary email via Resend after a customer submits their questionnaire.
 *
 * Required Supabase Secret (set via `supabase secrets set`):
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *
 * Invoke from client:
 *   supabase.functions.invoke('send-survey-email', { body: { customer_id: '...' } })
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const RECIPIENTS = ['hello@hof-studio.com']
// FROM_EMAIL: Entweder eine Domain die in Resend verifiziert ist,
// oder 'onboarding@resend.dev' zum Testen (sendet nur an verifizierte Resend-Accounts)
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { customer_id } = await req.json()
    if (!customer_id) throw new Error('customer_id fehlt')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Load customer
    const { data: customer, error: cErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single()
    if (cErr) throw cErr

    // Load submitted responses with question texts
    const { data: responses, error: rErr } = await supabase
      .from('responses')
      .select('value, question:question_id(text, sort_order)')
      .eq('customer_id', customer_id)
      .not('submitted_at', 'is', null)
      .order('question(sort_order)')
    if (rErr) throw rErr

    // Build HTML email
    const rows = (responses || [])
      .sort((a: any, b: any) => (a.question?.sort_order ?? 0) - (b.question?.sort_order ?? 0))
      .map(
        (r: any, i: number) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;color:#6b7280;font-size:13px;white-space:nowrap">
            ${i + 1}. ${r.question?.text ?? 'Frage'}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111827">
            ${r.value ? escapeHtml(r.value) : '<em style="color:#9ca3af">Keine Antwort</em>'}
          </td>
        </tr>`
      )
      .join('')

    const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Inter',system-ui,sans-serif">
  <div style="max-width:640px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <!-- Header -->
    <div style="background:#3d55e5;padding:28px 32px">
      <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7)">HOF Studio</p>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#fff">Fragebogen eingegangen</h1>
    </div>
    <!-- Meta -->
    <div style="padding:20px 32px;background:#f0f4ff;border-bottom:1px solid #e0eaff">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="font-size:12px;color:#6b7280;padding-bottom:4px">Kunde</td>
          <td style="font-size:13px;font-weight:600;color:#111827;padding-bottom:4px">${escapeHtml(customer.name)}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#6b7280">E-Mail</td>
          <td style="font-size:13px;color:#3d55e5">${escapeHtml(customer.email)}</td>
        </tr>
      </table>
    </div>
    <!-- Answers -->
    <div style="padding:24px 32px">
      <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.05em">Antworten</h2>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;overflow:hidden">
        ${rows || '<tr><td colspan="2" style="padding:16px;color:#9ca3af;font-size:13px">Keine Antworten vorhanden.</td></tr>'}
      </table>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">HOF Studio · Automatisch generierte E-Mail</p>
    </div>
  </div>
</body>
</html>`

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `HOF Studio Fragebogen <${FROM_EMAIL}>`,
        to: RECIPIENTS,
        reply_to: customer.email,
        subject: `Neuer Fragebogen von ${customer.name}`,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error('Resend API error:', err)
      throw new Error(`Resend error (${resendRes.status}): ${err}`)
    }

    const resendData = await resendRes.json()
    console.log('Email sent successfully:', resendData)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err: any) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
