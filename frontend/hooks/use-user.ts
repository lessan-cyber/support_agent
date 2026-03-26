'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getUserProfile } from '@/app/actions/auth'

/**
 * Represents a user profile with personal and account information.
 */
interface Profile {
  id: string
  name: string
  email: string
  avatar_url?: string
  bio?: string
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Custom hook to get the current authenticated user, their profile, and loading state.
 * Uses server action to fetch profile securely.
 * @returns {{ user: User | null, profile: Profile | null, loading: boolean }}
 */

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initUser = async () => {
      try {
        setLoading(true)
        const result = await getUserProfile()
        
        if (result) {
          setUser(result.user)
          setProfile(result.profile)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error initializing user:', error)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initUser()
  }, [])

  return { user, profile, loading }
}
