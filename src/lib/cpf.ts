export function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 || r === 11 ? 0 : r;
  };

  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export function mascararCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `***.***.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatarCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
