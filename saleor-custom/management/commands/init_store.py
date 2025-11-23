"""
Django management command para inicializar a loja com dados de teste.
Substitui o setup-initial-data.sh com Python puro (cross-platform).
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from decimal import Decimal


class Command(BaseCommand):
    help = 'Inicializa a loja com dados de teste (produtos, usuarios, cupons)'

    def handle(self, *args, **options):
        self.stdout.write("=" * 50)
        self.stdout.write("🚀 Iniciando configuração automática do ambiente")
        self.stdout.write("=" * 50)

        # 1. Executar migrations
        self.stdout.write("⏳ Executando migrations...")
        call_command('migrate', '--noinput')
        self.stdout.write(self.style.SUCCESS("✅ Migrations concluídas!"))

        # 2. Verificar se já existem produtos (idempotência)
        from saleor.product.models import Product
        product_count = Product.objects.count()
        
        if product_count > 0:
            self.stdout.write(self.style.WARNING(
                f"ℹ️  Banco já possui {product_count} produtos, pulando populatedb"
            ))
        else:
            # 3. Popular banco de dados
            self.stdout.write("⏳ Populando banco com dados iniciais...")
            call_command('populatedb', '--createsuperuser', '--withoutimages')
            self.stdout.write(self.style.SUCCESS("✅ Banco populado com sucesso!"))

        # 4. Atualizar estoque para 1.000.000 unidades
        self.stdout.write("⏳ Atualizando estoque para 1.000.000 unidades...")
        self._update_stock()

        # 5. Corrigir nomes das variantes
        self.stdout.write("⏳ Corrigindo nomes das variantes...")
        self._fix_variant_names()

        # 6. Criar/atualizar usuários de teste
        self.stdout.write("⏳ Verificando usuários de teste...")
        self._create_test_users()

        # 7. Criar cupons de desconto
        self.stdout.write("⏳ Criando cupons de desconto...")
        self._create_vouchers()

        # 8. Resumo final
        self.stdout.write("=" * 50)
        self.stdout.write(self.style.SUCCESS("✅ Configuração concluída com sucesso!"))
        self.stdout.write("=" * 50)
        self.stdout.write("")
        self.stdout.write("📦 Dados disponíveis:")
        self.stdout.write("   - Produtos com 1.000.000 unidades em estoque")
        self.stdout.write("   - Admin: admin@example.com / admin")
        self.stdout.write("   - User:  user@example.com / senha123")
        self.stdout.write("")
        self.stdout.write("🎟️  Cupons disponíveis:")
        self.stdout.write("   - DESC10 (10% de desconto)")
        self.stdout.write("   - PRIMEIRACOMPRA (15% de desconto)")
        self.stdout.write("   - BEMVINDO (R$ 20 OFF em compras acima de R$ 50)")
        self.stdout.write("")
        self.stdout.write("🚀 Sistema pronto para uso!")
        self.stdout.write("=" * 50)

    def _update_stock(self):
        """Atualiza estoque de todas as variantes para 1.000.000 unidades."""
        from saleor.product.models import ProductVariant
        from saleor.warehouse.models import Stock, Warehouse

        warehouse = Warehouse.objects.first()
        
        if not warehouse:
            self.stdout.write(self.style.ERROR("❌ Nenhum warehouse encontrado!"))
            return

        variants = ProductVariant.objects.all()
        updated = 0
        
        for variant in variants:
            Stock.objects.update_or_create(
                product_variant=variant,
                warehouse=warehouse,
                defaults={'quantity': 1000000}
            )
            updated += 1
        
        self.stdout.write(self.style.SUCCESS(
            f"✅ Estoque atualizado para {updated} variantes!"
        ))

    def _fix_variant_names(self):
        """Corrige nomes das variantes para serem legíveis."""
        from saleor.product.models import ProductVariant

        variants = ProductVariant.objects.all()
        updated_simple = 0
        updated_attrs = 0

        for variant in variants:
            # Tentar usar atributos primeiro
            attributes = variant.attributes.all()
            
            if attributes.exists():
                attr_values = []
                for assignment in attributes:
                    values = assignment.values.all()
                    for value in values:
                        attr_values.append(value.name)
                
                if attr_values:
                    variant.name = " - ".join(attr_values)
                    variant.save()
                    updated_attrs += 1
                    continue
            
            # Se não tem atributos, usar nome simples
            if not variant.name or variant.name.startswith('UHJ') or len(variant.name) > 30:
                product_variants = variant.product.variants.all()
                variant_index = list(product_variants).index(variant) + 1
                variant.name = f"Opção {variant_index}"
                variant.save()
                updated_simple += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Variantes com atributos: {updated_attrs}"
        ))
        self.stdout.write(self.style.SUCCESS(
            f"✅ Variantes simples: {updated_simple}"
        ))

    def _create_test_users(self):
        """Cria ou atualiza usuários de teste."""
        from saleor.account.models import User

        # Usuário admin
        email_admin = "admin@example.com"
        password_admin = "admin"

        if not User.objects.filter(email=email_admin).exists():
            User.objects.create_superuser(
                email=email_admin,
                password=password_admin,
                is_staff=True,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(
                f"✅ Usuário criado: {email_admin} / {password_admin}"
            ))
        else:
            user = User.objects.get(email=email_admin)
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password_admin)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"✅ Usuário atualizado: {email_admin} / {password_admin}"
            ))

        # Usuário comum
        email_user = "user@example.com"
        password_user = "senha123"

        if not User.objects.filter(email=email_user).exists():
            User.objects.create_user(
                email=email_user,
                password=password_user,
                is_staff=False,
                is_active=True,
                first_name="Usuário",
                last_name="Teste"
            )
            self.stdout.write(self.style.SUCCESS(
                f"✅ Usuário comum criado: {email_user} / {password_user}"
            ))
        else:
            user = User.objects.get(email=email_user)
            user.is_active = True
            user.set_password(password_user)
            user.first_name = "Usuário"
            user.last_name = "Teste"
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"✅ Usuário comum atualizado: {email_user} / {password_user}"
            ))

    def _create_vouchers(self):
        """Cria cupons de desconto no canal default-channel."""
        from saleor.discount.models import Voucher, VoucherCode, VoucherChannelListing
        from saleor.channel.models import Channel

        # Usar o canal default-channel
        channel = Channel.objects.filter(slug='default-channel').first()
        if not channel:
            channel = Channel.objects.first()

        if not channel:
            self.stdout.write(self.style.ERROR("❌ Canal não encontrado!"))
            return

        # Cupom 1: DESC10 (10% de desconto)
        if not VoucherCode.objects.filter(code='DESC10').exists():
            voucher = Voucher.objects.create(
                name='Desconto de 10%',
                type='entire_order',
                discount_value_type='percentage',
            )
            VoucherCode.objects.create(
                voucher=voucher,
                code='DESC10',
                is_active=True
            )
            VoucherChannelListing.objects.create(
                voucher=voucher,
                channel=channel,
                discount_value=Decimal('10'),
            )
            self.stdout.write(self.style.SUCCESS(
                "✅ Cupom DESC10 criado (10% de desconto)"
            ))
        else:
            # Garantir que existe no canal correto
            voucher_code = VoucherCode.objects.get(code='DESC10')
            if not VoucherChannelListing.objects.filter(
                voucher=voucher_code.voucher, 
                channel=channel
            ).exists():
                VoucherChannelListing.objects.create(
                    voucher=voucher_code.voucher,
                    channel=channel,
                    discount_value=Decimal('10'),
                )
                self.stdout.write(self.style.SUCCESS(
                    "✅ Cupom DESC10 vinculado ao default-channel"
                ))
            else:
                self.stdout.write(self.style.WARNING("ℹ️  Cupom DESC10 já existe"))

        # Cupom 2: PRIMEIRACOMPRA (15% de desconto)
        if not VoucherCode.objects.filter(code='PRIMEIRACOMPRA').exists():
            voucher = Voucher.objects.create(
                name='Primeira Compra - 15%',
                type='entire_order',
                discount_value_type='percentage',
            )
            VoucherCode.objects.create(
                voucher=voucher,
                code='PRIMEIRACOMPRA',
                is_active=True
            )
            VoucherChannelListing.objects.create(
                voucher=voucher,
                channel=channel,
                discount_value=Decimal('15'),
            )
            self.stdout.write(self.style.SUCCESS(
                "✅ Cupom PRIMEIRACOMPRA criado (15% de desconto)"
            ))
        else:
            voucher_code = VoucherCode.objects.get(code='PRIMEIRACOMPRA')
            if not VoucherChannelListing.objects.filter(
                voucher=voucher_code.voucher, 
                channel=channel
            ).exists():
                VoucherChannelListing.objects.create(
                    voucher=voucher_code.voucher,
                    channel=channel,
                    discount_value=Decimal('15'),
                )
                self.stdout.write(self.style.SUCCESS(
                    "✅ Cupom PRIMEIRACOMPRA vinculado ao default-channel"
                ))
            else:
                self.stdout.write(self.style.WARNING("ℹ️  Cupom PRIMEIRACOMPRA já existe"))

        # Cupom 3: BEMVINDO (R$ 20 de desconto)
        if not VoucherCode.objects.filter(code='BEMVINDO').exists():
            voucher = Voucher.objects.create(
                name='Bem-vindo - R$ 20 OFF',
                type='entire_order',
                discount_value_type='fixed',
            )
            VoucherCode.objects.create(
                voucher=voucher,
                code='BEMVINDO',
                is_active=True
            )
            VoucherChannelListing.objects.create(
                voucher=voucher,
                channel=channel,
                discount_value=Decimal('20'),
                min_spent_amount=Decimal('50'),
                currency='BRL'
            )
            self.stdout.write(self.style.SUCCESS(
                "✅ Cupom BEMVINDO criado (R$ 20 OFF em compras acima de R$ 50)"
            ))
        else:
            voucher_code = VoucherCode.objects.get(code='BEMVINDO')
            if not VoucherChannelListing.objects.filter(
                voucher=voucher_code.voucher, 
                channel=channel
            ).exists():
                VoucherChannelListing.objects.create(
                    voucher=voucher_code.voucher,
                    channel=channel,
                    discount_value=Decimal('20'),
                    min_spent_amount=Decimal('50'),
                    currency='BRL'
                )
                self.stdout.write(self.style.SUCCESS(
                    "✅ Cupom BEMVINDO vinculado ao default-channel"
                ))
            else:
                self.stdout.write(self.style.WARNING("ℹ️  Cupom BEMVINDO já existe"))

