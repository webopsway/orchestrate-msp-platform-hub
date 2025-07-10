import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionTestResult {
  current_team_var: string;
  is_msp_var: string;
  parsed_team: string | null;
  parsed_is_msp: boolean;
}

export const useSessionTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SessionTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testSessionVariables = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing PostgreSQL session variables...');
      
      const { data, error: rpcError } = await supabase.rpc('test_session_variables');

      if (rpcError) {
        throw new Error(`RPC Error: ${rpcError.message}`);
      }

      if (data && data.length > 0) {
        setResult(data[0]);
        console.log('Session variables test result:', data[0]);
      } else {
        throw new Error('No data returned from session test');
      }
    } catch (err: any) {
      console.error('Session test error:', err);
      setError(err.message || 'Erreur lors du test des variables de session');
    } finally {
      setLoading(false);
    }
  };

  const testAppSessionVariables = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Testing app session variables...');
      
      const { data, error: rpcError } = await supabase.rpc('get_app_session_variables');

      if (rpcError) {
        throw new Error(`RPC Error: ${rpcError.message}`);
      }

      console.log('App session variables:', data);
      return data?.[0] || null;
    } catch (err: any) {
      console.error('App session test error:', err);
      setError(err.message || 'Erreur lors du test des variables app');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    testSessionVariables,
    testAppSessionVariables,
    loading,
    result,
    error,
  };
};