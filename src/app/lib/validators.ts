// Validação de dígito verificador — não confirma que o documento existe/pertence a
// alguém, só que o número tem um formato matematicamente válido (evita erros de
// digitação óbvios). Verificação de duplicidade fica a cargo do backend/RLS, não é
// feita aqui (ver nota em AuthPage.tsx sobre por quê).

export function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return false;
  if (/^(\d)\1+$/.test(nums)) return false; // sequências repetidas (111.111.111-11 etc.)

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i], 10) * (10 - i);
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10 || digit1 === 11) digit1 = 0;
  if (digit1 !== parseInt(nums[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i], 10) * (11 - i);
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10 || digit2 === 11) digit2 = 0;
  return digit2 === parseInt(nums[10], 10);
}

export function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1+$/.test(nums)) return false;

  const calc = (n: string, weights: number[]) =>
    weights.reduce((acc, w, i) => acc + parseInt(n[i], 10) * w, 0);

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const r1 = calc(nums, w1) % 11;
  const d1 = r1 < 2 ? 0 : 11 - r1;
  if (d1 !== parseInt(nums[12], 10)) return false;

  const r2 = calc(nums, w2) % 11;
  const d2 = r2 < 2 ? 0 : 11 - r2;
  return d2 === parseInt(nums[13], 10);
}

// Valida CPF (11 dígitos) ou CNPJ (14 dígitos) — decide qual algoritmo usar pelo
// tamanho do número já sem máscara.
export function validarCpfCnpj(valor: string): boolean {
  const nums = valor.replace(/\D/g, '');
  if (nums.length === 11) return validarCPF(valor);
  if (nums.length === 14) return validarCNPJ(valor);
  return false;
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
