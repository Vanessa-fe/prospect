'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { onboardingSchema, type OnboardingInput } from '@/lib/validations/user-profile'
import { completeOnboarding } from '@/lib/actions/user-profile'
import { THEMES } from '@/lib/constants/themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      selectedTheme: 'minimal',
    },
  })

  const onSubmit = async (data: OnboardingInput) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await completeOnboarding(data)

      if (!result.success && result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">
              Bienvenue sur Prospect CRM
            </CardTitle>
            <CardDescription className="text-center">
              Quelques informations pour personnaliser votre expérience
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Votre prénom"
                  disabled={isLoading}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Nom de votre activité</Label>
                <Input
                  id="businessName"
                  placeholder="Ex: Studio Photo Sarah, Coaching Bien-être..."
                  disabled={isLoading}
                  {...register('businessName')}
                />
                {errors.businessName && (
                  <p className="text-sm text-destructive">
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Type d&apos;activité</Label>
                <Input
                  id="businessType"
                  placeholder="Ex: Photographe, Coach, Esthéticienne, Tatoueur..."
                  disabled={isLoading}
                  {...register('businessType')}
                />
                {errors.businessType && (
                  <p className="text-sm text-destructive">
                    {errors.businessType.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Cette information ne limite pas les fonctionnalités, elle aide juste
                  à personnaliser votre expérience
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selectedTheme">Thème de couleur</Label>
                <Controller
                  name="selectedTheme"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="selectedTheme">
                        <SelectValue placeholder="Choisissez un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        {THEMES.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{theme.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {theme.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.selectedTheme && (
                  <p className="text-sm text-destructive">
                    {errors.selectedTheme.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Vous pourrez modifier le thème à tout moment dans les paramètres
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Configuration...' : 'Commencer à utiliser Prospect CRM'}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
