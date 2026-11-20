# Guia: Netlify (versão web)

Site: https://plannertheapp.netlify.app — publicado a partir do ramo `main`. Cada pedido de aprovação (PR) aprovado atualiza o site sozinho em 1 a 2 minutos.

## Configuração feita (2026-11-18)
1. **app.netlify.com → Add new project → Import an existing project → GitHub →** repositório `Planner`, branch `main`. Build (`npm run build`, `dist`) vem do `netlify.toml`.
2. **Variáveis de ambiente** (Key → Value), sem marcar "Contains secret values" (são públicas):
   - `VITE_SUPABASE_URL` → `https://khmvtrwnyablerztskoi.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → a chave `sb_publishable_…` do Supabase
3. **Selo "Powered by Netlify":** projetos novos do plano gratuito (desde 19/08/2026) vêm com um selo no canto da tela. Desligar em **Project configuration → General → Powered by Netlify badge** (desativar). O "esconder" que aparece no próprio selo só vale para aquele navegador.

Se mudar alguma variável, é preciso publicar de novo: **Deploys → Trigger deploy → Deploy site**.

## Publicação sob controle (desde 0.3.4)
Para não gastar créditos, o site só é publicado quando o pedido de aprovação tem **`[web]`** no título. Nos outros, o Netlify pula o build (inclusive as prévias). Para publicar a versão atual na hora: **Deploys → Trigger deploy → Deploy site** (esse botão ignora a regra).
