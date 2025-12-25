import { Loader2, Plus, CreditCard, History, FileText, Trash2, ExternalLink } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { SubscriptionHistoryItem } from '@/types/user'

interface SubscriptionTabProps {
  subscriptionHistory: SubscriptionHistoryItem[]
  subscriptionLoading: boolean
  onOpenAddSubscription: () => void
  onOpenInitiatePayment: () => void
  onOpenSearchLogs: () => void
  onShowLogs: (subscription: SubscriptionHistoryItem) => void
  onDeleteClick: (subscription: SubscriptionHistoryItem) => void
  formatDate: (timestamp: number) => string
}

export function SubscriptionTab({
  subscriptionHistory,
  subscriptionLoading,
  onOpenAddSubscription,
  onOpenInitiatePayment,
  onOpenSearchLogs,
  onShowLogs,
  onDeleteClick,
  formatDate,
}: SubscriptionTabProps) {
  return (
    <div className="space-y-6">
      {/* Quick Actions Section */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          className="cursor-pointer border transition-colors hover:bg-muted/50"
          onClick={onOpenAddSubscription}
        >
          <CardContent className="flex items-center gap-4 px-5 py-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Add New Subscription</h3>
              <p className="text-sm text-muted-foreground">
                Add a new subscription plan for this user
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border transition-colors hover:bg-muted/50"
          onClick={onOpenInitiatePayment}
        >
          <CardContent className="flex items-center gap-4 px-5 py-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <CreditCard className="size-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium">Initiate Payment</h3>
              <p className="text-sm text-muted-foreground">
                Send payment request notification to user
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Active Subscriptions
            {subscriptionHistory.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({subscriptionHistory.length})
              </span>
            )}
          </h3>
          <Button variant="secondary" size="sm" onClick={onOpenSearchLogs}>
            <History className="mr-1.5 size-4" />
            View Logs
          </Button>
        </div>

        {subscriptionLoading ? (
          <div className="flex items-center justify-center rounded-lg border py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptionHistory.length === 0 ? (
          <div className="rounded-lg border py-12 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <CreditCard className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No active subscriptions</p>
            <p className="text-sm text-muted-foreground">
              Add a subscription to get started
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionHistory.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {sub.subscriptionPlan?.planName || 'Unknown Plan'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          via {sub.paymentMode === 'online' ? 'Internal Metrics' : sub.paymentMode?.toUpperCase()}
                          {sub.subscriptionPlan?.subscriptionPlanLevel && (
                            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5">
                              {sub.subscriptionPlan.subscriptionPlanLevel}
                            </span>
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={sub.status === 'ACTIVE' ? 'bg-green-500/15 text-green-500 hover:bg-green-500/20' : ''}
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(sub.validFrom)}</p>
                        <p className="text-muted-foreground">to {formatDate(sub.validTo)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">₹{sub.invoices?.[0]?.amountPaid?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">of ₹{sub.totalAmount?.toLocaleString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{sub.paymentReceivedBy || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {sub.invoices?.[0]?.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => window.open(sub.invoices[0].pdfUrl, '_blank')}
                            title="View Invoice"
                          >
                            <FileText className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDeleteClick(sub)}
                          title="Delete Subscription"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => onShowLogs(sub)}
                          title="View Details"
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
