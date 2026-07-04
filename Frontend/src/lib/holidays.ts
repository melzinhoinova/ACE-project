export type Escopo = "nacional" | "estadual" | "municipal";

export type Holiday = {
  id: string;
  data: string; // dd/mm/yyyy
  nome: string;
  tipo: string;
  escopo: Escopo;
  local?: string; // UF or "Cidade/UF"
};

const FALLBACK_NACIONAIS: Holiday[] = [
  { id: "n1", data: "01/01/2026", nome: "Confraternização Universal", tipo: "nacional", escopo: "nacional" },
  { id: "n2", data: "17/02/2026", nome: "Carnaval", tipo: "nacional", escopo: "nacional" },
  { id: "n3", data: "03/04/2026", nome: "Sexta-feira Santa", tipo: "nacional", escopo: "nacional" },
  { id: "n4", data: "21/04/2026", nome: "Tiradentes", tipo: "nacional", escopo: "nacional" },
  { id: "n5", data: "01/05/2026", nome: "Dia do Trabalho", tipo: "nacional", escopo: "nacional" },
  { id: "n6", data: "04/06/2026", nome: "Corpus Christi", tipo: "nacional", escopo: "nacional" },
  { id: "n7", data: "12/06/2026", nome: "Dia dos Namorados", tipo: "nacional", escopo: "nacional" },
  { id: "n8", data: "07/09/2026", nome: "Independência do Brasil", tipo: "nacional", escopo: "nacional" },
  { id: "n9", data: "12/10/2026", nome: "Nossa Senhora Aparecida", tipo: "nacional", escopo: "nacional" },
  { id: "n10", data: "02/11/2026", nome: "Finados", tipo: "nacional", escopo: "nacional" },
  { id: "n11", data: "15/11/2026", nome: "Proclamação da República", tipo: "nacional", escopo: "nacional" },
  { id: "n12", data: "25/12/2026", nome: "Natal", tipo: "nacional", escopo: "nacional" },
];

const FALLBACK_ESTADUAIS: Record<string, { data: string; nome: string }[]> = {
  SP: [{ data: "09/07/2026", nome: "Revolução Constitucionalista" }],
  RJ: [{ data: "23/04/2026", nome: "São Jorge" }],
  MG: [{ data: "21/04/2026", nome: "Data Magna de Minas Gerais" }],
  BA: [{ data: "02/07/2026", nome: "Independência da Bahia" }],
  RS: [{ data: "20/09/2026", nome: "Revolução Farroupilha" }],
  PE: [{ data: "06/03/2026", nome: "Revolução Pernambucana" }],
  CE: [{ data: "25/03/2026", nome: "Abolição da Escravidão no Ceará" }],
  PR: [{ data: "19/12/2026", nome: "Emancipação do Paraná" }],
  DF: [{ data: "21/04/2026", nome: "Fundação de Brasília" }],
  AM: [{ data: "05/09/2026", nome: "Elevação do Amazonas a Província" }],
};

const FALLBACK_MUNICIPAIS: Record<string, { data: string; nome: string }[]> = {
  "sao-paulo-SP": [{ data: "25/01/2026", nome: "Aniversário de São Paulo" }],
  "rio-de-janeiro-RJ": [
    { data: "20/01/2026", nome: "Dia de São Sebastião" },
    { data: "01/03/2026", nome: "Aniversário do Rio" },
  ],
  "belo-horizonte-MG": [{ data: "12/12/2026", nome: "Aniversário de Belo Horizonte" }],
  "salvador-BA": [{ data: "29/03/2026", nome: "Aniversário de Salvador" }],
  "porto-alegre-RS": [{ data: "26/03/2026", nome: "Aniversário de Porto Alegre" }],
  "recife-PE": [{ data: "12/03/2026", nome: "Aniversário de Recife" }],
  "fortaleza-CE": [{ data: "13/04/2026", nome: "Aniversário de Fortaleza" }],
  "curitiba-PR": [{ data: "29/03/2026", nome: "Aniversário de Curitiba" }],
  "brasilia-DF": [{ data: "21/04/2026", nome: "Aniversário de Brasília" }],
  "manaus-AM": [{ data: "24/10/2026", nome: "Aniversário de Manaus" }],
};

export const UF_LIST: { uf: string; nome: string }[] = [
  { uf: "SP", nome: "São Paulo" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "BA", nome: "Bahia" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "CE", nome: "Ceará" },
  { uf: "PR", nome: "Paraná" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "AM", nome: "Amazonas" },
];

export const CITIES_BY_UF: Record<string, { slug: string; nome: string }[]> = {
  SP: [
    { slug: "sao-paulo", nome: "São Paulo" },
    { slug: "campinas", nome: "Campinas" },
    { slug: "santos", nome: "Santos" },
  ],
  RJ: [
    { slug: "rio-de-janeiro", nome: "Rio de Janeiro" },
    { slug: "niteroi", nome: "Niterói" },
  ],
  MG: [
    { slug: "belo-horizonte", nome: "Belo Horizonte" },
    { slug: "uberlandia", nome: "Uberlândia" },
  ],
  BA: [
    { slug: "salvador", nome: "Salvador" },
    { slug: "feira-de-santana", nome: "Feira de Santana" },
  ],
  RS: [
    { slug: "porto-alegre", nome: "Porto Alegre" },
    { slug: "caxias-do-sul", nome: "Caxias do Sul" },
  ],
  PE: [
    { slug: "recife", nome: "Recife" },
    { slug: "olinda", nome: "Olinda" },
  ],
  CE: [{ slug: "fortaleza", nome: "Fortaleza" }],
  PR: [
    { slug: "curitiba", nome: "Curitiba" },
    { slug: "londrina", nome: "Londrina" },
  ],
  DF: [{ slug: "brasilia", nome: "Brasília" }],
  AM: [{ slug: "manaus", nome: "Manaus" }],
};

type NagerHoliday = {
  date: string; // yyyy-mm-dd
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
};

function toBrDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Fetches holidays from the Nager API (server-side). */
async function fetchNager(ano: number): Promise<NagerHoliday[] | null> {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${ano}/BR`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as NagerHoliday[];
  } catch {
    return null;
  }
}

/** Server-side function to get holidays for a given year + optional UF/city. */
export async function getHolidays(params: { ano: number; uf?: string; city?: string }) {
  const { ano, uf, city } = params;
  const out: Holiday[] = [];
  let error: string | null = null;

  const nager = await fetchNager(ano);

  if (nager && nager.length) {
    nager.forEach((h, i) => {
      const isNational = h.global || !h.counties || h.counties.length === 0;
      if (isNational) {
        out.push({
          id: `n${i}`,
          data: toBrDate(h.date),
          nome: h.localName || h.name,
          tipo: "nacional",
          escopo: "nacional",
        });
      } else if (uf && h.counties?.includes(`BR-${uf}`)) {
        out.push({
          id: `e${i}`,
          data: toBrDate(h.date),
          nome: h.localName || h.name,
          tipo: "estadual",
          escopo: "estadual",
          local: uf,
        });
      }
    });
  } else {
    error = "API Nager indisponível — usando fallback";
    out.push(...FALLBACK_NACIONAIS);
    if (uf) {
      (FALLBACK_ESTADUAIS[uf] ?? []).forEach((f, i) =>
        out.push({ id: `e${i}`, data: f.data, nome: f.nome, tipo: "estadual", escopo: "estadual", local: uf }),
      );
    }
  }

  // Municipais permanecem do mock (Nager não cobre cidades).
  if (uf && city) {
    const nome = CITIES_BY_UF[uf]?.find((c) => c.slug === city)?.nome ?? city;
    (FALLBACK_MUNICIPAIS[`${city}-${uf}`] ?? []).forEach((f, i) =>
      out.push({
        id: `m${i}`,
        data: f.data,
        nome: f.nome,
        tipo: "municipal",
        escopo: "municipal",
        local: `${nome}/${uf}`,
      }),
    );
  }

  return { holidays: out, error };
}
