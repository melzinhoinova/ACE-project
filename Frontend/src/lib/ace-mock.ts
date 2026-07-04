export const ACE_USER = {
  name: "Rafael Mendes",
  firstName: "Rafael",
  company: "Grupo Nexus Vendas",
  today: "16/05/2026",
};

export const OPPORTUNITIES = [
  {
    id: "namorados",
    name: "Dia dos Namorados",
    date: "12 Jun",
    fullDate: "12/06/2026",
    score: 94,
    emoji: "💕",
    hot: true,
  },
  {
    id: "pais",
    name: "Dia dos Pais",
    date: "09 Ago",
    fullDate: "09/08/2026",
    score: 78,
    emoji: "👔",
    hot: false,
  },
  {
    id: "blackfriday",
    name: "Black Friday",
    date: "27 Nov",
    fullDate: "27/11/2026",
    score: 91,
    emoji: "🛍️",
    hot: false,
  },
];

export const CAMPAIGN_VARIANTS = [
  {
    id: "v1",
    headline: "Surpreenda quem você ama.",
    copy: "Surpreenda quem você ama. Desconto especial de 20% só até 12/06. Use o cupom: AMOR20",
    art: {
      bg: "linear-gradient(135deg, #ff5e9c 0%, #7B2FBE 60%, #2F6FBE 100%)",
      icon: "💞",
      tag: "Dia dos Namorados",
    },
    discount: "20% OFF",
    coupon: "AMOR20",
  },
  {
    id: "v2",
    headline: "O amor merece um presente à altura.",
    copy: "O amor merece um presente à altura. Aproveite 20% OFF em qualquer pedido até 12/06 com o cupom AMOR20.",
    art: {
      bg: "linear-gradient(135deg, #2F6FBE 0%, #7B2FBE 50%, #ff5e9c 100%)",
      icon: "🌹",
      tag: "Edição Limitada — 12.06",
    },
    discount: "20% OFF",
    coupon: "AMOR20",
  },
];

export const SCORE_COLOR = (s: number) =>
  s >= 80 ? "success" : s >= 60 ? "warning" : "danger";

export const DEFAULT_HOLIDAY = {
  id: "n7",
  nome: "Dia dos Namorados",
  data: "12/06/2026",
  score: 94,
  audience: 1240,
  ticket: "R$ 387",
  coupon: "AMOR20",
  channels: ["Instagram", "WhatsApp"],
  daysAway: 3,
};

export type HolidayTheme = {
  icon: string;
  bg: string;
  tag: string;
  headlines: string[];
  copies: string[];
  coupon: string;
  discount: string;
};

export const HOLIDAY_THEMES: Record<string, HolidayTheme> = {
  "Dia dos Namorados": {
    icon: "💞",
    bg: "linear-gradient(135deg, #ff5e9c 0%, #7B2FBE 60%, #2F6FBE 100%)",
    tag: "Especial Dia dos Namorados",
    headlines: [
      "Surpreenda quem você ama.",
      "O amor merece um presente à altura.",
      "Celebre o amor com presentes incríveis.",
    ],
    copies: [
      "Surpreenda quem você ama. Desconto especial de 20% só até {date}. Use o cupom: {coupon}",
      "O amor merece um presente à altura. Aproveite 20% OFF em qualquer pedido até {date} com o cupom {coupon}.",
      "Declare seu carinho! Garanta o presente perfeito com 20% de desconto usando o cupom {coupon} até {date}.",
    ],
    coupon: "AMOR20",
    discount: "20% OFF",
  },
  Natal: {
    icon: "🎄",
    bg: "linear-gradient(135deg, #b91c1c 0%, #15803d 60%, #a16207 100%)",
    tag: "Magia de Natal",
    headlines: [
      "O melhor presente de Natal está aqui.",
      "Celebre a magia do Natal com descontos.",
      "Presentes inesquecíveis para quem você ama.",
    ],
    copies: [
      "O melhor presente de Natal está aqui! Faça suas compras de fim de ano com 25% de desconto usando o cupom {coupon} até {date}.",
      "Espalhe a magia do Natal! Presenteie quem você ama com condições especiais e 25% OFF usando {coupon}.",
      "Natal é tempo de presentear. Antecipe suas compras de Natal com 25% de desconto aplicando o cupom {coupon}.",
    ],
    coupon: "NATAL25",
    discount: "25% OFF",
  },
  "Confraternização Universal": {
    icon: "✨",
    bg: "linear-gradient(135deg, #a16207 0%, #1e1b4b 60%, #4338ca 100%)",
    tag: "Ano Novo, Vida Nova",
    headlines: ["Comece o ano com tudo!", "Novas metas, novas conquistas.", "Um brinde ao novo ano!"],
    copies: [
      "Comece o ano novo com o pé direito! Aproveite nosso cupom exclusivo {coupon} para obter {discount} em todo o site.",
      "Novas oportunidades e novos começos! Garanta {discount} especial para renovar suas escolhas usando o cupom {coupon}.",
      "Feliz Ano Novo! Celebre as primeiras conquistas de 2026 com {discount} na sua primeira compra com o cupom {coupon}.",
    ],
    coupon: "ANO26",
    discount: "15% OFF",
  },
  Carnaval: {
    icon: "🎭",
    bg: "linear-gradient(135deg, #facc15 0%, #ca8a04 30%, #db2777 70%, #9333ea 100%)",
    tag: "Folia de Ofertas",
    headlines: ["Entre no ritmo da folia!", "Ofertas para pular de alegria.", "Bloquinho de descontos imperdíveis!"],
    copies: [
      "Entre no ritmo da folia! Garanta já {discount} em nossa loja para curtir o Carnaval com o cupom {coupon}.",
      "Ofertas que dão samba! Aproveite o Carnaval com {discount} especial em toda a linha de produtos usando {coupon}.",
      "O bloquinho do desconto já passou na nossa loja! Use o cupom {coupon} e garanta {discount} na sua folia até {date}.",
    ],
    coupon: "FOLIA15",
    discount: "15% OFF",
  },
  Tiradentes: {
    icon: "🛡️",
    bg: "linear-gradient(135deg, #1e3a8a 0%, #0d9488 60%, #111827 100%)",
    tag: "Feriado Tiradentes",
    headlines: [
      "Liberdade para escolher o melhor.",
      "Conquiste mais neste feriado.",
      "Aproveite a folga com ofertas especiais.",
    ],
    copies: [
      "Aproveite a liberdade de comprar o que você sempre quis com {discount} especial usando o cupom {coupon} neste feriado.",
      "Feriado combina com desconto! Garanta {discount} em nosso site usando o cupom {coupon} até {date}.",
      "Comemore o dia de Tiradentes garantindo os melhores produtos com {discount} off. Digite o cupom {coupon}.",
    ],
    coupon: "TIRA10",
    discount: "10% OFF",
  },
  "Dia do Trabalho": {
    icon: "💼",
    bg: "linear-gradient(135deg, #0f172a 0%, #2563eb 60%, #3b82f6 100%)",
    tag: "Dia do Trabalhador",
    headlines: ["Você merece essa recompensa.", "Obrigado pela sua dedicação!", "Celebre o seu dia com ofertas."],
    copies: [
      "Um descanso merecido com as melhores ofertas! Aproveite {discount} especial usando o cupom {coupon} até {date}.",
      "Obrigado por todo o esforço diário! Para comemorar o Dia do Trabalho, leve {discount} OFF usando o cupom {coupon}.",
      "Você trabalha duro o ano todo, hoje é dia de se presentear! Use o cupom {coupon} para obter {discount} em toda a loja.",
    ],
    coupon: "TRAB15",
    discount: "15% OFF",
  },
  "Independência do Brasil": {
    icon: "🇧🇷",
    bg: "linear-gradient(135deg, #15803d 0%, #eab308 50%, #1d4ed8 100%)",
    tag: "Independência do Brasil",
    headlines: ["Independência e ótimas escolhas.", "Orgulho de ser brasileiro.", "Grito de independência nas compras!"],
    copies: [
      "Independência de verdade é poder comprar com economia! Use o cupom {coupon} e tenha {discount} até {date}.",
      "Grite 'Independência!' para os preços altos! Aproveite a semana da pátria com {discount} usando o cupom {coupon}.",
      "Celebre o 7 de setembro com orgulho e descontos incríveis. Garanta {discount} aplicando o cupom {coupon}.",
    ],
    coupon: "BR07",
    discount: "15% OFF",
  },
  "Nossa Senhora Aparecida": {
    icon: "⛪",
    bg: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #93c5fd 100%)",
    tag: "Dia de Nossa Senhora",
    headlines: [
      "Dia das Crianças e de Bênçãos.",
      "Celebre com quem você mais ama.",
      "Momentos especiais e ofertas de fé.",
    ],
    copies: [
      "Comemore o dia de Nossa Senhora Aparecida e o Dia das Crianças com {discount} especial usando o cupom {coupon}.",
      "Feriado iluminado e com descontos! Garanta o presente da garotada e celebre com {discount} off usando {coupon}.",
      "Um dia de proteção, alegria e ótimas compras! Aproveite {discount} na loja toda usando o cupom {coupon} até {date}.",
    ],
    coupon: "FE12",
    discount: "12% OFF",
  },
  "Proclamação da República": {
    icon: "🏛️",
    bg: "linear-gradient(135deg, #166534 0%, #15803d 50%, #1e293b 100%)",
    tag: "Proclamação da República",
    headlines: ["Aproveite o feriado com ofertas.", "Sua liberdade de economizar.", "Descontos imperdíveis da República."],
    copies: [
      "Aproveite a Proclamação da República para renovar seus favoritos com {discount} usando o cupom {coupon} até {date}.",
      "Feriado nacional de economia! Garanta {discount} especial em nossa loja utilizando o cupom {coupon}.",
      "Celebre a República com descontos autônomos! Compre com {discount} usando o cupom {coupon} hoje mesmo.",
    ],
    coupon: "REP15",
    discount: "15% OFF",
  },
  "Sexta-feira Santa": {
    icon: "🕊️",
    bg: "linear-gradient(135deg, #64748b 0%, #475569 50%, #0f172a 100%)",
    tag: "Especial de Páscoa",
    headlines: ["Renovação e momentos em família.", "Uma Páscoa mais doce para você.", "Celebre a união com presentes."],
    copies: [
      "Tempo de reflexão e união familiar. Torne sua Páscoa ainda mais especial com {discount} usando o cupom {coupon}.",
      "Uma Páscoa de descontos e ovos de chocolate! Aproveite {discount} off usando o cupom {coupon} até {date}.",
      "Que tal presentear a família toda nesta Sexta-feira Santa? Use o cupom {coupon} e garanta {discount} de desconto.",
    ],
    coupon: "PASCOA20",
    discount: "20% OFF",
  },
  "Corpus Christi": {
    icon: "🥖",
    bg: "linear-gradient(135deg, #78350f 0%, #451a03 50%, #1e1b4b 100%)",
    tag: "Feriado Corpus Christi",
    headlines: [
      "Aproveite o feriadão em grande estilo.",
      "Ofertas selecionadas para o feriado.",
      "Descanse e compre com economia.",
    ],
    copies: [
      "Feriado prolongado merece compras inteligentes! Use o cupom {coupon} e garanta {discount} off em todo o site.",
      "Aproveite a folga de Corpus Christi para escolher o melhor para você! Compre com {discount} usando o cupom {coupon}.",
      "Oportunidades especiais de Corpus Christi! Aproveite {discount} em nossa loja usando o cupom {coupon} até {date}.",
    ],
    coupon: "CC10",
    discount: "10% OFF",
  },
};

export const FALLBACK_THEME: HolidayTheme = {
  icon: "🎉",
  bg: "linear-gradient(135deg, #7B2FBE 0%, #2F6FBE 50%, #000 100%)",
  tag: "Oportunidade Especial",
  headlines: ["Ofertas especiais de feriado!", "Celebre esta data com a gente.", "Presenteie-se neste dia especial."],
  copies: [
    "Aproveite o feriado de {name} com condições incríveis! Use o cupom {coupon} para ter {discount} em todo o site.",
    "Para comemorar a data de {name}, preparamos {discount} especial para você. Insira o cupom {coupon} na finalização.",
    "Celebre {name} com estilo! Garanta {discount} de desconto em suas compras usando o cupom {coupon} até {date}.",
  ],
  coupon: "PROMO15",
  discount: "15% OFF",
};

export function generateCampaignVariants(currentHoliday: any) {
  if (!currentHoliday) return CAMPAIGN_VARIANTS;

  const theme = HOLIDAY_THEMES[currentHoliday.nome] || {
    ...FALLBACK_THEME,
    tag: currentHoliday.nome,
    coupon: currentHoliday.coupon || `PROMO${currentHoliday.score || 15}`,
    discount: `${currentHoliday.coupon ? (currentHoliday.coupon.match(/\d+/) ? currentHoliday.coupon.match(/\d+/)[0] + "%" : "15%") : "15%"} OFF`,
  };

  const coupon = currentHoliday.coupon || theme.coupon || "PROMO15";
  const discountMatch = coupon.match(/\d+/);
  const discount = discountMatch ? `${discountMatch[0]}% OFF` : theme.discount || "15% OFF";

  const headlinesList = theme.headlines.length ? theme.headlines : FALLBACK_THEME.headlines;

  return headlinesList.map((headlineText, i) => {
    const rawCopy = theme.copies[i] || theme.copies[0] || FALLBACK_THEME.copies[0];
    const parsedCopy = rawCopy
      .replace(/{name}/g, currentHoliday.nome)
      .replace(/{date}/g, currentHoliday.data)
      .replace(/{coupon}/g, coupon)
      .replace(/{discount}/g, discount);

    return {
      id: `v${i + 1}`,
      headline: headlineText,
      copy: parsedCopy,
      art: {
        bg: theme.bg,
        icon: theme.icon,
        tag: theme.tag,
      },
      discount,
      coupon,
    };
  });
}
