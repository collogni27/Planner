# Identidade visual (base aprovada)

**Direção:** "limpo com detalhe de pixel". Interface limpa e legível. O pixel aparece no mascote, nos ícones, nos números e em detalhes (como o medidor de sono). Evitar a estética genérica de IA: nada de degradês, glassmorphism, emojis como ícones, sombras difusas ou cantos exageradamente arredondados.

**Referência visual:** `docs/design/referencia-tela-inicio.html` (abrir no navegador). Mostra a tela Início nos modos claro, escuro e foco, mais a barra do mascote recolhida. É estática: as regras deste arquivo valem mais que ela.

## Tipografia
**Apenas duas fontes**, empacotadas no app (funcionam offline):
- **DotGothic16** (pixel) para o **texto grande**: saudação do mascote, números grandes (horas de sono, treinos feitos), valores de destaque (qualidade, peso, encaixes) e a marca "Planner".
- **JetBrains Mono** para **todo o resto**: texto, títulos de blocos, botões, rótulos, horários. Texto pequeno que precisa de destaque usa **JetBrains Mono em negrito (700)**.
- **Nunca usar itálico.** Nunca usar a fonte pixel em texto corrido ou pequeno.
- JetBrains Mono é larga: textos longos em linha única usam reticências (`text-overflow: ellipsis`) em vez de quebrar o layout.

## Textos da interface (2026-11-19)
- **Enxutos.** Nada de textinhos explicativos sob itens de menu ("Colar texto ou escolher arquivo" sob "Importar cards"), exemplos em campos ("ex.: Matemática"), legendas óbvias ou instruções que o próprio elemento já deixa claras. Esse estilo parece "texto de IA" e o usuário não gosta.
- Permitidos: textos **necessários** (ex.: "Anotação (opcional)", o que acontece ao apagar algo), informações reais em subtítulos (ex.: "Próximo: Função do 1º grau", "12 cards") e notas temporárias de construção.
- Ajuda extensa fica **escondida** atrás de um botão **"?"**, que abre e fecha como a barra do mascote (fechada por padrão).

## Caixas de diálogo e listas de escolha (2026-11-19)
- **Nunca** usar as caixas do navegador ou do sistema (`confirm`, `prompt`, `alert`, `<select>` nativo). Tudo é uma caixa própria do app, por cima da tela (`src/ui/dialogos.tsx`): `confirmar`, `pedirTexto` e o componente `Seletor`.
- Confirmação de ação perigosa: botão de confirmar em **amarelo**; o "Cancelar" ao lado.
- O "voltar" do Android fecha a caixa aberta antes de mudar de tela.
- Inevitáveis (do sistema): escolher arquivo, menu Compartilhar, download e instalação do APK.

## Formas (iguais nos três modos)
- Cards com borda de 2px, raio de 8px, sem sombra. Elementos internos com raio de 6px.
- Checkboxes quadradas (raio 3px).
- Ícones em pixel art num grid de 16×16, preenchimento sólido.
- Alvos de toque com no mínimo 44px.

## Modos de cor (tokens principais)
| Token | Claro | Escuro | Foco |
|---|---|---|---|
| fundo | `#F1FAFA` | `#102A2F` | `#131718` |
| superfície (cards) | `#FFFFFF` | `#173840` | `#1D2223` |
| borda dos cards | `#D3E7E6` | `#22474E` | `#2A3133` |
| texto | `#102A2F` | `#F1FAFA` | `#EAF1F0` |
| texto secundário | `#4A6669` | `#9DBDBF` | `#9AA9A8` |
| ação principal | `#0A7A73` | `#5FE9DE` | `#5FE9DE` |
| texto sobre ação | `#FFFFFF` | `#102A2F` | `#102A2F` |
| barra do mascote | `#DDF1EE` | `#0C2024` (borda `#22474E`) | `#181C1D` (borda `#2A3133`) |
| destaque urgente | `#FEF156` com texto `#102A2F` | igual | igual |

Tokens secundários (borda de checkbox, medidor vazio, navegação inferior, botões da barra, botão marcado etc.) foram extraídos da referência e ficam em `src/estilo/tokens.css`, que é a fonte de verdade das cores no código.

- O **amarelo `#FEF156` é reservado** para o sol, para o que é urgente ("tem que ser hoje") e para o botão que **confirma uma ação perigosa** (apagar etc.). É raro de propósito: se aparece na tela, significa atenção. Não usar em outros lugares.
- Água-marinha (`#5FE9DE`) nunca como texto sobre fundo claro.
- O modo **foco** é um escuro em cinza neutro, com exatamente as mesmas formas e posições dos outros dois.
- O usuário escolhe em **Mais → Modo Visual** (2026-11-21):
  - **Modo Visual Fixo:** claro, escuro ou foco.
  - **Modo Visual Variável:** cada modo tem um horário de início ("HH:MM"); um modo vale até o próximo começar "por cima" (de madrugada, continua o último do dia anterior). Pode desligar no máximo 1 dos 3 (usar só 2). Escolher um modo fixo desliga o variável.

## Mascote
- Pixel art, corpo retangular com braços e pernas, olhos água-marinha. **Versão azul por padrão:** corpo `#0A7A73` no modo claro e `#13958C` nos modos escuro e foco, olhos `#5FE9DE`.
- **Fonte de verdade: `docs/mascote/mascote.json`**: grade de pixels (25×19), paletas por modo, quadros (`padrao`, `piscar`, `oi`) e animações. O app gera o mascote a partir dele. Nunca desenhar o mascote "à mão" nem a partir de imagens.
- Cada pose ou variação nova (dormindo, óculos de estudo, faixa de treino) é **um novo quadro na mesma grade**, com as mesmas letras e cores, adicionado a esse arquivo.
- Animações em poucos quadros (2 a 4), trocados em degraus, no estilo pixel: piscar, pulinho, aceno. Respeitar `prefers-reduced-motion` (mostrar só o quadro `padrao`).
- **Piscar corretamente:** o corpo é desenhado inteiro (inclusive embaixo dos olhos) e os olhos por cima. Piscar é trocar para o quadro `piscar`, em que o olho vira 1 linha na base. O fundo da tela **nunca** aparece no lugar do olho.
- Variações por módulo (óculos nos flashcards, olhos fechados no sono etc.) precisam de aprovação do usuário antes de entrar no app.

## Nome e logo
- Nome: **Planner**, escrito em DotGothic16 na marca.
- Logo e ícone do app: o **mascote padrão** (paleta clara) centralizado sobre um quadrado com o fundo do modo claro (`#F1FAFA`). Referência: `docs/mascote/logo-planner.svg`. Os ícones do Android (incluindo o adaptativo) são gerados a partir dele.

## Barra do mascote (topo, todas as abas)
- Fica acima do conteúdo em todas as abas. Pode ser **recolhida** (sobe e some, com animação curta e **suave**, desacelerando no fim; nada de degraus aqui, que deixam parecer travado. Degraus são só para o mascote) e reaberta por um botão pequeno e baixo ("Mostrar", com o mascote em miniatura; visual de ~34px de altura dentro de uma área de toque de 44px). O estado (aberta ou recolhida) é lembrado.
- **Folga ao redor do mascote** (área de ~64×64px e padding generoso), reservada para animações futuras. Não encher esse espaço com outros elementos.
- Conteúdo: mascote animado, saudação (DotGothic16), a **data** (o único lugar da tela Início onde a data aparece; dias da semana sem "-feira", ex.: "quarta, 18 de novembro", para caber numa linha) e dois botões lado a lado: **"Notas anteriores"** e **"Editar nota atual"** (ver `modulos/notas.md`), com o texto sempre em **uma linha** em todos os modos.
- O visual da barra acompanha a aba atual (o mascote pode mudar de variação por aba).

## Navegação inferior (abas ainda indefinidas)
- A primeira aba é **"Início"** (ícone de sol em pixel). As demais estão como **"(XXXXX)"** com ícone de ponto de interrogação no protótipo: **quais serão as abas principais será decidido aos poucos com o usuário.** Definidas até agora: **Início** e **Estudos** (2026-11-19). Candidata mencionada: Tarefas.
- Na versão web, o Netlify (plano gratuito) mostra um selo "Powered by Netlify" fixo no **canto inferior direito**, que não pode ser removido. Layouts de PC devem deixar esse canto livre. No APK o selo não existe.
- Não decidir sozinho quais módulos viram abas. Enquanto isso, os módulos ficam numa tela provisória **"Mais"**, e o Claude Code pergunta quando a decisão for necessária.
