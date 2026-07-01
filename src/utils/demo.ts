/** Mode démo : désactive toutes les fonctionnalités d'administration.
 * Active via VITE_DEMO_MODE=true dans le .env
 */
export const demoMode: boolean =
  import.meta.env.VITE_DEMO_MODE === "true";
