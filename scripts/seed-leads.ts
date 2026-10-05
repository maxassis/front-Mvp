/**
 * Semeia instancia, conversa, lead e mensagens direto no banco para que a tela
 * de leads possa ser verificada com dados reais. Lead nasce do webhook do
 * WhatsApp, entao nao ha como produzi-lo so pela API.
 *
 *   bun scripts/seed-leads.ts <email-do-usuario>
 */
import postgres from 'postgres'

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/postgres'

const sql = postgres(DATABASE_URL, { max: 1 })

const CHAT_ID = '5511990000001@c.us'

const [email] = process.argv.slice(2)
if (!email) {
  process.stderr.write('uso: bun scripts/seed-leads.ts <email-do-usuario>\n')
  process.exit(1)
}

const SEED_MESSAGES = [
  { direction: 'inbound', minutesAgo: 90, text: 'Ola, voces abrem sabado?' },
  { direction: 'outbound', minutesAgo: 88, text: 'Ola Maria! Abrimos das 9 as 18h de sabado.' },
  { direction: 'inbound', minutesAgo: 12, text: 'Perfeito. Quero cortar o cabelo as 14h.' }
]

const run = async () => {
  const [user] = await sql`select id from users where email = ${email} limit 1`
  if (!user) {
    throw new Error(`usuario ${email} nao encontrado`)
  }

  const [instance] = await sql`
    select id, instance_name, provider_instance_id from whatsapp_instances
    where user_id = ${user.id} order by created_at desc limit 1
  `
  if (!instance) {
    throw new Error('este usuario nao tem instancia; rode o fluxo de conectar antes')
  }

  const [found] = await sql`
    select id from conversations where whatsapp_instance_id = ${instance.id} and chat_id = ${CHAT_ID}
  `

  const conversationId = found?.id ?? crypto.randomUUID()
  if (!found) {
    await sql`
      insert into conversations (id, channel, provider, instance_id, whatsapp_instance_id,
                                chat_id, chat_type, user_id, status, created_at, updated_at)
      values (${conversationId}, 'whatsapp', 'waha', ${instance.provider_instance_id},
              ${instance.id}, ${CHAT_ID}, 'user', ${user.id}, 'open', now(), now())
    `
  }

  const [lead] = await sql`
    select id from leads where conversation_id = ${conversationId} limit 1
  `

  const leadId = lead?.id ?? crypto.randomUUID()
  if (!lead) {
    await sql`
      insert into leads (id, user_id, instance_id, conversation_id, customer_chat_id,
                        customer_name, customer_phone, interest, status,
                        created_at, updated_at)
      values (${leadId}, ${user.id}, ${instance.id}, ${conversationId}, ${CHAT_ID},
              'Maria Souza', '5511990000001', 'Corte de cabelo', 'new',
              now() - interval '2 hours', now() - interval '5 minutes')
    `
  }

  const [messageCount] = await sql`
    select count(*)::int as total from messages where conversation_id = ${conversationId}
  `

  if (!messageCount || messageCount.total === 0) {
    for (const message of SEED_MESSAGES) {
      await sql`
        insert into messages (id, conversation_id, channel, provider, provider_message_id,
                              instance_id, whatsapp_instance_id, chat_id, user_id, direction,
                              message_type, text, author, status, raw_payload,
                              received_at, created_at)
        values (${crypto.randomUUID()}, ${conversationId}, 'whatsapp', 'waha',
                ${`seed-${crypto.randomUUID()}`}, ${instance.provider_instance_id},
                ${instance.id}, ${CHAT_ID}, ${user.id},
                ${message.direction}, 'text', ${message.text},
                ${message.direction === 'inbound' ? 'customer' : 'bot'},
                'received', '{}'::jsonb,
                now() - (${message.minutesAgo} * interval '1 minute'), now())
      `
    }
  }

  process.stdout.write(`${JSON.stringify({ conversationId, instanceId: instance.id, leadId })}\n`)
}

try {
  await run()
} finally {
  await sql.end()
}