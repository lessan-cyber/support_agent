import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Récupérer l'utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Exemple: Récupérer des données depuis votre base de données
  // const { data: messages } = await supabase
  //   .from('messages')
  //   .select('*')
  //   .eq('user_id', user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue, {user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Statistiques</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Messages</p>
        </div>
        
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Activité</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Actions aujourd'hui</p>
        </div>
        
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Profil</h3>
          <p className="text-sm">ID: {user?.id.slice(0, 8)}...</p>
          <p className="text-sm text-muted-foreground">
            Créé le {new Date(user?.created_at || '').toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  )
}