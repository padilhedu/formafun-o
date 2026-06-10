// Vindi API v1 — chamadas server-side only (chave nunca exposta no client)
const VINDI_BASE = process.env.VINDI_API_URL ?? 'https://app.vindi.com.br/api/v1';

function authHeader() {
  const key = process.env.VINDI_API_KEY;
  if (!key) throw new Error('VINDI_API_KEY ausente');
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64');
}

export function vindiConfigured() {
  return !!process.env.VINDI_API_KEY;
}

async function vindiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${VINDI_BASE}${path}`, {
    ...init,
    headers: {
      'Authorization': authHeader(),
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const json = await res.json() as T & { errors?: { id: string; parameter: string; message: string }[] };
  if (!res.ok) {
    const msg = json.errors?.map(e => `${e.parameter}: ${e.message}`).join('; ') ?? `Vindi HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

interface VindiCustomer { id: number; name: string; email: string | null; registry_code: string | null }

// Busca ou cria cliente Vindi para o paciente
export async function ensureVindiCustomer(paciente: {
  nome: string; cpf: string | null; email: string | null; telefone: string | null;
  vindi_customer_id: string | null;
}): Promise<number> {
  if (paciente.vindi_customer_id) return Number(paciente.vindi_customer_id);

  // Busca por CPF
  if (paciente.cpf) {
    const found = await vindiFetch<{ customers: VindiCustomer[] }>(
      `/customers?query=registry_code:${encodeURIComponent(paciente.cpf)}`
    );
    if (found.customers?.length) return found.customers[0].id;
  }

  const created = await vindiFetch<{ customer: VindiCustomer }>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: paciente.nome,
      email: paciente.email ?? undefined,
      registry_code: paciente.cpf ?? undefined,
      phones: paciente.telefone
        ? [{ phone_type: 'mobile', number: '55' + paciente.telefone.replace(/\D/g, '') }]
        : undefined,
    }),
  });
  return created.customer.id;
}

// Produto genérico para itens de cobrança (Vindi exige product_id em bill_items)
let cachedProductId: number | null = null;

async function ensureProduto(): Promise<number> {
  if (cachedProductId) return cachedProductId;

  const found = await vindiFetch<{ products: { id: number; name: string }[] }>(
    `/products?query=name:%22Servi%C3%A7os%20Odontol%C3%B3gicos%22`
  );
  if (found.products?.length) {
    cachedProductId = found.products[0].id;
    return cachedProductId;
  }

  const created = await vindiFetch<{ product: { id: number } }>('/products', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Serviços Odontológicos',
      pricing_schema: { price: 0, schema_type: 'per_unit' },
    }),
  });
  cachedProductId = created.product.id;
  return cachedProductId;
}

const FORMA_TO_VINDI: Record<string, string> = {
  pix: 'pix',
  cartao_credito: 'credit_card',
  boleto: 'bank_slip',
};

export interface VindiCobranca {
  bill_id: string;
  charge_id: string | null;
  url: string | null;
}

// Cria fatura avulsa (bill) e retorna link de pagamento
export async function criarCobrancaVindi(opts: {
  customerId: number;
  valor: number;
  descricao: string;
  formaPagamento: string;
  vencimento: string; // YYYY-MM-DD
}): Promise<VindiCobranca> {
  const productId = await ensureProduto();
  const paymentMethod = FORMA_TO_VINDI[opts.formaPagamento] ?? 'pix';

  const res = await vindiFetch<{
    bill: {
      id: number;
      url: string | null;
      charges: { id: number; print_url: string | null }[];
    };
  }>('/bills', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: opts.customerId,
      payment_method_code: paymentMethod,
      due_at: opts.vencimento,
      bill_items: [{ product_id: productId, amount: opts.valor, description: opts.descricao }],
    }),
  });

  const charge = res.bill.charges?.[0];
  return {
    bill_id: String(res.bill.id),
    charge_id: charge ? String(charge.id) : null,
    url: charge?.print_url ?? res.bill.url ?? null,
  };
}
