// Este archivo se mantiene para compatibilidad, pero no se utiliza realmente
// Todas las funcionalidades ahora son offline

// Implementación simulada para evitar errores
export const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null })
      }),
      order: () => ({ data: [], error: null }),
      in: () => ({ data: [], error: null }),
      lt: () => ({ data: [], error: null })
    }),
    insert: () => ({
      select: async () => ({ data: [], error: null })
    }),
    update: () => ({
      eq: async () => ({ error: null })
    })
  }),
  auth: {
    signUp: async () => ({ data: null, error: null }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null })
  }
};
