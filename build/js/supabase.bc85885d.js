import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://fapruzhgfktbbdygerko.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ggWungI3Qt4RaCwgI_tEdw_z3z6w9fC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);