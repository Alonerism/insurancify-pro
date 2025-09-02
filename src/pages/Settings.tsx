import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Building, Users, Bell, Shield, Mail, Palette } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization profile, users, notifications, and system preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Profile
              </CardTitle>
              <CardDescription>
                Manage your organization's basic information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="Premier Property Management" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="america-los-angeles">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-los-angeles">America/Los_Angeles (PST)</SelectItem>
                      <SelectItem value="america-new-york">America/New_York (EST)</SelectItem>
                      <SelectItem value="america-chicago">America/Chicago (CST)</SelectItem>
                      <SelectItem value="america-denver">America/Denver (MST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="org-address">Primary Address</Label>
                <Input id="org-address" defaultValue="123 Business Ave, Los Angeles, CA 90210" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-phone">Phone Number</Label>
                  <Input id="org-phone" defaultValue="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Email</Label>
                  <Input id="org-email" type="email" defaultValue="contact@premierpm.com" />
                </div>
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts and role assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Manage who has access to your insurance management system
                  </p>
                  <Button>Invite User</Button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        JD
                      </div>
                      <div>
                        <p className="font-medium">John Doe</p>
                        <p className="text-sm text-muted-foreground">john.doe@company.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="admin">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm">Remove</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        SM
                      </div>
                      <div>
                        <p className="font-medium">Sarah Mitchell</p>
                        <p className="text-sm text-muted-foreground">sarah.mitchell@company.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="manager">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm">Remove</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>
                  Define what each role can access and modify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">Admin</h4>
                      <p className="text-xs text-muted-foreground">Full system access</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">Manager</h4>
                      <p className="text-xs text-muted-foreground">Edit policies and claims</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">Viewer</h4>
                      <p className="text-xs text-muted-foreground">Read-only access</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Renewal Reminders</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Email notifications</p>
                      <p className="text-xs text-muted-foreground">Receive renewal reminders via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">In-app notifications</p>
                      <p className="text-xs text-muted-foreground">Show renewal alerts in the dashboard</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Claims Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">New claim alerts</p>
                      <p className="text-xs text-muted-foreground">Notify when a new claim is filed</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Claim status updates</p>
                      <p className="text-xs text-muted-foreground">Updates on claim progress and resolution</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Reminder Timing</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Policy renewal reminders</Label>
                    <Select defaultValue="90-60-30-15">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90-60-30-15">90, 60, 30, 15 days</SelectItem>
                        <SelectItem value="60-30-15">60, 30, 15 days</SelectItem>
                        <SelectItem value="30-15-7">30, 15, 7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>COI expiration alerts</Label>
                    <Select defaultValue="30-15-7">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60-30-15">60, 30, 15 days</SelectItem>
                        <SelectItem value="30-15-7">30, 15, 7 days</SelectItem>
                        <SelectItem value="15-7-3">15, 7, 3 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Integrations
              </CardTitle>
              <CardDescription>
                Connect with external services and manage API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Email Service</h4>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Email Provider</span>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Set up email service for sending renewal reminders and notifications
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Document Storage</h4>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Supabase Storage</span>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Secure document storage for policies, certificates, and claims
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">AI Services</h4>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SettingsIcon className="h-4 w-4" />
                      <span className="font-medium">Document AI</span>
                    </div>
                    <Button variant="outline" size="sm">Setup</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI-powered document analysis and Q&A for policy documents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                System Preferences
              </CardTitle>
              <CardDescription>
                Customize system behavior and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Display Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Dark mode</p>
                      <p className="text-xs text-muted-foreground">Toggle dark theme</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Compact layout</p>
                      <p className="text-xs text-muted-foreground">Use smaller spacing and fonts</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Data & Privacy</h4>
                <div className="space-y-4">
                  <Button variant="outline">Export All Data</Button>
                  <p className="text-xs text-muted-foreground">
                    Download a complete backup of your organization's data
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">System Information</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>January 15, 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database:</span>
                    <span>Connected</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}