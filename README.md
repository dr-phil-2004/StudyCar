# Instruction pour L'installation

-git clone https://github.com/dr-phil-2004/StudyCar.git

# Back-end
- Ouvrir le Depot github dans un editeur de code IntelliJ de preference pour faciliter l'installation de dependance spring boot
- Taper dans le terminale :
+  mvn clean compile -U 
+ docker compose up -d

- Appuyez sur le bouton Debug Ainsi vous demarrez le serveur du Back-end

# Front-end

Dans le terminale :

-Ouvrez le dossier /frontend: cd frontend

-tapez la commande d'installation des dépendances: npm install
-Démarrez le serveur: npm start


# ANALYSE RÉTROSPECTIVE & QUESTIONS STRATÉGIQUES

## 1. Recul sur vos choix : Qu'auriez-vous fait différemment dès le départ ?

### Architecture Frontend
- **Choix actuel** : React classique avec API REST
- **Aurait été mieux** : Next.js avec SSR/SSG pour
  - SEO amélioré (meilleur référencement)
  - Routing natif optimisé
  - Génération statique des pages publiques (liste des trajets)
  - API routes intégrées (évite CORS)

### Authentification & Sécurité
- **Choix actuel** : Authentification manuelle
- **Mieux** : OAuth 2.0 avec Google/Microsoft (login étudiants via emails institutionnels)
  - Évite gestion d'identifiants
  - Facilite SSO pour écoles multiples
  - Réduit les coûts support

### Caching & Real-time
- **Choix actuel** : WebSocket pour tracking uniquement
- **Mieux** : Redis pour cacher
  - Positions des bus (évite requêtes DB constantes)
  - Disponibilités des trajets
  - Réduirait charge DB de 80%

### Architecture Base de Données
- **Choix actuel** : Modèle relationnel simple
- **Mieux** : Hybrid (PostgreSQL + Elasticsearch)
  - Elasticsearch pour recherche de trajets rapide
  - Time-series DB (TimescaleDB) pour historique trajets/positions
  - Analyses géospatiales optimisées

---

## 2. Dette Technique : Quelles dettes avez-vous volontairement acceptées ?

| Category | Dette | Impact | Horizon résolution |
|----------|-------|--------|-------------------|
| **Testing** | Pas de tests automatisés (unit/integration) | Bugs en production, régression faciles | v1.1 (urgence si 50K utilisateurs) |
| **Logging** | Logging basique, pas centralisation | Debugging incidents impossible | v1.2 |
| **Monitoring** | Aucun monitoring/alertes | Downtime invisible jusqu'à complaints users | v1.3 |
| **API Versioning** | v1 monolithique sans gestion versions | Breaking changes cassent tous les clients mobiles | Immédiat pour MVP |
| **Documentation ** | Pas de Swagger/OpenAPI | Onboarding devs difficile | v1.1 |
| **Frontend Performance** | Pas d'optimisation (code splitting, lazy loading) | Temps de chargement >5s sur mobile | v1.2 |
| **Scalabilité DB** | Pas de sharding/partitioning | Requêtes lentes dès 10K utilisateurs | v1.4 (quand poids limite atteint) |
| **Gestion des erreurs** | Peu de validation input/edge cases | Crashes sur données mal formées | v1.1 |

**Justification** : Prioriser MVP et time-to-market sur perfection, mais STOPPER avant production si utilisateurs >1000

---

## 3. Passage à l'Échelle : 50 000 étudiants + 300 bus (heures de pointe)

### Scénario catastrophe

**Heure de pointe** : 8h-9h, 100 requêtes/sec → **Qu'est-ce qui casse en premier ?**

```
1️⃣ BASE DE DONNÉES (PREMIÈRE cascade)
   ├─ Requête "trajets disponibles" : 50K utilisateurs
   │  └─ SELECT * FROM trips WHERE departure_time BETWEEN 8:00 AND 9:00
   │     └─ 10 millions de résultats potentiels → TIMEOUT 30s
   ├─ Locking : 300 bus updateant positions simultanément
   │  └─ PostgreSQL bloque les écrivains
   └─ Connexions épuisées (default: 20 connexions)

2️⃣ Mémoire Backend (5-10 minutes après)
   ├─ WebSocket connections : 50K simultanés
   │  └─ ~1MB par connexion = 50GB RAM
   ├─ Spring Session non-configuré
   │  └─ Sessions en mémoire = OutOfMemoryError
   └─ Crash graduel Backend

3️⃣ Frontend (pendant ce temps)
   ├─ Bundle JS non-minifié ~500KB
   │  └─ Très lent sur 4G
   ├─ Pas de pagination search results
   │  └─ Rendre 1000 lignes = freeze 5s
   └─ Users abandonnent

4️⃣ Coût Infrastructure
   └─ Single server PostgreSQL → Auto-scaling impossible
```

### Solutions pour 50K users

```yaml
Architecture Cible:
├─ Frontend
│  ├─ CDN (Cloudflare) + cache statique 1h
│  ├─ Code splitting + lazy loading
│  └─ Pagination (20 résultats/page)

├─ Backend (Kubernetes - 10 instances)
│  ├─ Connection pooling (HikariCP, max 100)
│  ├─ Redis cache layer
│  │  ├─ Trajets disponibles : 30min TTL
│  │  ├─ Données utilisateurs : 5min TTL
│  │  └─ Positions bus : 10sec TTL
│  ├─ Message queue (RabbitMQ)
│  │  └─ Booking async → pas blocage
│  └─ Rate limiting : 100 req/min/user

├─ Database (PostgreSQL Cluster)
│  ├─ Read replicas (2x) pour requêtes
│  ├─ Partitioning temporal
│  │  └─ Trips partitionnés par DATE
│  ├─ Indexes optimisés
│  │  ├─ (departure_city, departure_time)
│  │  └─ (bus_id, datetime)
│  └─ Elasticsearch clone pour search
│     └─ "Trajets Paris→Lyon demain"

└─ Real-time
   ├─ Redis PubSub (pas WebSocket directe)
   ├─ Max 10 updates/sec/bus
   └─ Client-side throttling
```

### Points de rupture restants
- **Hotspot géographique** : Tous les bus gares routières = collisions GPS
  - **Solution** : Grid-based clustering (diviser maille géo)
- **Pics de réservation** : 1000 résa/sec sur même trajet
  - **Solution** : Optimistic locking + queue distribué
- **WebSocket surge** : 50K connexions simultanés
  - **Solution** : Message broker centralisé, pas connexions directes

---

## 4. Données Manquantes : Quelles informations demanderiez-vous ?

### Data de Terrain ❓

| Donnée | Décision activée | Priorité |
|--------|------------------|----------|
| **Capacité bus par catégorie** | Estimation passagers/trajet → pricing dynamique | 🔴 URGENT |
| **Zones de villes (géofences)** | Stop clustering + matching avec réalité GPS | 🔴 URGENT |
| **Tarification réelle/politique** | Freemium vs payant, prix/km | 🔴 URGENT |
| **Demande historique** | Trajets "rentables" vs subsides | 🟠 IMPORTANT |
| **Horaires réels vs horaires théoriques** | Lateness modeling → alertes réalistes | 🟠 IMPORTANT |
| **Chaffeur/bus assignment** | Optimisation shifts → coûts labor | 🟡 APRÈS MVP |
| **Weather/incidents data** | Prédiction retards | 🟡 APRÈS MVP |
| **Contraintes réglementaires** | Licences, assurance, routing légal | 🔴 URGENT |
| **Competing transport** | Taxi, Uber, transport public horaires | 🟡 APRÈS MVP |
| **Taux de no-show par étudiant** | Overbooking stratégie | 🟠 IMPORTANT |
| **Comportement annulation** | Users qui cancel = pattern de demande | 🟠 IMPORTANT |

### Impact manque data
- **Sans capacités réelles** → Double-booking possible
- **Sans géofences** → Trajets impossibles/dangereux
- **Sans demande historique** → Peut pas prévoir pics
- **Sans tarifs réels** → Revenus/rentabilité invisible

---

## 5. Mise en Production : Première itération avec vrais utilisateurs

### Phase 0 → Phase 1 (Semaines 1-2)

#### Phase 0 : Pilot interne (50 utilisateurs staff)
```
Objectifs :
├─ Tester flow complète (registration → booking → tracking)
├─ Détecter crashes critiques
├─ Valider données universités
└─ Collecter feedback UX

Risques réduits :
├─ Users contrôlés
├─ Nombre requêtes ~10/sec
├─ Facile rollback
└─ Cycles feedback rapides (daily)

Métriques :
├─ Taux error 0% (sinon rollback)
├─ Latence P95 < 2s
├─ Uptime 99.9%
└─ Aucun crash Backend
```

#### Phase 1 → Phase 2 (Semaines 2-4) : Étudiants 1 université

```
Invite : 1000 utilisateurs d'1 université seulement
│
├─ Pourquoi une seule ?
│  └─ Facilite debugging, test complet d'itinéraire
│
├─ Limit capacity par trajet : 70% (slack)
│  └─ Évite overbooking
│
├─ Booking 48h d'avance MAX
│  └─ Réduit edge cases, prévisibilité
│
├─ Monitoring 24/7
│  ├─ Logs centralisés (ELK stack)
│  ├─ Alertes crashes/latence
│  └─ Dashboard health
│
└─ Equipe dédiée sur-call
   ├─ Fixes critiques < 1h
   └─ Arrêt service si > 1% erreur
```

### Stratégie Rollout linéaire

```
Week 1-2  : 1 université    (1K users)  👈 Phase 1
Week 3-4  : 3 universités   (5K users)
Week 5-6  : 10 universités  (20K users)
Week 7-12 : Toutes (50K users)

À chaque palier :
├─ Attendre 2-3 jours = statique
├─ Vérifier P99 latence/erreurs/capacity
├─ Réunion go/no-go
└─ Si NO-GO → rollback 24h, fix, retry
```

### Must-have avant production

```
✅ Checklist déploiement:
  ├─ Database backup/restore automatique
  ├─ Monitoring + alerting
  ├─ Logs centralisés
  ├─ Feature flags (pouvoir disable/enable features)
  ├─ Rate limiting anti-abuse
  ├─ Input validation stricte (injection SQL)
  ├─ Testing 50 scénarios clés (booking workflow, cancellation, 3-way, etc)
  ├─ Disaster recovery plan documenté
  ├─ Secret management (pas de pwd en code)
  ├─ API versioning (v1/v2 support)
  └─ SLA document (availability, support hours)
```

### Succès signifie

```
✅ Métrique Phase 1 (1K users) :
   ├─ Uptime ≥ 99.5%
   ├─ P95 latence ≤ 2s
   ├─ Erreur rate ≤ 0.1%
   ├─ User NPS ≥ 7/10
   ├─ Taux completion booking ≥ 95%
   └─ Support tickets < 10/jour

❌ Rollback triggers :
   ├─ Uptime < 99%
   ├─ 1% erreur rate sustained
   ├─ > 100 support tickets/jour
   ├─ Any security breach
   └─ Database corruption
```

---

## Synthèse : Top 3 priorités avant 50K utilisateurs

1. **🔴 Database scaling** : Replica + caching + partitioning
2. **🔴 Monitoring & Alerting** : See problems before users
3. **🔴 Frontend performance** : Webpack optimization, code splitting

**Coût MVPs refonte** : ~2eme PM pour rework, ou choisir non-scaling aujourd'hui




