# E-commerce Saleor + Next.js

Sistema completo de e-commerce com Saleor (backend) e Next.js (frontend).

## Iniciar

```bash
docker compose up -d
```

Aguarde 2 minutos na primeira vez. Pronto!

## Acessos

### URLs

| Serviço | URL |
|---------|-----|
| Loja | http://localhost:3002 |
| Admin | http://localhost:9502 |
| API GraphQL | http://localhost:8002/graphql/ |
| Jaeger | http://localhost:16687 |
| MailHog | http://localhost:8026 |
| Grafana | http://localhost:3003 |
| Prometheus | http://localhost:9093 |
| cAdvisor | http://localhost:8083 |

### Credenciais

**Credenciais de teste:**

**Admin:**
- Email: `admin@example.com`
- Senha: `admin`

**Usuário:**
- Email: `user@example.com`
- Senha: `senha123`

### Cupons

| Código | Desconto | Condição |
|--------|----------|----------|
| DESC10 | 10% | Sem restrição |
| PRIMEIRACOMPRA | 15% | Sem restrição |
| BEMVINDO | R$ 20 | Compras acima de R$ 50 |

## Conexões

### PostgreSQL
- Host: `localhost`
- Porta: `5433`
- Database: `saleor`
- Usuário: `saleor`
- Senha: `saleor123`

### Redis
- Host: `localhost`
- Porta: `6380`

### SMTP (MailHog)
- Host: `localhost`
- Porta SMTP: `1026`
- Porta Web: `8026`

## Containers

| Container | Porta |
|-----------|-------|
| saleor_api | 8002 |
| saleor_storefront | 3002 |
| saleor_dashboard | 9502 |
| saleor_postgres | 5433 |
| saleor_redis | 6380 |
| saleor_jaeger | 16687 |
| saleor_mailhog | 8026, 1026 |
| saleor_grafana | 3003 |
| saleor_prometheus | 9093 |
| saleor_cadvisor | 8083 |
| saleor_worker | - |

## Comandos

```bash
# Subir
docker compose up -d

# Parar
docker compose down

# Parar e limpar dados
docker compose down -v

# Ver logs
docker compose logs -f

# Ver status
docker compose ps

# Reiniciar
docker compose restart

# Rebuild
docker compose build --no-cache
docker compose up -d

# Acessar shell da API
docker exec -it saleor_api bash

# Acessar PostgreSQL
docker exec -it saleor_postgres psql -U saleor -d saleor
```

## Exemplos de API (cURL)

### Login

```bash
curl -X POST http://localhost:8002/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { tokenCreate(email: \"user@example.com\", password: \"senha123\") { token refreshToken user { email } errors { field message } } }"
  }'
```

### Listar Produtos

```bash
curl -X POST http://localhost:8002/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ products(first: 10, channel: \"default-channel\") { edges { node { id name slug thumbnail { url } variants { id name pricing { price { gross { amount } } } } } } } }"
  }'
```

### Criar Checkout

```bash
curl -X POST http://localhost:8002/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { checkoutCreate(input: { channel: \"default-channel\", lines: [{ quantity: 1, variantId: \"VARIANT_ID\" }] }) { checkout { id lines { id quantity } } errors { field message } } }"
  }'
```

### Adicionar Item ao Checkout

```bash
curl -X POST http://localhost:8002/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { checkoutLinesAdd(id: \"CHECKOUT_ID\", lines: [{ quantity: 1, variantId: \"VARIANT_ID\" }]) { checkout { id lines { id quantity } } errors { field message } } }"
  }'
```

### Aplicar Cupom

```bash
curl -X POST http://localhost:8002/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { checkoutAddPromoCode(id: \"CHECKOUT_ID\", promoCode: \"DESC10\") { checkout { id discount { amount } } errors { field message } } }"
  }'
```

### Finalizar Compra

```bash
curl -X POST http://localhost:8002/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "mutation { checkoutComplete(id: \"CHECKOUT_ID\") { order { id number } errors { field message } } }"
  }'
```

## Setup Automático

Na primeira execução, o sistema cria automaticamente:

- 15+ produtos de exemplo
- 1.000.000 unidades de estoque por variante
- 2 usuários (admin e comum)
- 3 cupons de desconto
- Canal padrão (default-channel)
- Zona de envio para Brasil

## Compatibilidade

- Linux (Ubuntu, Debian, Fedora, etc.)
- macOS (Intel e Apple Silicon)
- Windows (Docker Desktop + WSL2)

**Requisitos:** Apenas Docker e Docker Compose

## Estrutura

```
teste/
├── docker-compose.yml          # Orquestração
├── Dockerfile.saleor           # Imagem customizada
├── docker-entrypoint.sh        # Setup automático
├── saleor-custom/              # Comando Django
│   └── management/commands/
│       └── init_store.py
├── storefront-nextjs/          # Frontend Next.js
└── README.md                   # Este arquivo
```

## Problemas Comuns

### Porta em uso

Edite `docker-compose.yml` e mude a primeira porta:

```yaml
ports:
  - "3003:3002"  # Muda 3002 para 3003
```

### Container não inicia

```bash
docker compose logs saleor_api
docker compose up -d --force-recreate
```

### Reset completo

```bash
docker compose down -v
docker compose up -d
```

## Desenvolvimento

### Editar Frontend

1. Edite arquivos em `storefront-nextjs/src/`
2. Rebuild:
```bash
docker compose build storefront
docker compose up -d storefront
```

### Adicionar Produtos

1. Acesse: http://localhost:9502
2. Login: `admin@example.com` / `admin`
3. Products → Add Product

## Monitoramento

### Grafana (http://localhost:3003)
- Login: `admin` / `admin`
- Dashboard: "Docker Container Monitoring"
- Métricas: CPU, Memória, Rede, Disco

### Prometheus (http://localhost:9093)
- Coleta de métricas dos containers
- Targets: cAdvisor, Postgres, Redis

### cAdvisor (http://localhost:8083)
- Métricas detalhadas de cada container
- CPU, memória, rede, disco em tempo real
- Interface web para análise individual

### Jaeger (http://localhost:16687)
- Distributed tracing
- Rastreamento de requisições GraphQL
- Performance de queries ao banco

### MailHog (http://localhost:8026)
- Captura de emails enviados
- Testes de notificações

## Fluxo de Compra

1. Acesse http://localhost:3002
2. Adicione produto ao carrinho
3. Clique no ícone do carrinho
4. Finalizar Compra
5. Faça login
6. Preencha endereço
7. Escolha envio
8. Escolha pagamento
9. Confirme
10. Veja em Minha Conta → Meus Pedidos
