test('dotenv laddar variabler', () => {
  console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBeDefined();
  expect(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
}); 