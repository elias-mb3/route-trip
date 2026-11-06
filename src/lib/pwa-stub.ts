// Substitui 'virtual:pwa-register/react' no build Android (--mode android), que não tem SW.
export function useRegisterSW(_?: unknown) {
  return { offlineReady: [false, (_: boolean) => {}] as const, needRefresh: [false, (_: boolean) => {}] as const, updateServiceWorker: async () => {} };
}
