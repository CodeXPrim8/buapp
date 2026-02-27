'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PrivacyProps {
  onNavigate?: (page: string) => void
}

export default function Privacy({ onNavigate }: PrivacyProps = {}) {
  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="px-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold">Privacy Policy</h2>
          <p className="text-sm text-muted-foreground">Last updated: Feb 26, 2026</p>
        </div>

        <Card className="border-border/50 bg-card/50 p-4 space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">1. Information we collect</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Account details such as name, phone number, and email.</li>
              <li>Transaction and activity data needed to run the service.</li>
              <li>Device and usage data for security and diagnostics.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. How we use your information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Provide app features like payments, events, and notifications.</li>
              <li>Protect against fraud, abuse, and unauthorized access.</li>
              <li>Improve performance, reliability, and user experience.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Sharing and disclosure</h3>
            <p className="text-muted-foreground">
              We do not sell your personal data. We may share limited data with trusted
              service providers to operate the app, or when required by law.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. Data retention</h3>
            <p className="text-muted-foreground">
              We keep data as long as your account is active or as needed to provide
              the service and comply with legal obligations.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5. Your choices</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Update profile details in the app settings.</li>
              <li>Contact support to request account deletion or data access.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">6. Contact</h3>
            <p className="text-muted-foreground">
              For privacy questions, contact support through the app or official channels.
            </p>
          </div>
        </Card>

        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onNavigate?.('profile')}
          >
            Back to Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
