# Guia: APK (app Android)

O APK é gerado sozinho pelo GitHub sempre que uma versão nova chega ao `main`, e fica em
**github.com/collogni27/Planner/releases**. O app avisa quando há versão nova.

## Configuração única no GitHub (feita uma vez)
No repositório: **Settings → Secrets and variables → Actions**.

**Aba "Secrets" → New repository secret** (duas vezes):
| Name | Secret |
|---|---|
| `PLANNER_KEYSTORE_BASE64` | todo o conteúdo do arquivo `PLANNER_KEYSTORE_BASE64.txt` |
| `PLANNER_KEYSTORE_PASSWORD` | a senha que está no `LEIA-ME-chave-do-planner.txt` |

**Aba "Variables" → New repository variable** (duas vezes):
| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://khmvtrwnyablerztskoi.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | a chave `sb_publishable_…` (a mesma do Netlify) |

## A chave de assinatura (MUITO importante)
- Os arquivos da chave (`planner-release.jks`, `PLANNER_KEYSTORE_BASE64.txt`, `LEIA-ME-chave-do-planner.txt`) ficam **guardados no Google Drive** do usuário. Nunca no repositório.
- Todo APK precisa ser assinado com **a mesma chave**; o build confere a impressão digital em `android/assinatura-esperada.txt` e se recusa a publicar se for diferente.
- Se a chave for perdida: não dá mais para atualizar por cima; seria preciso desinstalar (os dados da nuvem ficam salvos, os locais não sincronizados se perdem).

## Instalar no celular (primeira vez)
1. No celular, abra **github.com/collogni27/Planner/releases** e toque em `planner-X.Y.Z.apk` na versão mais recente.
2. Quando o download terminar, toque no arquivo.
3. O Android pede para **permitir instalar apps desta fonte** (Chrome ou "Arquivos"): toque em **Configurações**, ligue a permissão e volte.
4. Toque em **Instalar**. Se aparecer um aviso do Google Play Protect sobre app desconhecido, toque em **Mais detalhes → Instalar mesmo assim**.

## Atualizar
O app mostra "Nova versão disponível". Toque em **Atualizar**, espere o download, toque no arquivo e confirme **Atualizar**. Os dados ficam.
