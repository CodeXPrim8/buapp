'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { userApi } from '@/lib/api-client'
import ThemeSelector from '@/components/theme-selector'

interface ProfileProps {
  onNavigate?: (page: string) => void
  onLogout?: () => void
  theme?: string
}

export default function Profile({ onNavigate, onLogout, theme }: ProfileProps) {
  const [userData, setUserData] = useState<{ 
    id?: string
    name: string
    firstName?: string
    lastName?: string
    phoneNumber: string
    email?: string
    role: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [saving, setSaving] = useState(false)
  const [upgradingVendor, setUpgradingVendor] = useState(false)
  const [showCustomizationModal, setShowCustomizationModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showPNDModal, setShowPNDModal] = useState(false)
  const [changingPin, setChangingPin] = useState(false)
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await userApi.getMe()
      if (response.success && response.data?.user) {
        const user = response.data.user
        setUserData({
          id: user.id,
          name: user.name || `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          lastName: user.last_name,
          phoneNumber: user.phone_number,
          email: user.email || '',
          role: user.role,
        })
      } else {
        // No fallback - user must be authenticated via API
        console.warn('User not authenticated')
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      // No fallback - user must be authenticated via API
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleEditClick = () => {
    if (userData) {
      setEditForm({
        firstName: userData.firstName || userData.name.split(' ')[0] || '',
        lastName: userData.lastName || userData.name.split(' ').slice(1).join(' ') || '',
        email: userData.email || '',
      })
      setShowEditModal(true)
    }
  }

  const handleSaveProfile = async () => {
    if (!userData) return

    try {
      setSaving(true)
      const response = await userApi.update({
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        email: editForm.email || undefined,
      })

      if (response.success && response.data?.user) {
        const updatedUser = response.data.user
        setUserData({
          id: updatedUser.id,
          name: updatedUser.name,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          phoneNumber: updatedUser.phone_number,
          email: updatedUser.email || '',
          role: updatedUser.role,
        })
        
        // Refresh user data from API
        await fetchUserData()
        
        setShowEditModal(false)
        alert('Profile updated successfully!')
      } else {
        alert(response.error || 'Failed to update profile')
      }
    } catch (error: any) {
      console.error('Update profile error:', error)
      alert(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleUpgradeToVendor = async () => {
    if (!userData) {
      alert('User data not loaded. Please try again.')
      return
    }

    // Check if already has vendor access
    if (userData.role === 'vendor' || userData.role === 'both') {
      alert('You already have vendor access! Switch to Vendor mode from the dashboard to access vendor features.')
      return
    }

    const confirmed = confirm(
      'Register as Vendor?\n\n' +
      'This will upgrade your account to include vendor features:\n' +
      '• QR code scanning for invites\n' +
      '• Gateway setup for events\n' +
      '• Vendor dashboard and POS\n\n' +
      'You can still access Guest and Celebrant features.\n\n' +
      'Continue?'
    )

    if (!confirmed) return

    try {
      setUpgradingVendor(true)
      console.log('[Profile] Starting vendor upgrade for user:', userData.id, 'Current role:', userData.role)
      
      const response = await userApi.update({
        upgrade_to_vendor: true,
      })

      console.log('[Profile] Vendor upgrade response:', response)

      if (response.success && response.data?.user) {
        const updatedUser = response.data.user
        const newRole = updatedUser.role
        
        console.log('[Profile] Upgrade successful. New role:', newRole)
        
        setUserData({
          ...userData,
          role: newRole,
        })
        
        // Refresh user data from API to get latest role
        await fetchUserData()

        const successMessage = response.data?.message || 'Successfully registered as Vendor! You now have access to vendor features. Switch to Vendor mode from the dashboard.'
        alert(successMessage)
        
        // Refresh the page to update mode switcher and navigation
        window.location.reload()
      } else {
        const errorMessage = response.error || response.data?.message || 'Failed to register as vendor. Please try again.'
        console.error('[Profile] Vendor upgrade failed:', errorMessage, response)
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('[Profile] Upgrade to vendor error:', error)
      const errorMessage = error.message || error.error || 'Failed to register as vendor. Please check your connection and try again.'
      alert(errorMessage)
    } finally {
      setUpgradingVendor(false)
    }
  }

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    } else {
      // Fallback: try to call logout API and reload
      try {
        const { authApi } = await import('@/lib/api-client')
        await authApi.logout()
      } catch (error) {
        console.error('Logout error:', error)
      }
      window.location.reload()
    }
  }

  const handleMenuItemClick = (item: { title: string; action?: string; desc: string }) => {
    if (item.action) {
      onNavigate?.(item.action)
    } else {
      // Handle specific menu items
      switch (item.title) {
        case 'My Accounts':
          onNavigate?.('wallet')
          break
        case 'Contactless Pay':
          onNavigate?.('receive-bu')
          break
        case 'Customization':
          setShowCustomizationModal(true)
          break
        case 'Settings':
          setShowSettingsModal(true)
          break
        case 'Request PND':
          setShowPNDModal(true)
          break
        default:
          alert(`${item.title}\n\n${item.desc}\n\nThis feature is coming soon!`)
      }
    }
  }

  const handleChangePin = async () => {
    if (!pinForm.currentPin || !pinForm.newPin || !pinForm.confirmPin) {
      alert('Please fill in all PIN fields')
      return
    }

    if (pinForm.currentPin.length !== 6 || !/^\d+$/.test(pinForm.currentPin)) {
      alert('Current PIN must be 6 digits')
      return
    }

    if (pinForm.newPin.length !== 6 || !/^\d+$/.test(pinForm.newPin)) {
      alert('New PIN must be 6 digits')
      return
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      alert('New PIN and confirm PIN do not match')
      return
    }

    if (pinForm.currentPin === pinForm.newPin) {
      alert('New PIN must be different from current PIN')
      return
    }

    try {
      setChangingPin(true)
      
      // Call user update API with PIN change
      const response = await userApi.update({
        current_pin: pinForm.currentPin,
        new_pin: pinForm.newPin,
      })

      if (response.success) {
        alert('PIN changed successfully!')
        setShowSettingsModal(false)
        setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
      } else {
        alert(response.error || 'Failed to change PIN. Please verify your current PIN is correct.')
      }
    } catch (error: any) {
      console.error('Change PIN error:', error)
      alert(error.message || error.error || 'Failed to change PIN. Please try again.')
    } finally {
      setChangingPin(false)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <div className="space-y-4 bg-gradient-to-b from-primary to-primary/80 px-4 py-8 text-primary-foreground">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20">
            <span className="text-2xl font-bold">
              {userData ? getInitials(userData.name) : 'U'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{userData?.name || 'User'}</h2>
            <p className="text-sm opacity-90 mt-1">{userData?.phoneNumber || ''}</p>
            <p className="text-xs opacity-75 mt-1 capitalize">
              {userData?.role === 'user' 
                ? 'Guest' 
                : userData?.role === 'both'
                ? 'Guest + Celebrant + Vendor'
                : userData?.role === 'vendor'
                ? 'Vendor'
                : userData?.role === 'celebrant'
                ? 'Celebrant'
                : userData?.role === 'admin'
                ? 'Admin'
                : userData?.role === 'superadmin'
                ? 'Guest + Celebrant + Vendor + Admin + Superadmin'
                : userData?.role || 'User'}
            </p>
            <button 
              onClick={handleEditClick}
              className="mt-1 flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition"
            >
              <span>✏️</span>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              icon: '📋',
              title: 'Transaction History',
              desc: 'View all your transactions',
              action: 'history',
            },
            {
              icon: '👥',
              title: 'Contacts',
              desc: 'Manage contacts and friend requests',
              action: 'contacts',
            },
            {
              icon: '💳',
              title: 'My Accounts',
              desc: 'Account details, statement, e.t.c.',
            },
            {
              icon: '📱',
              title: 'Contactless Pay',
              desc: 'Setup your account for contactless pay',
            },
            {
              icon: '🎨',
              title: 'Customization',
              desc: 'Theme, dashboard customization, e.t.c.',
            },
            {
              icon: '⚙️',
              title: 'Settings',
              desc: 'Password, PIN, Security questions',
            },
            {
              icon: '🔐',
              title: 'Request PND',
              desc: 'Post no debit restriction',
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleMenuItemClick(item)
              }}
              className="rounded-xl bg-card p-4 text-left transition hover:bg-card/80"
            >
              <div className="mb-3 text-3xl">{item.icon}</div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-4">
        <button 
          onClick={handleLogout}
          className="w-full rounded-xl border-2 border-primary py-3 font-bold text-primary transition hover:bg-primary/10"
        >
          Log Out
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false)
            }
          }}
        >
          <Card className="w-full max-w-md border-primary/20 bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-full p-1 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">First Name</label>
                <Input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="bg-secondary text-foreground"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Last Name</label>
                <Input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="bg-secondary text-foreground"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Email (Optional)</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-secondary text-foreground"
                  placeholder="Enter email address"
                />
              </div>

              {/* Register as Vendor Section */}
              {userData && userData.role !== 'vendor' && userData.role !== 'both' && userData.role !== 'admin' && userData.role !== 'superadmin' && (
                <div className="border-t border-border pt-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💼</div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Become a Vendor</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Register as a vendor to access vendor features like QR code scanning, gateway setup, and more. Start making money at events!
                        </p>
                        <Button
                          onClick={handleUpgradeToVendor}
                          disabled={upgradingVendor}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {upgradingVendor ? 'Registering...' : 'Register as Vendor'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {userData && (userData.role === 'vendor' || userData.role === 'both' || userData.role === 'admin' || userData.role === 'superadmin') && (
                <div className="border-t border-border pt-4">
                  <div className="rounded-lg border border-green-400/20 bg-green-400/5 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span className="text-sm font-semibold text-green-400">Vendor Access Enabled</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You have access to vendor features. Switch to Vendor mode from the dashboard to get started.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || !editForm.firstName || !editForm.lastName}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Customization Modal */}
      {showCustomizationModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCustomizationModal(false)
            }
          }}
        >
          <Card className="w-full max-w-md border-primary/20 bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Customization</h3>
              <button
                onClick={() => setShowCustomizationModal(false)}
                className="rounded-full p-1 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Theme</label>
                <p className="text-xs text-muted-foreground mb-3">
                  Change your app theme color. Tap the colored circle below to cycle through themes.
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm">Current Theme:</span>
                  <ThemeSelector 
                    theme={theme || (typeof window !== 'undefined' ? localStorage.getItem('bison-theme') || 'theme-pink' : 'theme-pink')}
                    onThemeChange={(newTheme) => {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('bison-theme', newTheme)
                        document.documentElement.className = newTheme
                        // Reload to apply theme changes
                        setTimeout(() => window.location.reload(), 300)
                      }
                    }}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => setShowCustomizationModal(false)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsModal(false)
              setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
            }
          }}
        >
          <Card className="w-full max-w-md border-primary/20 bg-card p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Settings</h3>
              <button
                onClick={() => {
                  setShowSettingsModal(false)
                  setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
                }}
                className="rounded-full p-1 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Change PIN Section */}
              <div>
                <h4 className="font-semibold mb-3">Change PIN</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Current PIN</label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinForm.currentPin}
                      onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, '') })}
                      className="bg-secondary text-foreground"
                      placeholder="Enter current 6-digit PIN"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">New PIN</label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinForm.newPin}
                      onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                      className="bg-secondary text-foreground"
                      placeholder="Enter new 6-digit PIN"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Confirm New PIN</label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinForm.confirmPin}
                      onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                      className="bg-secondary text-foreground"
                      placeholder="Confirm new 6-digit PIN"
                    />
                  </div>
                  <Button
                    onClick={handleChangePin}
                    disabled={changingPin || !pinForm.currentPin || !pinForm.newPin || !pinForm.confirmPin}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {changingPin ? 'Changing PIN...' : 'Change PIN'}
                  </Button>
                </div>
              </div>

              {/* Security Info */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-2">Security Information</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Your PIN is encrypted and stored securely</p>
                  <p>• Never share your PIN with anyone</p>
                  <p>• Use a unique PIN that you don't use elsewhere</p>
                  <p>• Change your PIN regularly for better security</p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    setShowSettingsModal(false)
                    setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Request PND Modal */}
      {showPNDModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPNDModal(false)
            }
          }}
        >
          <Card className="w-full max-w-md border-primary/20 bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Request Post No Debit (PND)</h3>
              <button
                onClick={() => setShowPNDModal(false)}
                className="rounded-full p-1 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h4 className="font-semibold mb-2">What is PND?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Post No Debit (PND) restriction prevents all debit transactions on your account, 
                  providing an extra layer of security. This means no money can be withdrawn or 
                  transferred from your account until the restriction is lifted.
                </p>
                <h4 className="font-semibold mb-2 mt-4">How to Request PND:</h4>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Contact customer support via phone or email</li>
                  <li>Provide your account details and verification</li>
                  <li>Request PND restriction to be placed on your account</li>
                  <li>To remove PND, contact support again</li>
                </ol>
              </div>

              <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3">
                <p className="text-xs text-yellow-400">
                  ⚠️ <strong>Important:</strong> PND will prevent ALL transactions including legitimate ones. 
                  Make sure you understand the implications before requesting this restriction.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setShowPNDModal(false)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  I Understand
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
