'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { loginSchema, signupSchema } from '@/lib/validations/auth'
import type { LoginInput, SignupInput } from '@/lib/validations/auth'
import { cookies } from 'next/headers'

export async function login(data: LoginInput) {
  // Validation côté serveur
  const validatedFields = loginSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0].message,
    }
  }

  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  // Stocker le token dans un cookie HTTP-only
  if (authData.session?.access_token) {
    const cookieStore = await cookies()
    cookieStore.set('auth-token', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    })
    console.log('Token stored in cookie')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(data: SignupInput) {
  // Validation côté serveur
  const validatedFields = signupSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0].message,
    }
  }

  const supabase = await createClient()

  // 1. Créer l'utilisateur
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    options: {
      data: {
        name: validatedFields.data.name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (authError) {
    return {
      error: authError.message,
    }
  }

  // 2. Créer le profil utilisateur
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: validatedFields.data.name,
        email: validatedFields.data.email,
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
    }
  }

  // 3. Stocker le token dans un cookie HTTP-only si disponible
  if (authData.session?.access_token) {
    const cookieStore = await cookies()
    cookieStore.set('auth-token', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Erreur de déconnexion:', error)
    return { error: error.message }
  }

  // Supprimer le cookie HTTP-only
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function loginWithGoogle() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function getUser() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log('[getUser] User:', user?.email)
  console.log('[getUser] Error:', error)

  if (error || !user) {
    console.log('[getUser] No user found, attempting to get from session')
    // Fallback: essayer de récupérer depuis la session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('[getUser] Session user:', session?.user?.email)
    
    if (session?.user) {
      // Retourner un objet sérialisable
      return {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
        app_metadata: session.user.app_metadata,
      }
    }
    return null
  }

  // Retourner un objet sérialisable au lieu de l'objet User complet
  return user
}

export async function getAuthToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')
  return token?.value || null
}

export async function getUserProfile() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  console.log('User data:', user)

  if (userError || !user) {
    return null
  }

  // Récupérer le profil depuis la table "users"
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  console.log('Profile data:', profile)
  if (profileError) {
    console.error('Error fetching profile:', profileError)
    return null
  }

  return {
    user,
    profile,
  }
}