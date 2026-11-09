// Point d'entrée serverless Vercel — réutilise le serveur Express existant.
// Toutes les requêtes /api/* sont réécrites vers cette fonction (vercel.json).
import app from '../server/index.js';

export default app;
