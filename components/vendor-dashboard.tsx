'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, DollarSign, AlertCircle, Plus, Bell, Ticket } from 'lucide-react'
import { gatewayApi, vendorSalesApi } from '@/lib/api-client'

interface VendorStats {
  totalSales: number
  activeSessions: number
  totalBUInventory: number
  todayEarnings: number
}

interface Sale {
  id: string
  amount: number
  buAmount: number
  timestamp: string
  eventName: string
  status: 'completed' | 'pending'
}

interface VendorDashboardProps {
  onNavigate?: (page: string, data?: any) => void
}

export default function VendorDashboard({ onNavigate }: VendorDashboardProps) {
  const [gateways, setGateways] = useState<any[]>([])
  const [completedTransfers, setCompletedTransfers] = useState<any[]>([])
  const [stats, setStats] = useState<VendorStats>({
    totalSales: 0,
    activeSessions: 0,
    totalBUInventory: 0,
    todayEarnings: 0,
  })
  const [greeting, setGreeting] = useState<string>('Good Evening')

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return 'Good Morning'
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon'
    } else {
      return 'Good Evening'
    }
  }

  // Update greeting in real-time
  useEffect(() => {
    // Set initial greeting
    setGreeting(getGreeting())

    // Update greeting every minute to ensure it's always correct
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting())
    }, 60000) // Update every minute

    return () => {
      clearInterval(greetingInterval)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch gateways
        const gatewaysResponse = await gatewayApi.list()
        if (gatewaysResponse.success && gatewaysResponse.data?.gateways) {
          const formattedGateways = gatewaysResponse.data.gateways.map((g: any) => ({
            id: g.id,
            eventName: g.event_name,
            eventDate: g.event_date,
            status: g.status,
          }))
          setGateways(formattedGateways)
        }

        // Fetch completed sales
        const salesResponse = await vendorSalesApi.getPending()
        if (salesResponse.success && salesResponse.data?.sales) {
          const allSales = salesResponse.data.sales
          const completed = allSales.filter((s: any) => s.status === 'notes_issued')
          setCompletedTransfers(completed)
          
          // Format sales for display
          const formattedSales: Sale[] = allSales.map((s: any) => ({
            id: s.id,
            amount: parseFloat(s.transfers?.amount?.toString() || s.amount?.toString() || '0'),
            buAmount: parseFloat(s.transfers?.amount?.toString() || s.amount?.toString() || '0'),
            timestamp: new Date(s.created_at).toLocaleString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            eventName: s.gateways?.event_name || s.transfers?.event?.name || 'Unknown Event',
            status: s.status === 'notes_issued' ? 'completed' : 'pending',
          }))
          setSales(formattedSales)
          
          // Calculate stats
          const totalSales = completed.reduce((sum: number, s: any) => sum + parseFloat(s.transfers?.amount?.toString() || s.amount?.toString() || '0'), 0)
          const activeSessions = gateways.filter((g: any) => g.status === 'active').length
          const today = new Date().toISOString().split('T')[0]
          const todayEarnings = completed
            .filter((s: any) => s.created_at?.startsWith(today))
            .reduce((sum: number, s: any) => sum + parseFloat(s.transfers?.amount?.toString() || s.amount?.toString() || '0'), 0)
          
          setStats({
            totalSales: totalSales || 0,
            activeSessions: activeSessions || 0,
            totalBUInventory: 0, // TODO: Implement inventory management API
            todayEarnings: todayEarnings || 0,
          })
        }
        
        setSalesLoading(false)
      } catch (error) {
        console.error('Failed to fetch vendor data:', error)
      }
    }

    fetchData()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const [sales, setSales] = useState<Sale[]>([])
  const [salesLoading, setSalesLoading] = useState(true)

  const [currentView, setCurrentView] = useState<'overview' | 'sales' | 'inventory'>('overview')

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Header with Notifications */}
      <div className="px-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h2 className="text-xl font-bold">Vendor Dashboard</h2>
        </div>
        <button 
          onClick={() => onNavigate?.('notifications')}
          className="rounded-full bg-primary/20 p-2 hover:bg-primary/30 transition"
        >
          <Bell size={20} className="text-primary" />
        </button>
      </div>

      {/* Offline Mode Alert */}
      <Card className="border-yellow-400/30 bg-yellow-400/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-400">Offline Mode Active</h3>
            <p className="text-sm text-muted-foreground">
              Transactions will sync when connection is restored
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-card p-4">
          <p className="text-xs text-muted-foreground">Today's Sales</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            ₦{stats.todayEarnings.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
            <TrendingUp className="h-3 w-3" />
            <span>+12% vs yesterday</span>
          </div>
        </Card>

        <Card className="border-primary/20 bg-card p-4">
          <p className="text-xs text-muted-foreground">ɃU Inventory</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {(stats.totalBUInventory / 1000).toFixed(0)}K
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.activeSessions} active events
          </p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        <Button
          onClick={() => setCurrentView('overview')}
          variant={currentView === 'overview' ? 'default' : 'outline'}
          className="flex-shrink-0"
        >
          Overview
        </Button>
        <Button
          onClick={() => setCurrentView('sales')}
          variant={currentView === 'sales' ? 'default' : 'outline'}
          className="flex-shrink-0"
        >
          Sales Log
        </Button>
        <Button
          onClick={() => setCurrentView('inventory')}
          variant={currentView === 'inventory' ? 'default' : 'outline'}
          className="flex-shrink-0"
        >
          Inventory
        </Button>
      </div>

      {currentView === 'overview' && (
        <>
          {/* Quick Actions */}
          <Card className="border-primary/20 bg-card p-4 mb-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  onNavigate?.('vendor-create-event')
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Ticket className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <Button
                onClick={() => {
                  onNavigate?.('vendor-gateway-setup')
                }}
                variant="outline"
              >
                Setup Gateway
              </Button>
            </div>
          </Card>

          {/* Key Metrics */}
          <div className="space-y-3">
            <h3 className="font-semibold">Key Metrics</h3>

            <Card className="border-border/50 bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Total Sales</p>
                    <p className="text-xs text-muted-foreground">Since registration</p>
                  </div>
                </div>
                <p className="text-xl font-bold">₦{stats.totalSales.toLocaleString()}</p>
              </div>
            </Card>

            <Card className="border-border/50 bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Commission (5%)</p>
                    <p className="text-xs text-muted-foreground">Earned so far</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-400">
                  ₦{(stats.totalSales * 0.05).toLocaleString()}
                </p>
              </div>
            </Card>
          </div>

          {/* Active Gateways */}
          {gateways.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Active Gateways</h3>
                <Button
                  onClick={() => onNavigate?.('vendor-gateway-setup')}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
              {gateways.filter((g: any) => g.status === 'active').slice(0, 3).map((gateway: any) => (
                <Card key={gateway.id} className="border-primary/20 bg-card/50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{gateway.eventName}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {gateway.celebrantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gateway.eventDate}
                      </p>
                    </div>
                    <span className="inline-block rounded-full bg-green-400/20 px-2 py-1 text-xs text-green-400">
                      Active
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => onNavigate?.('wallet')}
              className="h-16 flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span className="text-lg">💳</span>
              <span className="text-xs">Sell ɃU Note</span>
            </Button>
            <Button 
              onClick={() => onNavigate?.('vendor-gateway-setup')}
              variant="outline"
              className="h-16 flex-col gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Setup Gateway</span>
            </Button>
          </div>
        </>
      )}

      {currentView === 'sales' && (
        <>
          <h3 className="font-semibold">Recent Transactions</h3>
          <div className="space-y-3">
            {sales.map((sale) => (
              <Card key={sale.id} className="border-border/50 bg-card/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{sale.eventName}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{sale.timestamp}</p>
                    <p className="text-xs text-muted-foreground">ID: {sale.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₦{sale.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Ƀ {sale.buAmount.toLocaleString()}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        sale.status === 'completed'
                          ? 'bg-green-400/20 text-green-400'
                          : 'bg-yellow-400/20 text-yellow-400'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {currentView === 'inventory' && (
        <>
          <h3 className="font-semibold">ɃU Inventory Management</h3>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  Ƀ {(stats.totalBUInventory / 1000).toFixed(0)}K
                </p>
              </div>

              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Estimated Value</p>
                <p className="mt-1 font-bold">
                  ₦{stats.totalBUInventory.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Stock Levels</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Premium ɃU (500+)</span>
                      <span>35%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 w-[35%] rounded-full bg-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Standard ɃU (100-500)</span>
                      <span>50%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 w-[50%] rounded-full bg-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Mini ɃU (10-99)</span>
                      <span>15%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 w-[15%] rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Restock ɃU
          </Button>
        </>
      )}
    </div>
  )
}
