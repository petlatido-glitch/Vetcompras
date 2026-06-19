import { Receipt } from "lucide-react";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-white/10 bg-white">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-orange-500 text-white">
            <Receipt className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">VetCompras</CardTitle>
          <CardDescription>Ingresa con tu cuenta administradora de Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signIn as any} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
