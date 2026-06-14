/**
 * Retorna o segredo HMAC usado para assinar/validar tokens de contrato.
 * Obrigatório: se a env var estiver ausente ou vazia, lança erro — nunca
 * cai num default vazio (que tornaria o HMAC forjável). Ver QA sec-06.
 */
export function getSigningSecret(): string {
  const secret = process.env.SIGNING_HMAC_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'SIGNING_HMAC_SECRET ausente ou vazio. Configure a variável de ambiente ' +
        'antes de gerar ou validar links de assinatura.'
    );
  }
  return secret;
}
