"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2, Save, Shield, Key, Globe, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SettingsPage() {
  const { data: session } = useSWR("/api/auth/session", fetcher)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Admin account and application configuration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Account
            </CardTitle>
            <CardDescription>Your admin account information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={session?.user?.email || ""}
                  disabled
                  className="bg-secondary"
                />
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {session?.user?.role || "admin"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                value={session?.user?.name || ""}
                disabled
                className="bg-secondary"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Account details are managed through the OTP authentication system.
              Allowed emails are configured via the ADMIN_EMAILS environment
              variable.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              Environment Variables
            </CardTitle>
            <CardDescription>
              Required environment variables for the application
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <EnvVarItem
              name="MONGODB_URI"
              description="MongoDB connection string"
              required
            />
            <Separator />
            <EnvVarItem
              name="ADMIN_EMAILS"
              description="Comma-separated list of allowed admin emails"
              required
            />
            <Separator />
            <EnvVarItem
              name="STRIPE_SECRET_KEY"
              description="Stripe secret key for subscription management"
            />
            <Separator />
            <EnvVarItem
              name="STRIPE_WEBHOOK_SECRET"
              description="Stripe webhook signing secret"
            />
            <Separator />
            <EnvVarItem
              name="RESEND_API_KEY"
              description="Resend API key for sending emails (or your provider)"
            />
            <Separator />
            <EnvVarItem
              name="NEXT_PUBLIC_APP_URL"
              description="Public URL of the app for Stripe redirects"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Website
            </CardTitle>
            <CardDescription>
              Connected website configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Website URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value="https://csgraphicmeta.com.au"
                  disabled
                  className="bg-secondary"
                />
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://csgraphicmeta.com.au"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit
                  </a>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Content edits made in the Content Management section will update
              the database. Connect your frontend to the content API to fetch
              updated content.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Email provider setup for notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              The email system currently uses a stub provider that logs emails to
              the console. To enable real email delivery:
            </p>
            <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                  1
                </span>
                <span>
                  Sign up for an email provider (Resend, SendGrid, etc.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                  2
                </span>
                <span>Add your API key as an environment variable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                  3
                </span>
                <span>
                  Update the <code className="rounded bg-secondary px-1 py-0.5 text-xs font-mono text-foreground">lib/email.ts</code> file to use your provider
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EnvVarItem({
  name,
  description,
  required,
}: {
  name: string
  description: string
  required?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono font-medium text-foreground">
            {name}
          </code>
          {required && (
            <Badge
              variant="outline"
              className="text-[10px] px-1 py-0 leading-4"
            >
              Required
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </div>
  )
}
