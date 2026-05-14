# Guide de Containerisation du Frontend

## 📦 Fichiers créés

- **Dockerfile** : Configuration multi-stage pour build optimisé
- **docker-compose.yml** : Orchestration des services
- **.dockerignore** : Fichiers ignorés lors du build
- **.env.docker** : Template des variables d'environnement

## 🚀 Commandes de base

### Construire l'image Docker
```bash
docker-compose build
```

### Lancer le conteneur
```bash
docker-compose up
```

### Lancer en arrière-plan
```bash
docker-compose up -d
```

### Arrêter les conteneurs
```bash
docker-compose down
```

### Voir les logs
```bash
docker-compose logs -f frontend
```

### Reconstruire sans cache
```bash
docker-compose build --no-cache
```

## 🔧 Configuration

### Variables d'environnement
Les variables sont automatiquement chargées depuis votre `.env.local` via `docker-compose.yml`.

Si vous avez besoin de variables différentes pour Docker, créez un fichier `.env` à la racine du projet :

```bash
NEXT_PUBLIC_SUPABASE_URL=votre_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé
NEXT_PUBLIC_BACKEND_BASE_URL=http://backend:8000
```

### Port
Par défaut, le frontend est exposé sur le port **3000**. 
Vous pouvez le modifier dans `docker-compose.yml` :

```yaml
ports:
  - "3000:3000"  # Changez le premier port pour un autre externe
```

## 📊 Architecture Docker

```
Build Stage (builder)
  ├── Node 20 Alpine
  ├── Installation des dépendances
  └── Build Next.js

Production Stage
  ├── Node 20 Alpine (léger)
  ├── Dépendances de production uniquement
  ├── Application built copiée
  └── Healthcheck configuré
```

## ✅ Vérification du conteneur

```bash
# Vérifier le statut
docker-compose ps

# Accéder au shell du conteneur
docker-compose exec frontend sh

# Vérifier la santé
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 🔗 Intégration avec le Backend

Si vous avez un backend FastAPI ou autre, décommentez la section `backend` dans `docker-compose.yml` et mettez à jour :

```yaml
NEXT_PUBLIC_BACKEND_BASE_URL=http://backend:8000
```

## 🧹 Nettoyage

```bash
# Supprimer les conteneurs et volumes
docker-compose down -v

# Supprimer l'image
docker image rm frontend-frontend

# Nettoyage complet
docker system prune -a
```

## 🐛 Dépannage

### Le conteneur redémarre continuellement
- Vérifiez les logs : `docker-compose logs frontend`
- Vérifiez les variables d'environnement

### Port 3000 déjà utilisé
```bash
# Trouver ce qui utilise le port
lsof -i :3000

# Ou changer le port dans docker-compose.yml
ports:
  - "3001:3000"
```

### Problèmes de connexion Supabase
- Vérifiez que les variables d'environnement sont correctes
- Testez la connectivité réseau si les services communiquent

## 📈 Optimisations

Le Dockerfile utilise :
- ✅ Alpine Linux (images plus légères)
- ✅ Multi-stage build (réduit la taille finale)
- ✅ Cache Docker (accélère les rebuilds)
- ✅ Healthcheck (surveillance automatique)
- ✅ Volume pour node_modules (améliore les performances)

## 🎯 Prêt à utiliser !

Lancez simplement :

```bash
docker-compose up
```

Puis ouvrez http://localhost:3000 dans votre navigateur.
