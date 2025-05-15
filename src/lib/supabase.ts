/**
 * Supabase klient
 * 
 * OBS: Detta är bara ett skal för att kunna mocka i testerna
 */

export const supabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    session: jest.fn(),
    user: jest.fn(),
    onAuthStateChange: jest.fn()
  }
}; 