import { PaymentsList } from '@/components/payments/payments-list'
import { getPayments, getPaymentsCount } from '@/lib/queries/payments'

export default async function PaymentsPage() {
  const [payments, totalCount] = await Promise.all([
    getPayments({ limit: 100 }),
    getPaymentsCount(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paiements</h1>
        <p className="text-muted-foreground mt-2">Gérez les paiements de vos clients</p>
      </div>
      <PaymentsList payments={payments} totalCount={totalCount} />
    </div>
  )
}
